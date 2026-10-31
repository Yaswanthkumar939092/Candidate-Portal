import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

const svc = vi.hoisted(() => ({
  ctcRespond: vi.fn(),
  ctcGet: vi.fn(),
  dafGet: vi.fn(),
  dafSubmit: vi.fn(),
  preOfferGet: vi.fn(),
  preOfferState: vi.fn(),
  preOfferSubmit: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  refreshProfile: vi.fn(),
  getHomeContent: vi.fn(),
  getPostLoginRoute: vi.fn(),
  submitSurvey: vi.fn(),
}))

vi.mock("@/lib/services/ctc-proposal", async () => ({
  ...(await vi.importActual("@/lib/services/ctc-proposal")),
  ctcProposalService: { getProposal: svc.ctcGet, respond: svc.ctcRespond },
}))
vi.mock("@/lib/services/direct-applicant-form", async () => ({
  ...(await vi.importActual("@/lib/services/direct-applicant-form")),
  directApplicantFormService: { getForm: svc.dafGet, submit: svc.dafSubmit },
}))
vi.mock("@/lib/services/pre-offer", () => ({
  preOfferService: {
    getPreOfferForm: svc.preOfferGet,
    getPreOfferFormState: svc.preOfferState,
    submitPreOffer: svc.preOfferSubmit,
  },
}))
vi.mock("@/lib/services/profileService", () => ({
  profileService: { updateProfile: svc.updateProfile, changePassword: svc.changePassword },
}))
vi.mock("@/lib/services/home", () => ({ homeService: { getHomeContent: svc.getHomeContent } }))
vi.mock("@/lib/services/survey", () => ({
  surveyService: { getPostLoginRoute: svc.getPostLoginRoute, submitSurvey: svc.submitSurvey },
}))
vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: () => ({ refreshProfile: svc.refreshProfile }) }))

import { useCtcProposal, useRespondToCtcProposal } from "@/lib/hooks/useCtcProposal"
import { useDirectApplicantForm, useSubmitDirectApplicantForm } from "@/lib/hooks/useDirectApplicantForm"
import { usePreOfferFormState, useSubmitPreOffer } from "@/lib/hooks/usePreOfferForm"
import { useChangePassword } from "@/lib/hooks/useChangePassword"
import { useUpdateProfile } from "@/lib/hooks/useUpdateProfile"
import { useHomeContent } from "@/lib/hooks/useHomeContent"
import { useSubmitSurvey, useSurvey } from "@/lib/hooks/useSurvey"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { JOINING_DAY_FIELDS, useNonWorkingDays } from "@/lib/hooks/useNonWorkingDays"
import { usePublicBranding } from "@/lib/hooks/usePublicBranding"
import { usePublicOpenings } from "@/lib/hooks/usePublicOpenings"

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
  vi.unstubAllGlobals()
})

describe("token-or-name query keys", () => {
  // Spec: CAND-07-A4.3A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("keys the CTC proposal and the direct applicant form on whichever access value was given, and stays idle when neither is", async () => {
    svc.ctcGet.mockResolvedValue({ applicant_name: "Test Candidate" })
    svc.dafGet.mockResolvedValue({ form_title: "Joining details", fields: [] })

    const ctc = renderHook(() => useCtcProposal({ token: "tok-test" }), { wrapper })
    const daf = renderHook(() => useDirectApplicantForm({ request: "CAND-TEST-DAFR-0001" }), { wrapper })
    await waitFor(() => expect(ctc.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(daf.result.current.isSuccess).toBe(true))

    const keys = client.getQueryCache().findAll().map((q) => q.queryKey)
    expect(keys).toContainEqual(["ctc-proposal", "tok-test"])
    expect(keys).toContainEqual(["direct-applicant-form", "CAND-TEST-DAFR-0001"])

    const idle = renderHook(() => useCtcProposal({} as never), { wrapper })
    expect(idle.result.current.fetchStatus).toBe("idle")
    expect(svc.ctcGet).toHaveBeenCalledTimes(1)
  })

  // Spec: CAND-07-A4.3B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("waits for both the proposal and the action centre caches to be invalidated before a CTC response settles", async () => {
    svc.ctcRespond.mockResolvedValue({ status: "Accepted" })
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useRespondToCtcProposal({ proposal: "CAND-TEST-CTC-0001" }), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ action: "Accept" } as never)
    })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ctc-proposal", "CAND-TEST-CTC-0001"] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["action-center"] })
  })

  // Spec: CAND-07-A4.3C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a4-3c)
  // Characterization: pins current behaviour, not endorsed.
  it("invalidates the same two caches after a direct applicant form submission", async () => {
    svc.dafSubmit.mockResolvedValue({ status: "ok", message: "Submitted" })
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useSubmitDirectApplicantForm({ token: "tok-test" }), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ custom_pan_number: "ABCDE1234F" })
    })

    expect(svc.dafSubmit).toHaveBeenCalledWith({ token: "tok-test" }, { custom_pan_number: "ABCDE1234F" })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["direct-applicant-form", "tok-test"] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["action-center"] })
  })
})

