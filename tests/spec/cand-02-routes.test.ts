import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { GET as brandingGet } from "@/app/api/public/branding/route"
import { GET as openingsGet } from "@/app/api/public/openings/route"
import { GET as flagsGet } from "@/app/api/candidate-feature-flags/route"
import { getServerFeatureFlags, isServerFeatureEnabled } from "@/lib/server/feature-flags"

const KEY = "KEY-TEST"
const SECRET = "SECRET-TEST"
let fetchMock: ReturnType<typeof vi.fn>

function frappeEnv(on: boolean) {
  vi.stubEnv("FRAPPE_BASE_URL", on ? "http://frappe.example.invalid:8000/" : "")
  vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "")
  vi.stubEnv("FRAPPE_API_KEY", on ? KEY : "")
  vi.stubEnv("FRAPPE_API_SECRET", on ? SECRET : "")
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("server-side feature flags", () => {
  // Spec: CAND-02-A2.1A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("calls the flag method with the API key header, coerces values to booleans and returns {} on any failure", async () => {
    frappeEnv(true)
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: { a: 1, b: "1", c: "true", d: true, e: 0, f: "yes", g: null } }) })
    const flags = await getServerFeatureFlags()
    expect(flags).toEqual({ a: true, b: true, c: true, d: true, e: false, f: false, g: false })
    expect(fetchMock).toHaveBeenCalledWith(
      "http://frappe.example.invalid:8000/api/method/recruitment.api.candidate_portal.get_candidate_feature_flags",
      { headers: { Authorization: `token ${KEY}:${SECRET}` }, cache: "no-store" },
    )

    fetchMock.mockResolvedValueOnce({ ok: false })
    expect(await getServerFeatureFlags()).toEqual({})
    fetchMock.mockRejectedValueOnce(new Error("down"))
    expect(await getServerFeatureFlags()).toEqual({})

    fetchMock.mockClear()
    frappeEnv(false)
    expect(await getServerFeatureFlags()).toEqual({})
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Spec: CAND-02-A2.1B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("treats a flag as enabled only when it is exactly true after coercion", async () => {
    frappeEnv(true)
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: { careers_public_enabled: 1, other: 0 } }) })
    expect(await isServerFeatureEnabled("careers_public_enabled")).toBe(true)
    expect(await isServerFeatureEnabled("other")).toBe(false)
    expect(await isServerFeatureEnabled("missing")).toBe(false)
  })
})

describe("GET /api/candidate-feature-flags", () => {
  // Spec: CAND-02-A2.2A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns 500 when the URL or either API credential is missing, else {flags}", async () => {
    frappeEnv(false)
    const missing = await flagsGet()
    expect(missing.status).toBe(500)
    expect(await missing.json()).toEqual({ error: "Frappe API credentials are not configured" })

    frappeEnv(true)
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: { open_jobs: 1 } }) })
    const ok = await flagsGet()
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ flags: { open_jobs: true } })
  })
})

describe("GET /api/public/branding", () => {
  // Spec: CAND-02-A2.3A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the branding with a 300 s edge cache, and an empty object without credentials or on upstream failure", async () => {
    frappeEnv(true)
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: { title_prefix: "Example" } }) })
    const ok = await brandingGet()
    expect(await ok.json()).toEqual({ branding: { title_prefix: "Example" } })
    expect(ok.headers.get("cache-control")).toBe("public, s-maxage=300, stale-while-revalidate=600")
    expect(fetchMock.mock.calls[0][0]).toBe("http://frappe.example.invalid:8000/api/method/recruitment.api.candidate_portal.get_website_branding")
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: `token ${KEY}:${SECRET}` })

    fetchMock.mockResolvedValueOnce({ ok: false })
    const bad = await brandingGet()
    expect(bad.status).toBe(200)
    expect(await bad.json()).toEqual({ branding: {} })
    expect(bad.headers.get("cache-control")).toBeNull()

    fetchMock.mockRejectedValueOnce(new Error("down"))
    expect(await (await brandingGet()).json()).toEqual({ branding: {} })

    fetchMock.mockClear()
    frappeEnv(false)
    expect(await (await brandingGet()).json()).toEqual({ branding: {} })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("GET /api/public/openings", () => {
  // Spec: CAND-02-A2.4A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("reads Job Opening and Employment Type with the API key, filters Open, and returns normalised openings with a 60 s edge cache", async () => {
    frappeEnv(true)
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [{ name: "HR-OPN-TEST-1", job_title: "Tester", employment_type: "ET-1", closes_on: null, posted_on: "2026-01-02 10:00:00" }] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [{ name: "ET-1", employee_type_name: "Full Time" }] }) })
    const res = await openingsGet()
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=60, stale-while-revalidate=300")
    const body = await res.json()
    expect(body.openings).toHaveLength(1)
    expect(body.openings[0]).toMatchObject({ id: "HR-OPN-TEST-1", title: "Tester", employmentType: "Full Time", evergreen: true, postedOn: "2026-01-02" })

    const urls: string[] = fetchMock.mock.calls.map((c) => c[0])
    expect(urls[0].startsWith("http://frappe.example.invalid:8000/api/resource/Job%20Opening?")).toBe(true)
    const q = new URL(urls[0]).searchParams
    expect(q.get("filters")).toBe('[["status","=","Open"]]')
    expect(q.get("order_by")).toBe("posted_on desc")
    expect(q.get("limit_page_length")).toBe("500")
    expect(urls[1].startsWith("http://frappe.example.invalid:8000/api/resource/Employment%20Type?")).toBe(true)
    for (const c of fetchMock.mock.calls) expect(c[1].headers).toEqual({ Authorization: `token ${KEY}:${SECRET}` })
  })

  // Spec: CAND-02-A2.4B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-4b)
  // Characterization: pins current behaviour, not endorsed.
  it("answers 500 without credentials and 502 when the openings read fails or throws, but tolerates a failed type lookup", async () => {
    frappeEnv(false)
    const none = await openingsGet()
    expect(none.status).toBe(500)
    expect(await none.json()).toEqual({ error: "Frappe API credentials are not configured" })

    frappeEnv(true)
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    const bad = await openingsGet()
    expect(bad.status).toBe(502)
    expect(await bad.json()).toEqual({ error: "Failed to fetch open jobs" })

    fetchMock.mockReset()
    fetchMock.mockRejectedValue(new Error("down"))
    expect((await openingsGet()).status).toBe(502)

    fetchMock.mockReset()
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [{ name: "HR-OPN-TEST-2", employment_type: "ET-9" }] }) })
      .mockResolvedValueOnce({ ok: false })
    const tolerant = await openingsGet()
    expect(tolerant.status).toBe(200)
    expect((await tolerant.json()).openings[0].employmentType).toBe("ET-9")
  })
})
