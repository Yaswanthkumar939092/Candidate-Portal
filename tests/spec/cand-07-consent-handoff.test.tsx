import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

const h = vi.hoisted(() => ({ push: vi.fn(), startConsentSession: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock("@/lib/hooks/useJobOffer", () => ({
  useStartConsentSession: () => ({ mutateAsync: h.startConsentSession }),
}))

import { useExternalConsentHandoff } from "@/lib/hooks/useExternalConsentHandoff"

let assign: ReturnType<typeof vi.fn>
let originalLocation: Location

beforeEach(() => {
  vi.clearAllMocks()
  assign = vi.fn()
  originalLocation = window.location
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: { ...originalLocation, assign } })
})

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: originalLocation })
})

describe("external consent hand-off", () => {
  // Spec: CAND-07-A3.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a3-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("uses a pre-issued absolute link straight away and asks for no new session", async () => {
    const { result } = renderHook(() => useExternalConsentHandoff("CAND-TEST-0001@example.invalid", "tok-test"))

    await expect(result.current.handoff("https://consent.example.invalid/c/abc")).resolves.toBe(true)

    expect(assign).toHaveBeenCalledWith("https://consent.example.invalid/c/abc")
    expect(h.startConsentSession).not.toHaveBeenCalled()
    expect(result.current.failed).toBe(false)
  })

  // Spec: CAND-07-A3.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a3-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("re-issues a link when the pre-issued one is relative or unusable, and leaves for the new one", async () => {
    h.startConsentSession.mockResolvedValue({ already_consented: false, consent_url: "https://consent.example.invalid/c/new" })

    const { result } = renderHook(() => useExternalConsentHandoff("CAND-TEST-0001@example.invalid", "tok-test"))
    await expect(result.current.handoff("/job_offer/consent")).resolves.toBe(true)

    expect(h.startConsentSession).toHaveBeenCalledWith({ appl: "CAND-TEST-0001@example.invalid", token: "tok-test" })
    expect(assign).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith("https://consent.example.invalid/c/new")
  })

  // Spec: CAND-07-A3.1C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a3-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("skips the portal for an already consented candidate and pushes the in-app onward route when the backend sends no usable redirect", async () => {
    h.startConsentSession.mockResolvedValue({ already_consented: true, redirect_url: null })

    const { result } = renderHook(() => useExternalConsentHandoff("CAND-TEST-0001@example.invalid", "tok-test"))
    await expect(result.current.handoff()).resolves.toBe(true)

    expect(h.push).toHaveBeenCalledWith("/onboarding?appl=CAND-TEST-0001%40example.invalid&token=tok-test")
    expect(assign).not.toHaveBeenCalled()
  })

  // Spec: CAND-07-A3.1D (docs/spec/clauses/07-services-and-hooks.md#cand-07-a3-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("leaves the site when an already consented candidate gets an absolute redirect from the backend", async () => {
    h.startConsentSession.mockResolvedValue({ already_consented: true, redirect_url: "https://portal.example.invalid/next" })

    const { result } = renderHook(() => useExternalConsentHandoff("CAND-TEST-0001@example.invalid"))
    await expect(result.current.handoff()).resolves.toBe(true)

    expect(assign).toHaveBeenCalledWith("https://portal.example.invalid/next")
    expect(h.push).not.toHaveBeenCalled()
  })

  // Spec: CAND-07-A3.1E (docs/spec/clauses/07-services-and-hooks.md#cand-07-a3-1e)
  // Characterization: pins current behaviour, not endorsed.
  it("reports failure without navigating when the session call throws or hands back no usable link", async () => {
    h.startConsentSession.mockRejectedValueOnce(new Error("backend refused"))
    const thrown = renderHook(() => useExternalConsentHandoff("CAND-TEST-0001@example.invalid"))
    await act(async () => {
      await expect(thrown.result.current.handoff()).resolves.toBe(false)
    })
    expect(assign).not.toHaveBeenCalled()
    expect(h.push).not.toHaveBeenCalled()
    expect(thrown.result.current.failed).toBe(true)

    h.startConsentSession.mockResolvedValueOnce({ already_consented: false, consent_url: "javascript:alert(1)" })
    const unsafe = renderHook(() => useExternalConsentHandoff("CAND-TEST-0002@example.invalid"))
    await act(async () => {
      await expect(unsafe.result.current.handoff()).resolves.toBe(false)
    })
    expect(assign).not.toHaveBeenCalled()
    expect(unsafe.result.current.failed).toBe(true)
  })
})
