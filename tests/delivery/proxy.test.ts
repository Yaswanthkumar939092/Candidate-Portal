import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as backendProxy } from "../../app/backend/[...path]/route";
import { GET as healthGet } from "../../app/api/health/route";

// A per-case fetch stub so we can inspect what the proxy sent upstream without
// touching the network. Vitest's fetch is global, so restore it between tests.
const originalFetch = globalThis.fetch;
let lastCall: { url: string; init?: RequestInit } | null = null;

beforeEach(() => {
  lastCall = null;
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    lastCall = { url: typeof input === "string" ? input : (input as URL).toString(), init };
    return new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });
  }) as typeof fetch;
});

afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.fetch = originalFetch;
});

function callProxy(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  const req = new NextRequest(url, init);
  const segments = req.nextUrl.pathname.slice("/backend/".length).split("/");
  return backendProxy(req, { params: Promise.resolve({ path: segments }) });
}

async function expectDenied(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  const res = await callProxy(url, init);
  expect(res.status).toBe(404);
  expect(lastCall).toBeNull();
}

// Spec: CAND-02-A3.4A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-4a)
it("uses runtime upstream and preserves the path and query", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy("http://portal/backend/api/method/recruitment.api.candidate_auth.login?a=1");
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe("http://frappe:8000/api/method/recruitment.api.candidate_auth.login?a=1");
});

it("sets Host and X-Frappe-Site-Name to the Frappe hostname", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await callProxy("http://portal/backend/api/method/recruitment.api.candidate_auth.login");
  const sent = new Headers((lastCall!.init as RequestInit).headers);
  expect(sent.get("host")).toBe("frappe:8000");
  expect(sent.get("x-frappe-site-name")).toBe("frappe");
});

it.each(["/backend/app", "/backend/private/files/resume.pdf", "/backend/api/resource/Job Applicant", "/backend/api/method/frappe.client.get_list", "/backend/api/method/frappe.desk.form.load.getdoc", "/backend/api/method/erpnext.hr.doctype.employee.employee.get_employee_details"])(
  "does not proxy an anonymous internal or private route %s", async (path) => {
    vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
    await expectDenied(`http://portal${path}`);
  },
);

it.each([
  "/backend/api/resource/Job%20Applicant",
  "/backend/api/resource/Job Applicant",
  "/backend/private/files/resume.pdf",
  "/backend/app",
])("does not treat a caller-supplied cookie as authorization for %s", async (path) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal${path}`, { headers: { cookie: "candidate_portal_session=placeholder" } });
});

it.each([
  "/backend/%61pp",
  "/backend/api/%72esource/Job%20Applicant",
  "/backend/api/%2572esource/Job%20Applicant",
  "/backend/api/%25252572esource/Job%20Applicant",
  "/backend/api/%ZZresource/Job%20Applicant",
  "/backend/api/method/%66rappe.client.get_list",
  "/backend/api/resource%2FJob%20Applicant",
])("does not allow encoded internal route %s", async (path) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal${path}`);
});

it.each([
  "/backend/api/method/recruitment.api.v1.candidate.list_openings",
  "/backend/api/method/recruitment.api.v1.candidate.submit_application",
  "/backend/api/method/recruitment.api.candidate_auth.login",
])("proxies the candidate API route %s without granting backend permissions", async (path) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy(`http://portal${path}`);
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000${path.slice("/backend".length)}`);
});

it.each([
  "/backend/api/method/frappe.client.get_meta?doctype=EducationMeta",
  "/backend/api/resource/Candidate%20Raise%20Request",
])("keeps an existing client call gated pending scoped permission design: %s", async (path) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal${path}`, { headers: { cookie: "candidate_portal_session=placeholder" } });
});

// Spec: CAND-02-A3.4B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-4b)
it("cannot replace the configured origin with a double slash path", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied("http://portal/backend//evil.test/file");
});

it.each(["", "https://user:password@example.test", "file:///etc/passwd", "https://example.test/path"])(
  "fails closed for invalid runtime configuration %s", async (value) => {
    vi.stubEnv("FRAPPE_BASE_URL", value);
    const res = await callProxy("http://portal/backend/api/method/recruitment.api.v1.candidate.list_openings");
    expect(res.status).toBe(503);
    expect(lastCall).toBeNull();
  },
);

// Spec: CAND-02-A4.1B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a4-1b)
it("health is independent of backend availability", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "");
  expect(healthGet().status).toBe(200);
  expect(await healthGet().json()).toEqual({ status: "ok" });
});

