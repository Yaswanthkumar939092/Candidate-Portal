import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";
import { GET } from "../../app/api/health/route";

afterEach(() => vi.unstubAllEnvs());

it("uses runtime upstream and preserves the path and query", () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const result = middleware(new NextRequest("http://portal/backend/api/method/login?a=1"));
  expect(result.headers.get("x-middleware-rewrite")).toBe("http://frappe:8000/api/method/login?a=1");
});
it("cannot replace the configured origin with a double slash path", () => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://frappe:8000");
  const result = middleware(new NextRequest("http://portal/backend//evil.test/file"));
  expect(new URL(result.headers.get("x-middleware-rewrite")!).host).toBe("frappe:8000");
});
it.each(["", "https://user:password@example.test", "file:///etc/passwd", "https://example.test/path"])(
  "fails closed for invalid runtime configuration %s", (value) => {
    vi.stubEnv("FRAPPE_BASE_URL", value);
    const result = middleware(new NextRequest("http://portal/backend/api"));
    expect(result.status).toBe(503);
    expect(result.headers.get("x-middleware-rewrite")).toBeNull();
  },
);
it("health is independent of backend availability", async () => {
  vi.stubEnv("FRAPPE_BASE_URL", "");
  expect(GET().status).toBe(200);
  expect(await GET().json()).toEqual({ status: "ok" });
});
