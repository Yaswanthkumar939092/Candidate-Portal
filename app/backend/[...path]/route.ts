import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
// `/backend` is a thin per-request proxy: nothing in it is safe to cache,
// and we need the real browser Cookie header on every call for session auth.
export const dynamic = "force-dynamic";

/**
 * Same-origin reverse proxy to the Frappe backend, limited to ALLOWED_METHODS.
 *
 * A since-removed `middleware.ts` did this with `NextResponse.rewrite()`, but on Vercel
 * cross-origin rewrites don't honor custom headers set via `request.headers` —
 * the `Host` and `X-Frappe-Site-Name` overrides were being dropped before the
 * request left the edge, so Frappe saw `Host: <frontend>.vercel.app` and
 * answered "<frontend>.vercel.app does not exist" with a 404 HTML page.
 *
 * A Node-runtime Route Handler runs as a serverless function with raw `fetch`,
 * so we can set those headers for real. Why this is still the right shape:
 * - keeps the browser call same-origin (`/backend/…`), so the Frappe session
 *   cookie remains first-party and iOS Safari / Chrome ITP leave it alone;
 * - the proxy's own target comes from a runtime env var, so flipping Frappe
 *   environments is a redeploy-free setting change on Vercel.
 */

type RouteContext = { params: Promise<{ path: string[] }> };

function targetBase(): URL | null {
  const raw = (process.env.FRAPPE_BASE_URL || "").replace(/\/$/, "");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // Mirror the old middleware's guard: anything other than a bare origin
    // URL is a misconfiguration we don't want to silently honour.
    if (
      !["http:", "https:"].includes(u.protocol) ||
      u.username || u.password || u.search || u.hash ||
      (u.pathname && u.pathname !== "/")
    ) {
      return null;
    }
    return u;
  } catch {
    return null;
  }
}

// Headers that break if copied blindly from either side of the proxy. The
// client's `host` is wrong for Frappe (fixed below), hop-by-hop headers like
// `connection`/`keep-alive`/`te`/`trailer`/`upgrade` must not be forwarded,
// and `content-length` is recomputed from the streamed body.
const DROP_FROM_CLIENT = new Set([
  "host",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-for",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

// Response-side hop-by-hop headers. `content-encoding` and `transfer-encoding`
// in particular would double-encode or confuse Vercel's edge if passed through.
const DROP_FROM_UPSTREAM = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
]);

// The browser may reach only these reviewed candidate API methods. Everything
// else on Frappe (desk, /api/resource, private files, other whitelisted
// methods) answers 404 here, whatever cookie the caller sends. Add a method only
// after reviewing it in cn-recruitment at the version Operate runs (OPS-507).
const ALLOWED_METHODS = new Set([
  ...["list_openings", "get_opening", "get_application_fields", "submit_application", "my_applications", "get_application"].map(name => `recruitment.api.v1.candidate.${name}`),
  ...["get_auth_settings", "get_auth_page_content", "login", "signup", "request_email_signup_otp", "request_otp", "verify_otp", "logout", "me"].map(name => `recruitment.api.candidate_auth.${name}`),
  "recruitment.api.candidate_portal.get_website_branding",
  // Guest read of admin-set promotion copy; no candidate data (OPS-507).
  "recruitment.api.candidate_home.get_home_content",
  // Saved jobs, drafts and application detail: fixed and reviewed in cn-recruitment
  // #1688 (OPS-508). Each checks the session candidate's identity.
  ...["get_saved_job_openings", "toggle_saved_job_opening", "get_draft", "delete_draft"].map(name => `recruitment.api.channels.careers.${name}`),
  "recruitment.api.draft_application.get_job_applicant",
  // Job offer and DPDP consent (reviewed OPS-15). Each needs the signed offer token,
  // desk permission or, for the PDF and culture book, the owning candidate's session;
  // get_rejection_reasons is public master data. #1688 added released-offer filters
  // inside the offer methods; get_job_offer_status still lacks one (OPS-509).
  ...["get_job_offer_summary", "get_job_offer_status", "download_job_offer_pdf", "preview_culture_book", "job_offer_update", "get_rejection_reasons"].map(name => `recruitment.job_offer_utils.${name}`),
  "recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form",
  "recruitment.dpdp_external_consent.start_consent_session",
  "recruitment.dpdp_external_consent.get_consent_session_status",
  "recruitment.dpdp_consent.submit_dpdp_consent",
  // Candidate portal flows reviewed 2026-11-19. Every one is scoped to the caller:
  // a Candidate Portal session checked against the record (candidate_required +
  // get_current_candidate / enforce_candidate_identity / *_for_candidate), or a
  // hashed link token for the emailed CTC proposal and direct-applicant links.
  // Action Center: needs cn-recruitment's portal-session scoping
  // (fix/action-center-caller-scope); before it, the method trusted the email
  // from the query string and returned other candidates' signed offer links.
  "recruitment.api.action_center.get_action_center_items",
  ...["change_password", "set_password", "update_me"].map(name => `recruitment.api.candidate_auth.${name}`),
  "recruitment.api.candidate_portal.get_candidate_portal_form",
  ...["get_post_login_route", "submit_survey"].map(name => `recruitment.api.candidate_portal_survey.${name}`),
  ...["get_application_fields", "get_form_state", "submit_application"].map(name => `recruitment.api.channels.pre_offer.${name}`),
  ...["get_proposal", "respond", "get_my_proposal", "respond_my_proposal"].map(name => `recruitment.api.ctc_proposal_portal.${name}`),
  ...["get_form", "search_link", "submit_form", "upload_file", "get_my_form", "search_my_link", "submit_my_form", "upload_my_file", "download_my_file"].map(name => `recruitment.api.direct_applicant_portal.${name}`),
  "recruitment.api.employee_onboarding.update_onboarding_details",
  "recruitment.api.joining_day.get_my_non_working_days",
  "recruitment.api.onboarding_dashboard.get_dashboard",
  ...["upload_my_onboarding_file", "download_my_onboarding_file"].map(name => `recruitment.api.onboarding_files.${name}`),
  // Not yet: recruitment.api.candidate_portal.get_link_field_options (lists any
  // doctype's records to any candidate), frappe.client.get_meta and upload_file
  // (generic Frappe endpoints), recruitment.api.channels.campus.* (invite id +
  // email, no token). Each needs a backend restriction first.
]);