it.each(["recruitment.api.channels.careers.submit_application", "recruitment.api.v1.candidate._session_email", "recruitment.api.candidate_portal.get_onboarding_fields", "login", "recruitment.api.v1.candidate.list_openings/extra"])("denies methods outside the reviewed surface: %s", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal/backend/api/method/${method}`);
});
it.each([
  "/backend/api/method/recruitment.api.candidate_auth.get_auth_page_content",
  "/backend/api/method/recruitment.api.candidate_portal.get_website_branding",
])("proxies the Guest read-only page content route %s", async (path) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy(`http://portal${path}`);
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000${path.slice("/backend".length)}`);
});
// OPS-507: the home promotion method passed review (allow_guest, read-only, admin copy).
it("proxies the reviewed Guest home promotion route", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const path = "/backend/api/method/recruitment.api.candidate_home.get_home_content";
  const res = await callProxy(`http://portal${path}`);
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000${path.slice("/backend".length)}`);
});

it.each([
  "recruitment.api.candidate_home.get_home_contentx",
  "recruitment.api.candidate_home._image",
  "recruitment.api.candidate_home.get_home_content/extra",
  "recruitment.api.candidate_home",
  "recruitment.api.candidate_home.frappe.get_doc",
])("denies the home promotion route's neighbour %s", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal/backend/api/method/${method}`);
});

// OPS-15: fixed and reviewed in cn-recruitment #1688 (OPS-508).
const READ_METHODS_508 = [
  "recruitment.api.channels.careers.get_saved_job_openings",
  "recruitment.api.channels.careers.get_draft",
  "recruitment.api.draft_application.get_job_applicant",
  "recruitment.job_offer_utils.get_job_offer_summary",
  "recruitment.job_offer_utils.get_job_offer_status",
  "recruitment.job_offer_utils.download_job_offer_pdf",
  "recruitment.job_offer_utils.preview_culture_book",
  "recruitment.job_offer_utils.get_rejection_reasons",
  "recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form",
  "recruitment.dpdp_external_consent.get_consent_session_status",
];
const WRITE_METHODS_508 = [
  "recruitment.api.channels.careers.toggle_saved_job_opening",
  "recruitment.api.channels.careers.delete_draft",
  "recruitment.job_offer_utils.job_offer_update",
  "recruitment.dpdp_external_consent.start_consent_session",
  "recruitment.dpdp_consent.submit_dpdp_consent",
];

it.each(READ_METHODS_508)("proxies the reviewed candidate read %s", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy(`http://portal/backend/api/method/${method}?appl=HR-APP-1`, { headers: { cookie: "candidate_portal_session=placeholder" } });
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000/api/method/${method}?appl=HR-APP-1`);
});

it.each(WRITE_METHODS_508)("proxies the reviewed candidate write %s by POST", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy(`http://portal/backend/api/method/${method}`, { method: "POST", body: "{}", headers: { cookie: "candidate_portal_session=placeholder", "content-type": "application/json" } });
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000/api/method/${method}`);
  expect(lastCall?.init?.method).toBe("POST");
});

it.each(WRITE_METHODS_508.flatMap(method => ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"].map(verb => [method, verb])))(
  "refuses %s by %s before it reaches Frappe", async (method, verb) => {
    vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
    const res = await callProxy(`http://portal/backend/api/method/${method}`, { method: verb, headers: { cookie: "candidate_portal_session=placeholder" } });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
    expect(lastCall).toBeNull();
  },
);

