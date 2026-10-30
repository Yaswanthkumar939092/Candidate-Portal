import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
// `/backend` is a thin per-request proxy: nothing in it is safe to cache,
// and we need the real browser Cookie header on every call for session auth.
export const dynamic = "force-dynamic";

/**
 * Same-origin reverse proxy to the Frappe backend.
 *
 * `middleware.ts` used to do this with `NextResponse.rewrite()`, but on Vercel
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

async function proxy(req: NextRequest, ctx: RouteContext) {
  const target = targetBase();
  if (!target) {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }

  const { path } = await ctx.params;
  const upstreamUrl = new URL(target.toString());
  upstreamUrl.pathname = "/" + (path?.join("/") ?? "");
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
