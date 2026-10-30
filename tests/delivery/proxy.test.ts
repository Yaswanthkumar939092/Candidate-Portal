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

function callProxy(url: string, pathSegments: string[]) {
  return backendProxy(new NextRequest(url), {
    params: Promise.resolve({ path: pathSegments }),
  });
}

it("uses runtime upstream and preserves the path and query", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const res = await callProxy("http://portal/backend/api/method/login?a=1", ["api", "method", "login"]);
  expect(res.status).toBe(200);
  expect(lastCall?.url).toBe("http://frappe:8000/api/method/login?a=1");
});

it("sets Host and X-Frappe-Site-Name to the Frappe hostname", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  await callProxy("http://portal/backend/api/method/login", ["api", "method", "login"]);
  const sent = new Headers((lastCall!.init as RequestInit).headers);
  expect(sent.get("host")).toBe("frappe:8000");
  expect(sent.get("x-frappe-site-name")).toBe("frappe");
});

it("cannot replace the configured origin with a double slash path", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  // The leading empty segment is what Next's catch-all would hand us for
  // `/backend//evil.test/file`; the proxy must still send to `frappe:8000`.
  await callProxy("http://portal/backend//evil.test/file", ["", "evil.test", "file"]);
  expect(new URL(lastCall!.url).host).toBe("frappe:8000");
});

it.each(["", "https://user:password@example.test", "file:///etc/passwd", "https://example.test/path"])(
  "fails closed for invalid runtime configuration %s", async (value) => {
    vi.stubEnv("FRAPPE_BASE_URL", value);
    const res = await callProxy("http://portal/backend/api", ["api"]);
    expect(res.status).toBe(503);
    expect(lastCall).toBeNull();
  },
);

it("health is independent of backend availability", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "");
  expect(healthGet().status).toBe(200);
  expect(await healthGet().json()).toEqual({ status: "ok" });
});
