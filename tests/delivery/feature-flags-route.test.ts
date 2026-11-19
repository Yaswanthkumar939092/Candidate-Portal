import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/candidate-feature-flags/route";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://backend.test");
  vi.stubEnv("FRAPPE_API_KEY", "");
  vi.stubEnv("FRAPPE_API_SECRET", "");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("GET /api/candidate-feature-flags (no API key)", () => {
  it("returns flags from the Guest v1 method without any API credentials configured", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: { careers_public_enabled: true } })));
    const res = await GET(new Request("http://portal/api/candidate-feature-flags"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ flags: { careers_public_enabled: true } });
  });

  it("returns empty flags (all off) when the backend is down, not a 500", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const res = await GET(new Request("http://portal/api/candidate-feature-flags"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ flags: {} });
  });

  // With the candidate's session cookie forwarded, the route also picks up the
  // authenticated Candidate Portal Feature Flag doctype values (open_jobs,
  // my_jobs, action_center …) and merges them into the response.
  // Spec: CAND-02-A8.2A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a8-2a)
  it("forwards the incoming cookie so authenticated page-level flags reach the browser", async () => {
    const spy = vi.fn(async (url: string) => {
      if (String(url).includes("get_public_flags")) {
        return json({ message: { careers_public_enabled: false } });
      }
      return json({ message: { open_jobs: 1, my_jobs: 1, action_center: 0 } });
    });
    vi.stubGlobal("fetch", spy);

    const req = new Request("http://portal/api/candidate-feature-flags", {
      headers: { cookie: "sid=candidate-token" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      flags: {
        careers_public_enabled: false,
        open_jobs: true,
        my_jobs: true,
        action_center: false,
      },
    });
    const authCall = spy.mock.calls.find(([u]) => String(u).includes("get_candidate_feature_flags"));
    expect(authCall).toBeTruthy();
    const headers = new Headers((authCall![1] as RequestInit).headers);
    expect(headers.get("cookie")).toBe("sid=candidate-token");
  });
});
