import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


import { getServerFeatureFlags, isServerFeatureEnabled } from "@/lib/server/feature-flags";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://backend.test");
  vi.stubEnv("FRAPPE_API_KEY", "");
  vi.stubEnv("FRAPPE_API_SECRET", "");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("server feature flags (Guest v1, no API key)", () => {
  it("reads careers_public_enabled from the Guest v1 method and sends no credentials", async () => {
    const spy = vi.fn(async (_u: string, _i?: RequestInit) => json({ message: { careers_public_enabled: true } }));
    vi.stubGlobal("fetch", spy);
    expect(await isServerFeatureEnabled("careers_public_enabled")).toBe(true);
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toBe("http://backend.test/api/method/recruitment.api.v1.candidate.get_public_flags");
    expect(JSON.stringify((init as RequestInit | undefined)?.headers ?? {})).not.toMatch(/token|authorization/i);
  });

  it("works when no API key is configured (no early return)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: { careers_public_enabled: false } })));
    expect(await getServerFeatureFlags()).toEqual({ careers_public_enabled: false });
  });

  it("treats an unknown, missing or non-true flag as off", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: { careers_public_enabled: "no" } })));
    expect(await isServerFeatureEnabled("careers_public_enabled")).toBe(false);
    expect(await isServerFeatureEnabled("something_else")).toBe(false);
  });

  it("returns an empty object when the backend errors or is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({}, 500)));
    expect(await getServerFeatureFlags()).toEqual({});
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    expect(await getServerFeatureFlags()).toEqual({});
  });

  it("returns an empty object when no backend URL is configured", async () => {
    vi.stubEnv("FRAPPE_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "");
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await getServerFeatureFlags()).toEqual({});
    expect(spy).not.toHaveBeenCalled();
  });
});