// Methods that change data answer only to POST here. The session cookie is
// SameSite=Lax (Candidate Portal Auth Settings), so a cross-site link (GET) still
// carries it; a cross-site POST does not.
const POST_ONLY_METHODS = new Set([
  "recruitment.api.channels.careers.toggle_saved_job_opening",
  "recruitment.api.channels.careers.delete_draft",
  "recruitment.job_offer_utils.job_offer_update",
  "recruitment.dpdp_external_consent.start_consent_session",
  "recruitment.dpdp_consent.submit_dpdp_consent",
  ...["change_password", "set_password", "update_me"].map(name => `recruitment.api.candidate_auth.${name}`),
  "recruitment.api.candidate_portal_survey.submit_survey",
  "recruitment.api.channels.pre_offer.submit_application",
  ...["respond", "respond_my_proposal"].map(name => `recruitment.api.ctc_proposal_portal.${name}`),
  ...["submit_form", "upload_file", "submit_my_form", "upload_my_file"].map(name => `recruitment.api.direct_applicant_portal.${name}`),
  "recruitment.api.employee_onboarding.update_onboarding_details",
  "recruitment.api.onboarding_files.upload_my_onboarding_file",
]);

// Decode the raw path (repeatedly, so double-encoding cannot smuggle a denied
// route past the check) and return it only if it names an allowed method.
function allowedPath(pathname: string): string | null {
  let path = pathname.slice("/backend".length) || "/";
  try {
    for (let i = 0; i < 3; i++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    }
  } catch {
    return null;
  }
  if (path.includes("%")) return null;
  const prefix = "/api/method/";
  if (!path.startsWith(prefix) || !ALLOWED_METHODS.has(path.slice(prefix.length))) return null;
  return path;
}

async function proxy(req: NextRequest, _ctx: RouteContext) {
  const path = allowedPath(req.nextUrl.pathname);
  if (!path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (POST_ONLY_METHODS.has(path.slice("/api/method/".length)) && req.method.toUpperCase() !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "POST" } });
  }

  const target = targetBase();
  if (!target) {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }

  // Assign the checked pathname rather than resolve user input as a URL, so
  // the request always stays on the configured upstream.
  const upstreamUrl = new URL(target.toString());
  upstreamUrl.pathname = path;
  upstreamUrl.search = req.nextUrl.search;

  const upstreamHeaders = new Headers();
  for (const [name, value] of req.headers) {
    if (!DROP_FROM_CLIENT.has(name.toLowerCase())) {
      upstreamHeaders.set(name, value);
    }
  }
  // Frappe's multi-tenant site resolution looks at `Host` and
  // `X-Frappe-Site-Name` — both must name the actual Frappe hostname,
  // not the Vercel domain the browser called.
  upstreamHeaders.set("host", target.host);
  upstreamHeaders.set("x-frappe-site-name", target.hostname);

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body: hasBody ? req.body : undefined,
      // Node 20's fetch requires `duplex: "half"` when streaming a request
      // body — the type definition hasn't caught up yet.
      ...(hasBody ? { duplex: "half" as const } : {}),
      redirect: "manual",
      cache: "no-store",
    } as RequestInit);
  } catch {
    return NextResponse.json({ error: "Backend request failed" }, { status: 502 });
  }

  const resHeaders = new Headers();
  for (const [name, value] of upstreamRes.headers) {
    if (!DROP_FROM_UPSTREAM.has(name.toLowerCase())) {
      resHeaders.append(name, value);
    }
  }

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
