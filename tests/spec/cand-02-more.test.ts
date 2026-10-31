import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { pdfMock } = vi.hoisted(() => ({ pdfMock: vi.fn() }))
vi.mock("pdf-parse/lib/pdf-parse.js", () => ({ default: pdfMock }))

import { POST as parseResume } from "@/app/api/parse-resume/route"
import * as proxy from "@/app/backend/[...path]/route"
import { GET as healthGet } from "@/app/api/health/route"
import { featureFlagsService } from "@/lib/services/feature-flags"
import { fileUploadService } from "@/lib/services/uploadProofFile"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("POST /api/parse-resume", () => {
  // The route only calls req.formData() and form.get("file"); a stand-in request avoids mixing jsdom's File with undici's FormData.
  function formRequest(entries: Record<string, string | File>) {
    const form = new Map(Object.entries(entries))
    return { formData: async () => form } as unknown as Request
  }

  // Spec: CAND-02-A2.5A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-5a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the extracted text for any uploaded file with no authentication, size or type check, and 400 when the file part is missing or not a file", async () => {
    pdfMock.mockResolvedValueOnce({ text: "synthetic resume text" })
    const ok = await parseResume(formRequest({ file: new File(["not really a pdf"], "x.txt", { type: "text/plain" }) }))
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ text: "synthetic resume text" })
    expect(pdfMock).toHaveBeenCalledTimes(1)
    expect(Buffer.isBuffer(pdfMock.mock.calls[0][0])).toBe(true)

    const missing = await parseResume(formRequest({ other: "x" }))
    expect(missing.status).toBe(400)
    expect(await missing.json()).toEqual({ error: "Invalid file" })
    const notFile = await parseResume(formRequest({ file: "just text" }))
    expect(notFile.status).toBe(400)
  })

  // Spec: CAND-02-A2.5B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a2-5b)
  // Characterization: pins current behaviour, not endorsed.
  it("answers 500 with the parser's own error message and logs the error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    pdfMock.mockRejectedValueOnce(new Error("internal parser detail"))
    const res = await parseResume(formRequest({ file: new File(["x"], "x.pdf") }))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "internal parser detail" })
    expect(spy).toHaveBeenCalled()
  })
})

describe("/backend proxy configuration guard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  // Spec: CAND-02-A3.3A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a3-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("answers 503 with a fixed body and makes no upstream call when FRAPPE_BASE_URL is unset, has credentials, a query, a path, or a non-http scheme, and ignores NEXT_PUBLIC_FRAPPE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://public.example.invalid")
    for (const bad of ["", "ftp://frappe.example.invalid", "http://u:p@frappe.example.invalid", "http://frappe.example.invalid/sub", "http://frappe.example.invalid/?a=1", "http://frappe.example.invalid/#h"]) {
      vi.stubEnv("FRAPPE_BASE_URL", bad)
      const res = await proxy.GET(new NextRequest("http://portal.example.invalid/backend/a"), { params: Promise.resolve({ path: ["a"] }) })
      expect(res.status).toBe(503)
      expect(await res.json()).toEqual({ error: "Backend unavailable" })
    }
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe("health route", () => {
  // Spec: CAND-02-A4.1A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a4-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends Cache-Control no-store and is force-dynamic", async () => {
    const res = healthGet()
    expect(res.headers.get("cache-control")).toBe("no-store")
    const route = await import("@/app/api/health/route")
    expect(route.dynamic).toBe("force-dynamic")
  })
})

describe("feature-flag client service", () => {
  // Spec: CAND-02-A4.2A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a4-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("throws an Error carrying the status text when /api/candidate-feature-flags answers not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, statusText: "Internal Server Error" }))
    await expect(featureFlagsService.getFeatureFlags()).rejects.toThrow("Feature flags request failed: Internal Server Error")
  })
})

describe("file upload through FrappeAPI", () => {
  // Spec: CAND-02-A1.4A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a1-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("fileUploadService passes its docName in the doctype form field and sends no docname field, because it calls uploadFile(file, '', docName, doctype)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: { file_url: "/files/a.txt", name: "FILE-TEST-1" } }) })
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "log").mockImplementation(() => {})
    await fileUploadService.uploadFile(new File(["x"], "a.txt"), "Job Applicant", "HR-APP-TEST-1")
    const form = fetchMock.mock.calls[0][1].body as FormData
    expect(fetchMock.mock.calls[0][0]).toBe("/backend/api/method/upload_file")
    expect(form.get("doctype")).toBe("HR-APP-TEST-1")
    expect(form.has("docname")).toBe(false)
    expect(form.get("file")).toBeInstanceOf(File)
  })
})
