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

describe("server feature flags (authenticated doctype read)", () => {
  // With a candidate's session cookie, also read the authenticated
  // `get_candidate_feature_flags` method and merge it over the Guest result.
  // That method returns the Candidate Portal Feature Flag doctype's page-level
  // toggles (open_jobs, my_jobs, action_center, documents, candidate_dashboard …).
  // Spec: CAND-02-A8.1A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a8-1a)
  it("forwards the candidate session cookie to the authenticated endpoint and merges on top of Guest flags", async () => {
    const spy = vi.fn(async (url: string, _init?: RequestInit) => {
      if (String(url).includes("get_public_flags")) {
        return json({ message: { careers_public_enabled: false } });
      }
      return json({ message: { open_jobs: 1, my_jobs: 0, action_center: 1 } });
    });
    vi.stubGlobal("fetch", spy);

    const flags = await getServerFeatureFlags("sid=abc123; other=1");

    expect(flags).toEqual({
      careers_public_enabled: false,
      open_jobs: true,
      my_jobs: false,
      action_center: true,
    });
    // The authenticated call must carry the candidate's session cookie, or
    // Frappe can't resolve the caller and would answer Guest.
    const authCall = spy.mock.calls.find(([u]) => String(u).includes("get_candidate_feature_flags"));
    expect(authCall).toBeTruthy();
    const authHeaders = new Headers((authCall![1] as RequestInit).headers);
    expect(authHeaders.get("cookie")).toBe("sid=abc123; other=1");
  });

  // Spec: CAND-02-A8.1B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a8-1b)
  it("falls back to Guest-only flags when the authenticated endpoint errors", async () => {
    const spy = vi.fn(async (url: string) => {
      if (String(url).includes("get_public_flags")) {
        return json({ message: { careers_public_enabled: true } });
      }
      return json({ message: "Not permitted" }, 403);
    });
    vi.stubGlobal("fetch", spy);

    expect(await getServerFeatureFlags("sid=abc123")).toEqual({ careers_public_enabled: true });
  });

  // Spec: CAND-02-A8.1C (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a8-1c)
  it("does not call the authenticated endpoint without a cookie", async () => {
    const spy = vi.fn(async () => json({ message: { careers_public_enabled: true } }));
    vi.stubGlobal("fetch", spy);

    await getServerFeatureFlags();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain("get_public_flags");
  });

  // Spec: CAND-02-A8.1D (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a8-1d)
  it("does not call the authenticated endpoint when the cookie is empty", async () => {
    const spy = vi.fn(async () => json({ message: { careers_public_enabled: true } }));
    vi.stubGlobal("fetch", spy);

    await getServerFeatureFlags("");

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