it.each([
  "recruitment.api.channels.careers.get_draftx",
  "recruitment.api.channels.careers._find_draft",
  "recruitment.api.channels.careers.get_saved_job_openings/extra",
  "recruitment.api.channels.campus.delete_draft",
  "recruitment.api.draft_application.save_candidate_portal_data",
  "recruitment.job_offer_utils._authorize_offer",
  "recruitment.job_offer_utils.preview_job_offer_html",
  "recruitment.job_offer_utils.get_job_offer_print_preview_url",
  "recruitment.dpdp_consent._existing_submitted_log",
])("denies the neighbour %s of a reviewed candidate method", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal/backend/api/method/${method}`, { method: "POST", headers: { cookie: "candidate_portal_session=placeholder" } });
});

// Candidate portal flows reviewed 2026-11-19 (Action Center, CTC proposal, direct
// applicant form, onboarding, pre-offer, profile, survey). Each is scoped to the
// caller's Candidate Portal session or a hashed link token in cn-recruitment.
const READ_METHODS_PORTAL = [
  "recruitment.api.action_center.get_action_center_items",
  "recruitment.api.candidate_portal.get_candidate_portal_form",
  "recruitment.api.candidate_portal_survey.get_post_login_route",
  "recruitment.api.channels.pre_offer.get_application_fields",
  "recruitment.api.channels.pre_offer.get_form_state",
  "recruitment.api.ctc_proposal_portal.get_proposal",
  "recruitment.api.ctc_proposal_portal.get_my_proposal",
  "recruitment.api.direct_applicant_portal.get_form",
  "recruitment.api.direct_applicant_portal.get_my_form",
  "recruitment.api.direct_applicant_portal.search_link",
  "recruitment.api.direct_applicant_portal.search_my_link",
  "recruitment.api.direct_applicant_portal.download_my_file",
  "recruitment.api.joining_day.get_my_non_working_days",
  "recruitment.api.candidate_portal.get_link_field_options",
  "recruitment.api.onboarding_dashboard.get_dashboard",
  "recruitment.api.onboarding_files.download_my_onboarding_file",
];
const WRITE_METHODS_PORTAL = [
  "recruitment.api.candidate_auth.change_password",
  "recruitment.api.candidate_auth.set_password",
  "recruitment.api.candidate_auth.update_me",
  "recruitment.api.candidate_portal_survey.submit_survey",
  "recruitment.api.channels.pre_offer.submit_application",
  "recruitment.api.ctc_proposal_portal.respond",
  "recruitment.api.ctc_proposal_portal.respond_my_proposal",
  "recruitment.api.direct_applicant_portal.submit_form",
  "recruitment.api.direct_applicant_portal.upload_file",
  "recruitment.api.direct_applicant_portal.submit_my_form",
  "recruitment.api.direct_applicant_portal.upload_my_file",
  "recruitment.api.employee_onboarding.update_onboarding_details",
  "recruitment.api.onboarding_files.upload_my_onboarding_file",
];

it.each(READ_METHODS_PORTAL)("proxies the portal read %s", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy(`http://portal/backend/api/method/${method}?candidate_email=a%40example.com`, { headers: { cookie: "candidate_portal_session=placeholder" } });
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000/api/method/${method}?candidate_email=a%40example.com`);
});

it.each(WRITE_METHODS_PORTAL)("proxies the portal write %s by POST", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy(`http://portal/backend/api/method/${method}`, { method: "POST", body: "{}", headers: { cookie: "candidate_portal_session=placeholder", "content-type": "application/json" } });
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000/api/method/${method}`);
  expect(lastCall?.init?.method).toBe("POST");
});

it.each(WRITE_METHODS_PORTAL.flatMap(method => ["GET", "PUT", "DELETE"].map(verb => [method, verb])))(
  "refuses the portal write %s by %s before it reaches Frappe", async (method, verb) => {
    vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
    const res = await callProxy(`http://portal/backend/api/method/${method}`, { method: verb, headers: { cookie: "candidate_portal_session=placeholder" } });
    expect(res.status).toBe(405);
    expect(lastCall).toBeNull();
  },
);

it.each([
  "recruitment.api.action_center.complete_action_center_item",
  "recruitment.api.action_center.archive_action_center_item",
  "recruitment.api.ctc_proposal_portal._proposal_for",
  "recruitment.api.direct_applicant_portal._request_for",
  "recruitment.api.onboarding_files._upload",
])("denies the neighbour %s of a portal method", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal/backend/api/method/${method}`, { method: "POST", headers: { cookie: "candidate_portal_session=placeholder" } });
});

// The Link dropdowns' picker. The backend (cn-recruitment a812ad8c) limits it to
// a candidate session and its reference-doctype allowlist; the proxy forwards the
// picker's query (doctype, search, include, dependent filters) untouched and lets
// Frappe decide, so a doctype outside that allowlist is Frappe's 404, not ours.
it("forwards a Link dropdown lookup with its query unchanged", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const query = "doctype=Education+Stage&txt=Grad&limit=20&include=10th&state=Bihar";
  const res = await callProxy(
    `http://portal/backend/api/method/recruitment.api.candidate_portal.get_link_field_options?${query}`,
    { headers: { cookie: "candidate_portal_session=placeholder" } },
  );
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe(`http://frappe:8000/api/method/recruitment.api.candidate_portal.get_link_field_options?${query}`);
  expect(lastCall?.init?.method).toBe("GET");
  expect(new Headers(lastCall?.init?.headers).get("cookie")).toBe("candidate_portal_session=placeholder");
});

it("does not open the Link picker's neighbours", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  for (const method of [
    "recruitment.api.candidate_portal.get_link_field_options/extra",
    "recruitment.api.candidate_portal.get_link_field_options_v2",
    "recruitment.api.candidate_portal.get_child_doctype_fields",
  ]) {
    await expectDenied(`http://portal/backend/api/method/${method}`, { headers: { cookie: "candidate_portal_session=placeholder" } });
  }
});

// These stay denied until the backend restricts them: get_meta and upload_file
// are generic Frappe endpoints; campus invites are reachable by invite id + email.
it.each([
  "frappe.client.get_meta",
  "upload_file",
  "recruitment.api.channels.campus.get_invite_openings",
  "recruitment.api.channels.campus.submit_invite_application",
])("keeps the method %s denied", async (method) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal/backend/api/method/${method}`, { headers: { cookie: "candidate_portal_session=placeholder" } });
});

it.each([
  "/backend/api/method/recruitment.api.candidate_portal.get_candidate_feature_flags",
  "/backend/api/method/recruitment.api.v1.candidate.get_public_flags",
  "/backend/api/method/recruitment.api.channels.careers.list_openings",
])("keeps %s denied at the browser proxy", async (path) => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await expectDenied(`http://portal${path}`);
});
