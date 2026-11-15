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
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ flags: { careers_public_enabled: true } });
  });

  it("returns empty flags (all off) when the backend is down, not a 500", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ flags: {} });
  });
});
