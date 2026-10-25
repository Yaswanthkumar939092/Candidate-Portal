import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/public/branding/route";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://backend.test");
  vi.stubEnv("FRAPPE_API_KEY", "");
  vi.stubEnv("FRAPPE_API_SECRET", "");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("GET /api/public/branding (Guest method, no API key)", () => {
  it("fetches the Guest branding method and sends no credentials", async () => {
    const spy = vi.fn(async (_u: string, _i?: RequestInit) => json({ message: { logo: "/files/x.png" } }));
    vi.stubGlobal("fetch", spy);
    const res = await GET();
    expect(await res.json()).toEqual({ branding: { logo: "/files/x.png" } });
    const [url, init] = spy.mock.calls[0];
    expect(String(url)).toBe("http://backend.test/api/method/recruitment.api.candidate_portal.get_website_branding");
    expect(JSON.stringify((init as RequestInit | undefined)?.headers ?? {})).not.toMatch(/token|authorization/i);
  });

  it("returns empty branding when the backend fails or is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({}, 500)));
    expect(await (await GET()).json()).toEqual({ branding: {} });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("x"); }));
    expect(await (await GET()).json()).toEqual({ branding: {} });
  });

  it("returns empty branding without calling out when no backend URL is configured", async () => {
    vi.stubEnv("FRAPPE_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "");
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await (await GET()).json()).toEqual({ branding: {} });
    expect(spy).not.toHaveBeenCalled();
  });
});
