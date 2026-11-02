import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/lib/frappe-api", () => ({ FrappeAPI: { get, post } }))

import { jobOfferService } from "@/lib/services/jobOffer"

let fetchMock: ReturnType<typeof vi.fn>

/** A `preview_culture_book` reply: headers, ok flag and a cancellable body. */
function pdfReply(init: { ok?: boolean; contentType?: string; body?: unknown }) {
  const cancel = vi.fn()
  return {
    response: {
      ok: init.ok ?? true,
      headers: { get: (name: string) => (name === "content-type" ? (init.contentType ?? null) : null) },
      body: { cancel },
      json: () => Promise.resolve(init.body),
    } as unknown as Response,
    cancel,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("job offer PDF and culture book URLs", () => {
  // Spec: CAND-07-A1.3C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a1-3c)
  // Characterization: pins current behaviour, not endorsed.
  it("builds the culture book preview URL on the same-origin proxy and appends the token only when one is given", () => {
    expect(jobOfferService.getCultureBookPdfUrl("CAND-TEST-0001@example.invalid")).toBe(
      "/backend/api/method/recruitment.job_offer_utils.preview_culture_book?appl=CAND-TEST-0001%40example.invalid",
    )
    expect(jobOfferService.getCultureBookPdfUrl("CAND-TEST-0001@example.invalid", "tok-test")).toBe(
      "/backend/api/method/recruitment.job_offer_utils.preview_culture_book?appl=CAND-TEST-0001%40example.invalid&token=tok-test",
    )
  })
})

describe("culture book availability probe", () => {
  // Spec: CAND-07-A1.4A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a1-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("answers false for an empty application without a request at all", async () => {
    await expect(jobOfferService.isCultureBookAvailable("")).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Spec: CAND-07-A1.4B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a1-4b)
  // Characterization: pins current behaviour, not endorsed.
  it("treats a non-JSON content type as a real PDF, cancels the body and never reads it", async () => {
    const { response, cancel } = pdfReply({ contentType: "application/pdf" })
    const json = vi.spyOn(response, "json")
    fetchMock.mockResolvedValue(response)

    await expect(jobOfferService.isCultureBookAvailable("CAND-TEST-0001@example.invalid", "tok-test")).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/method/recruitment.job_offer_utils.preview_culture_book?appl=CAND-TEST-0001%40example.invalid&token=tok-test",
      { credentials: "include" },
    )
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(json).not.toHaveBeenCalled()
  })

  // Spec: CAND-07-A1.4C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a1-4c)
  // Characterization: pins current behaviour, not endorsed.
  it("reads a JSON reply and is false only when available is exactly false", async () => {
    fetchMock.mockResolvedValueOnce(pdfReply({ contentType: "application/json", body: { message: { available: false } } }).response)
    await expect(jobOfferService.isCultureBookAvailable("CAND-TEST-0001@example.invalid")).resolves.toBe(false)

    fetchMock.mockResolvedValueOnce(pdfReply({ contentType: "application/json", body: { message: { available: true } } }).response)
    await expect(jobOfferService.isCultureBookAvailable("CAND-TEST-0001@example.invalid")).resolves.toBe(true)

    fetchMock.mockResolvedValueOnce(pdfReply({ contentType: "application/json", body: {} }).response)
    await expect(jobOfferService.isCultureBookAvailable("CAND-TEST-0001@example.invalid")).resolves.toBe(true)
  })

  // Spec: CAND-07-A1.4D (docs/spec/clauses/07-services-and-hooks.md#cand-07-a1-4d)
  // Characterization: pins current behaviour, not endorsed.
  it("answers false and swallows the failure when the probe is refused or the network throws", async () => {
    const refused = pdfReply({ ok: false, contentType: "application/json" })
    fetchMock.mockResolvedValueOnce(refused.response)
    await expect(jobOfferService.isCultureBookAvailable("CAND-TEST-0001@example.invalid")).resolves.toBe(false)
    expect(refused.cancel).toHaveBeenCalledTimes(1)

    fetchMock.mockRejectedValueOnce(new Error("network down"))
    await expect(jobOfferService.isCultureBookAvailable("CAND-TEST-0001@example.invalid")).resolves.toBe(false)
  })
})

describe("offer letter download", () => {
  // Spec: CAND-07-A1.5A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a1-5a)
  // Characterization: pins current behaviour, not endorsed.
  it("asks download_job_offer_pdf for separate letters and passes the token through", async () => {
    get.mockResolvedValue({ count: 2, letters: [] })

    await jobOfferService.getJobOfferLetters("CAND-TEST-0001@example.invalid")
    expect(get).toHaveBeenLastCalledWith("recruitment.job_offer_utils.download_job_offer_pdf", {
      appl: "CAND-TEST-0001@example.invalid",
      separate: "1",
    })

    await jobOfferService.getJobOfferLetters("CAND-TEST-0001@example.invalid", "tok-test")
    expect(get).toHaveBeenLastCalledWith("recruitment.job_offer_utils.download_job_offer_pdf", {
      appl: "CAND-TEST-0001@example.invalid",
      separate: "1",
      token: "tok-test",
    })
  })
})