describe("pre-offer hooks", () => {
  // Spec: CAND-07-A5.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a5-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("holds the form-state query back until an applicant is named and keys it on that applicant", async () => {
    svc.preOfferState.mockResolvedValue({ filled: true, filled_at: "2026-10-01", rejected_fields: [] })

    const idle = renderHook(() => usePreOfferFormState(), { wrapper })
    expect(idle.result.current.fetchStatus).toBe("idle")
    expect(svc.preOfferState).not.toHaveBeenCalled()

    const { result } = renderHook(() => usePreOfferFormState("CAND-TEST-0001@example.invalid"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryCache().findAll().map((q) => q.queryKey)).toContainEqual([
      "pre-offer-form-state",
      "CAND-TEST-0001@example.invalid",
    ])
  })

  // Spec: CAND-07-A5.2B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a5-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("invalidates the form and the form-state caches, using the object-shaped form key, after a pre-offer submission", async () => {
    svc.preOfferSubmit.mockResolvedValue({ status: "ok" })
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useSubmitPreOffer(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ jobApplicant: "CAND-TEST-0001@example.invalid", data: { pan: "ABCDE1234F" } })
    })

    expect(svc.preOfferSubmit).toHaveBeenCalledWith("CAND-TEST-0001@example.invalid", { pan: "ABCDE1234F" })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["pre-offer-form", { userEmail: "CAND-TEST-0001@example.invalid" }],
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pre-offer-form-state", "CAND-TEST-0001@example.invalid"] })
  })
})

describe("profile mutations", () => {
  // Spec: CAND-07-A6.3A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a6-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("refreshes the signed-in profile after an update, but the password change touches no session state", async () => {
    svc.updateProfile.mockResolvedValue({ status: "ok" })
    svc.changePassword.mockResolvedValue({ status: "ok" })

    const update = renderHook(() => useUpdateProfile(), { wrapper })
    await act(async () => {
      await update.result.current.mutateAsync({ full_name: "Test Candidate" })
    })
    expect(svc.refreshProfile).toHaveBeenCalledTimes(1)

    const change = renderHook(() => useChangePassword(), { wrapper })
    await act(async () => {
      await change.result.current.mutateAsync({ current_password: "a", new_password: "b", confirm_password: "b" })
    })
    expect(svc.refreshProfile).toHaveBeenCalledTimes(1)
  })
})

