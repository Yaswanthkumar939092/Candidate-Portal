import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

const svc = vi.hoisted(() => ({
  getCultureBookPdfUrl: vi.fn(),
  isCultureBookAvailable: vi.fn(),
  getJobOfferLetters: vi.fn(),
  getConsentSessionStatus: vi.fn(),
  startConsentSession: vi.fn(),
  getJobOfferSummary: vi.fn(),
}))
vi.mock("@/lib/services/jobOffer", () => ({ jobOfferService: svc }))

import {
  CONSENT_STATUS_POLL_MS,
  useConsentSessionStatus,
  useCultureBookAvailability,
  useCultureBookPdf,
  useJobOfferLetters,
  useJobOfferSummary,
  useStartConsentSession,
} from "@/lib/hooks/useJobOffer"

let client: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
})

describe("job offer query keys and gating", () => {
  // Spec: CAND-07-A2.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a2-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("keys the summary on application and token and makes no request for an empty application or a disabled hook", async () => {
    svc.getJobOfferSummary.mockResolvedValue({ applicant_name: "Test Candidate" })

    const { result } = renderHook(() => useJobOfferSummary("CAND-TEST-0001@example.invalid", true, "tok-test"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryCache().findAll()[0].queryKey).toEqual([
      "jobOfferSummary",
      "CAND-TEST-0001@example.invalid",
      "tok-test",
    ])
    expect(svc.getJobOfferSummary).toHaveBeenCalledTimes(1)

    const empty = renderHook(() => useJobOfferSummary("", true, "tok-test"), { wrapper })
    expect(empty.result.current.fetchStatus).toBe("idle")

    const off = renderHook(() => useJobOfferSummary("CAND-TEST-0002@example.invalid", false), { wrapper })
    expect(off.result.current.fetchStatus).toBe("idle")
    expect(svc.getJobOfferSummary).toHaveBeenCalledTimes(1)
  })

  // Spec: CAND-07-A2.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a2-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("returns a culture book URL without any request and null once the application is empty or the hook is off", () => {
    svc.getCultureBookPdfUrl.mockReturnValue("/backend/api/method/recruitment.job_offer_utils.preview_culture_book?appl=x")

    const on = renderHook(() => useCultureBookPdf("CAND-TEST-0001@example.invalid", true, "tok-test"), { wrapper })
    expect(on.result.current).toEqual({
      pdfUrl: "/backend/api/method/recruitment.job_offer_utils.preview_culture_book?appl=x",
      isLoading: false,
      error: null,
    })
    expect(svc.getCultureBookPdfUrl).toHaveBeenCalledWith("CAND-TEST-0001@example.invalid", "tok-test")

    const off = renderHook(() => useCultureBookPdf("CAND-TEST-0001@example.invalid", false), { wrapper })
    expect(off.result.current.pdfUrl).toBeNull()

    svc.getCultureBookPdfUrl.mockClear()
    const blank = renderHook(() => useCultureBookPdf(""), { wrapper })
    expect(blank.result.current.pdfUrl).toBeNull()
    expect(svc.getCultureBookPdfUrl).not.toHaveBeenCalled()
  })

  // Spec: CAND-07-A2.1C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a2-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("gives the availability probe and the letter list their own keys and five-minute stale times", async () => {
    svc.isCultureBookAvailable.mockResolvedValue(true)
    svc.getJobOfferLetters.mockResolvedValue({ count: 1, letters: [] })

    const avail = renderHook(() => useCultureBookAvailability("CAND-TEST-0001@example.invalid", true, "tok-test"), { wrapper })
    const letters = renderHook(() => useJobOfferLetters("CAND-TEST-0001@example.invalid", true, "tok-test"), { wrapper })
    await waitFor(() => expect(avail.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(letters.result.current.isSuccess).toBe(true))

    const keys = client.getQueryCache().findAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["cultureBookAvailability", "CAND-TEST-0001@example.invalid", "tok-test"])
    expect(keys).toContainEqual(["jobOfferLetters", "CAND-TEST-0001@example.invalid", "tok-test"])
    for (const q of client.getQueryCache().findAll()) {
      expect(q.observers[0].options.staleTime).toBe(1000 * 60 * 5)
    }
  })
})

describe("consent session hooks", () => {
  // Spec: CAND-07-A2.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a2-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("never retries a failed start_consent_session", async () => {
    svc.startConsentSession.mockRejectedValue(new Error("no link"))

    const { result } = renderHook(() => useStartConsentSession(), { wrapper })
    await expect(result.current.mutateAsync({ appl: "CAND-TEST-0001@example.invalid" })).rejects.toThrow("no link")

    expect(svc.startConsentSession).toHaveBeenCalledTimes(1)
    expect(svc.startConsentSession).toHaveBeenCalledWith("CAND-TEST-0001@example.invalid", undefined)
  })

  // Spec: CAND-07-A2.2B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a2-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("polls the consent status every three seconds while consent is missing and stops once it is given", async () => {
    expect(CONSENT_STATUS_POLL_MS).toBe(3000)
    svc.getConsentSessionStatus.mockResolvedValue({ enabled: true, consent_given: false })

    const { result } = renderHook(() => useConsentSessionStatus("CAND-TEST-0001@example.invalid", "tok-test"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const query = client.getQueryCache().find({ queryKey: ["consentSessionStatus", "CAND-TEST-0001@example.invalid", "tok-test"] })!
    const options = query.observers[0].options
    expect(options.staleTime).toBe(0)
    expect(options.refetchIntervalInBackground).toBe(false)
    expect((options.refetchInterval as (q: typeof query) => number | false)(query)).toBe(3000)

    query.setState({ ...query.state, data: { enabled: true, consent_given: true } })
    expect((options.refetchInterval as (q: typeof query) => number | false)(query)).toBe(false)
  })

  // Spec: CAND-07-A2.2C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a2-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("drops the dashboard cache as soon as the status says consent was given, and leaves it alone otherwise", async () => {
    const invalidate = vi.spyOn(client, "invalidateQueries")

    svc.getConsentSessionStatus.mockResolvedValue({ enabled: true, consent_given: false })
    const pending = renderHook(() => useConsentSessionStatus("CAND-TEST-0001@example.invalid"), { wrapper })
    await waitFor(() => expect(pending.result.current.isSuccess).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()

    svc.getConsentSessionStatus.mockResolvedValue({ enabled: true, consent_given: true })
    const given = renderHook(() => useConsentSessionStatus("CAND-TEST-0002@example.invalid"), { wrapper })
    await waitFor(() => expect(given.result.current.isSuccess).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] })
  })
})
