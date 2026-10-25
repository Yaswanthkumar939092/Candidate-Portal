import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/public/openings/route";

const list = (rows: unknown[]) => ({ message: { openings: rows, page: 1, page_length: 50, total: rows.length } });
const detail = (name: string) => ({ message: { name, description: `<p>desc ${name}</p>` } });

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const spy = vi.fn(async (url: string, init?: RequestInit) => handler(String(url), init));
  vi.stubGlobal("fetch", spy);
  return spy;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubEnv("FRAPPE_BASE_URL", "http://backend.test");
  vi.stubEnv("FRAPPE_API_KEY", "");
  vi.stubEnv("FRAPPE_API_SECRET", "");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("GET /api/public/openings (v1, no API key)", () => {
  it("lists openings through the Guest v1 methods and sends no credentials", async () => {
    const spy = mockFetch((url) => {
      if (url.includes("v1.candidate.list_openings")) return json(list([{ name: "A", job_title: "Dev", closes_on: null, posted_on: "2026-10-20 00:00:00" }]));
      if (url.includes("v1.candidate.get_opening")) return json(detail("A"));
      return json({}, 404);
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openings).toHaveLength(1);
    expect(body.openings[0]).toMatchObject({ id: "A", title: "Dev", description: "<p>desc A</p>" });
    for (const call of spy.mock.calls) {
      const headers = JSON.stringify((call[1] as RequestInit | undefined)?.headers ?? {});
      expect(headers).not.toMatch(/token|authorization/i);
      expect(call[0]).not.toMatch(/api\/resource|frappe\.client/);
    }
  });

  it("works with no FRAPPE_API_KEY configured", async () => {
    mockFetch((url) => (url.includes("list_openings") ? json(list([])) : json({}, 404)));
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).openings).toEqual([]);
  });

  it("drops openings that have closed", async () => {
    mockFetch((url) => {
      if (url.includes("list_openings")) return json(list([{ name: "OLD", closes_on: "2000-01-01" }, { name: "NEW", closes_on: null }]));
      return json(detail("x"));
    });
    const ids = (await (await GET()).json()).openings.map((o: { id: string }) => o.id);
    expect(ids).toEqual(["NEW"]);
  });

  it("keeps the opening when only its description fetch fails", async () => {
    mockFetch((url) => {
      if (url.includes("list_openings")) return json(list([{ name: "A", job_title: "Dev" }]));
      return json({ exc: "boom" }, 500);
    });
    const body = await (await GET()).json();
    expect(body.openings[0]).toMatchObject({ id: "A", description: "" });
  });

  it("returns 502 when the list call fails", async () => {
    mockFetch(() => json({ exc: "boom" }, 500));
    expect((await GET()).status).toBe(502);
  });

  it("returns 502 when the backend is unreachable", async () => {
    mockFetch(() => { throw new Error("ECONNREFUSED"); });
    expect((await GET()).status).toBe(502);
  });
});