describe("cached content queries", () => {
  // Spec: CAND-07-A7.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a7-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("caches the guest home content for an hour under one key and never retries a failure", async () => {
    svc.getHomeContent.mockRejectedValue(new Error("backend down"))

    const { result } = renderHook(() => useHomeContent(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(svc.getHomeContent).toHaveBeenCalledTimes(1)
    const query = client.getQueryCache().find({ queryKey: ["home-content"] })!
    expect(query.observers[0].options.staleTime).toBe(1000 * 60 * 60)
  })

  // Spec: CAND-07-A7.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a7-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("caches the post-login route for ten minutes and leaves the survey submission un-cached", async () => {
    svc.getPostLoginRoute.mockResolvedValue({ survey_required: true, redirect_url: "/survey" })
    svc.submitSurvey.mockResolvedValue({ status: "ok" })

    const route = renderHook(() => useSurvey(), { wrapper })
    await waitFor(() => expect(route.result.current.isSuccess).toBe(true))
    const query = client.getQueryCache().find({ queryKey: ["post-login-route"] })!
    expect(query.observers[0].options.staleTime).toBe(1000 * 60 * 10)

    const submit = renderHook(() => useSubmitSurvey(), { wrapper })
    await act(async () => {
      await submit.result.current.mutateAsync({ survey: "CAND-TEST-SURVEY-0001", answers: [] } as never)
    })
    expect(client.getQueryCache().findAll()).toHaveLength(1)
  })

  // Spec: CAND-07-A7.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a7-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("reads public branding from the server route with no store and treats a refusal as empty branding", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => usePublicBranding(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock).toHaveBeenCalledWith("/api/public/branding", { cache: "no-store" })
    expect(result.current.data).toEqual({})
    const query = client.getQueryCache().find({ queryKey: ["public-branding"] })!
    expect(query.observers[0].options.staleTime).toBe(1000 * 60 * 10)
  })

  // Spec: CAND-07-A7.2B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a7-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("unwraps the openings array from the public route and raises a fixed message when the route refuses", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ openings: [{ name: "CAND-TEST-OPN-0001" }] }) } as Response)
    const ok = renderHook(() => usePublicOpenings(), { wrapper })
    await waitFor(() => expect(ok.result.current.isSuccess).toBe(true))
    expect(ok.result.current.data).toEqual([{ name: "CAND-TEST-OPN-0001" }])
    expect(fetchMock).toHaveBeenCalledWith("/api/public/openings")

    client.clear()
    fetchMock.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) } as Response)
    const failed = renderHook(() => usePublicOpenings(), { wrapper })
    await waitFor(() => expect(failed.result.current.isError).toBe(true))
    expect(failed.result.current.error?.message).toBe("Could not load open jobs")
  })
})

describe("plain hooks", () => {
  // Spec: CAND-07-A8.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a8-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the first value at once and the newest value only after the delay has passed without a change", async () => {
    vi.useFakeTimers()
    try {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: "a" },
      })
      expect(result.current).toBe("a")

      rerender({ value: "ab" })
      act(() => void vi.advanceTimersByTime(200))
      expect(result.current).toBe("a")

      rerender({ value: "abc" })
      act(() => void vi.advanceTimersByTime(200))
      expect(result.current).toBe("a")

      act(() => void vi.advanceTimersByTime(100))
      expect(result.current).toBe("abc")
    } finally {
      vi.useRealTimers()
    }
  })

  // Spec: CAND-07-A8.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a8-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("names the joining-date fields the non-working-day rule covers", () => {
    expect(Object.keys(JOINING_DAY_FIELDS).sort()).toEqual([
      "custom_date_of_joining",
      "custom_doj_outcome_date",
      "custom_expected_doj",
      "custom_trainee_doj",
      "date_of_joining",
      "expected_doj",
    ])
    expect(Object.values(JOINING_DAY_FIELDS).every((v) => v === true)).toBe(true)
  })

  // Spec: CAND-07-A8.2B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a8-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("asks the candidate-scoped joining-day endpoint once for the whole module and shares that answer with every later caller", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { dates: ["2026-01-26", "2026-08-15"] } }),
    } as Response)
    vi.stubGlobal("fetch", fetchMock)

    const first = renderHook(() => useNonWorkingDays())
    await waitFor(() => expect(first.result.current).toEqual(["2026-01-26", "2026-08-15"]))
    expect(fetchMock).toHaveBeenCalledWith(
      "/backend/api/method/recruitment.api.joining_day.get_my_non_working_days",
      { credentials: "include", headers: { Accept: "application/json" } },
    )

    const second = renderHook(() => useNonWorkingDays())
    await waitFor(() => expect(second.result.current).toEqual(["2026-01-26", "2026-08-15"]))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const disabled = renderHook(() => useNonWorkingDays(false))
    expect(disabled.result.current).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
