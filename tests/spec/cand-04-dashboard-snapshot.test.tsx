import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

const h = vi.hoisted(() => ({
  profile: { value: { id: "p1" } as unknown },
  summary: { value: null as unknown },
  letters: { value: null as unknown },
  pdfUrl: { value: "https://files.example.invalid/offer.pdf" as string | null },
  cultureUrl: { value: "https://files.example.invalid/culture.pdf" as string | null },
  cultureAvailable: { value: true as boolean | undefined },
  pdfArgs: vi.fn(),
  lettersArgs: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("sonner", () => ({ toast: { error: h.toastError, success: vi.fn() } }))
vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: () => ({ profile: h.profile.value }) }))
vi.mock("@/lib/hooks/useUser", () => ({ useCurrentUser: () => ({ userEmail: "cand@example.invalid", isLoading: false }) }))
vi.mock("@/lib/hooks/useJobOffer", () => ({
  useJobOfferSummary: () => ({ data: h.summary.value }),
  useJobOfferLetters: (...a: unknown[]) => {
    h.lettersArgs(...a)
    return { data: h.letters.value, isLoading: false }
  },
  useJobOfferPdf: (...a: unknown[]) => {
    h.pdfArgs(...a)
    return { pdfUrl: h.pdfUrl.value, isLoading: false }
  },
  useCultureBookPdf: () => ({ pdfUrl: h.cultureUrl.value }),
  useCultureBookAvailability: () => ({ data: h.cultureAvailable.value }),
}))

import { OnboardingSnapshot } from "@/components/dashboard/onboarding-snapshot"

const payload = (over: Record<string, unknown> = {}) => ({
  name: "n",
  date_of_joining: "2026-09-08T00:00:00",
  designation: "d",
  department: "d",
  work_location: "w",
  work_location_details: {},
  key_contacts: [],
  ...over,
}) as never

beforeEach(() => {
  vi.clearAllMocks()
  h.profile.value = { id: "p1" }
  h.summary.value = null
  h.letters.value = null
  h.pdfUrl.value = "https://files.example.invalid/offer.pdf"
  h.cultureUrl.value = "https://files.example.invalid/culture.pdf"
  h.cultureAvailable.value = true
})

describe("onboarding snapshot (characterization)", () => {
  // Spec: CAND-04-A4.1C (docs/spec/clauses/04-dashboard.md#cand-04-a4-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("takes the percentage from form_completion rounded, else from steps, and treats zero total steps as 0 percent", () => {
    const pct = (props: Record<string, unknown>) => {
      const view = render(<OnboardingSnapshot completedSteps={3} totalSteps={8} dashboardPayload={payload()} {...props} />)
      const out = view.container.querySelector("span.absolute.text-lg")?.textContent
      view.unmount()
      return out
    }
    expect(pct({ dashboardPayload: payload({ form_completion: { percentage: 33.6, total_fields: 1, filled_fields: 1 } }) })).toBe("34%")
    expect(pct({ dashboardPayload: payload({ form_completion: { percentage: 0, total_fields: 1, filled_fields: 0 } }), completedSteps: 5 })).toBe("0%")
    expect(pct({})).toBe("38%")
    expect(pct({ totalSteps: 0, completedSteps: 4 })).toBe("0%")
    expect(pct({ dashboardPayload: undefined })).toBe("38%")
  })

  // Spec: CAND-04-A4.2B (docs/spec/clauses/04-dashboard.md#cand-04-a4-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("marks completion from the stage text in any case, from onboarding_status true, or from a percentage of 100 or more", () => {
    const complete = (over: Record<string, unknown>) => {
      const view = render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload(over)} />)
      const out = screen.queryByText("Ready") !== null
      view.unmount()
      return out
    }
    expect(complete({ onboarding_stage: "Onboarding Complete" })).toBe(true)
    expect(complete({ onboarding_stage: "COMPLETE" })).toBe(true)
    expect(complete({ onboarding_stage: "completed" })).toBe(true)
    expect(complete({ onboarding_status: true })).toBe(true)
    expect(complete({ form_completion: { percentage: 100.4, total_fields: 1, filled_fields: 1 } })).toBe(true)
    expect(complete({ onboarding_stage: "Documents pending", onboarding_status: false })).toBe(false)
    expect(complete({})).toBe(false)
  })

  // Spec: CAND-04-A4.2C (docs/spec/clauses/04-dashboard.md#cand-04-a4-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the stage text as the badge even when complete, and the default badge words only without a stage", () => {
    const a = render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload({ onboarding_stage: "Documents pending", onboarding_status: true })} />)
    expect(screen.getByText("Documents pending")).toBeTruthy()
    expect(screen.queryByText("ONBOARDING COMPLETE")).toBeNull()
    a.unmount()

    const b = render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload({ onboarding_status: true })} />)
    expect(screen.getByText("ONBOARDING COMPLETE")).toBeTruthy()
    b.unmount()

    render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    expect(screen.getByText("ONBOARDING IN PROGRESS")).toBeTruthy()
  })

  // Spec: CAND-04-A4.3A (docs/spec/clauses/04-dashboard.md#cand-04-a4-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("words the ready heading with an ordinal day suffix and falls back to the steps heading when complete without a joining date", () => {
    const heading = (date: string | undefined, props: Record<string, unknown> = {}) => {
      const view = render(
        <OnboardingSnapshot completedSteps={2} totalSteps={8} joiningDate={date} dashboardPayload={payload({ onboarding_status: true, date_of_joining: "", ...props })} />,
      )
      const out = screen.getByRole("heading", { level: 2 }).textContent
      view.unmount()
      return out
    }
    expect(heading("2026-09-01T00:00:00")).toBe("You are ready to join us on September 1st!")
    expect(heading("2026-09-02T00:00:00")).toBe("You are ready to join us on September 2nd!")
    expect(heading("2026-09-03T00:00:00")).toBe("You are ready to join us on September 3rd!")
    expect(heading("2026-09-11T00:00:00")).toBe("You are ready to join us on September 11th!")
    expect(heading("2026-09-21T00:00:00")).toBe("You are ready to join us on September 21st!")
    expect(heading("2026-09-22T00:00:00")).toBe("You are ready to join us on September 22nd!")
    expect(heading("2026-09-23T00:00:00")).toBe("You are ready to join us on September 23rd!")
    expect(heading("2026-10-31T00:00:00")).toBe("You are ready to join us on October 31st!")
    expect(heading(undefined)).toBe("2 of 8 steps completed")
    expect(heading("2026-09-08T00:00:00", { date_of_joining: "2026-12-25T00:00:00" })).toBe("You are ready to join us on December 25th!")
  })

  // Spec: CAND-04-A4.4A (docs/spec/clauses/04-dashboard.md#cand-04-a4-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("asks the letters hook with the current e-mail always enabled and the PDF hook enabled only for the single-letter case", () => {
    render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    expect(h.lettersArgs).toHaveBeenLastCalledWith("cand@example.invalid", true)
    expect(h.pdfArgs).toHaveBeenLastCalledWith("cand@example.invalid", true)

    h.summary.value = { employment_type: "Trainee" }
    render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    expect(h.pdfArgs).toHaveBeenLastCalledWith("cand@example.invalid", false)

    h.summary.value = { compensation_type: "both" }
    render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    expect(h.pdfArgs).toHaveBeenLastCalledWith("cand@example.invalid", false)
  })

  // Spec: CAND-04-A4.4B (docs/spec/clauses/04-dashboard.md#cand-04-a4-4b)
  // Characterization: pins current behaviour, not endorsed.
  it("shows a dropdown with the letter count when there are two or more letters, and two plain offer buttons otherwise", () => {
    h.letters.value = { count: 2, letters: [{ index: 0, print_format: "Letter A", filename: "a", pdf_base64: "QQ==" }, { index: 1, print_format: "Letter B", filename: "b", pdf_base64: "Qg==" }] }
    const a = render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    const trigger = screen.getAllByRole("button", { name: /Preview \/ Download Offer/ })
    expect(trigger).toHaveLength(1)
    expect(trigger[0].textContent).toContain("2")
    a.unmount()

    h.letters.value = { count: 1, letters: [{ index: 0, print_format: "Letter A", filename: "a", pdf_base64: "QQ==" }] }
    render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    expect(screen.getAllByRole("button", { name: /Preview \/ Download Offer/ })).toHaveLength(2)
  })

  // Spec: CAND-04-A4.4E (docs/spec/clauses/04-dashboard.md#cand-04-a4-4e)
  // Characterization: pins current behaviour, not endorsed.
  it("hides every offer and culture button when there is no profile, and disables the offer buttons when no URL or letter is available", () => {
    h.profile.value = null
    const a = render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    expect(screen.queryByRole("button", { name: /Preview \/ Download Offer/ })).toBeNull()
    expect(screen.queryByRole("button", { name: /Culture Book/ })).toBeNull()
    expect(screen.getByRole("link", { name: /Complete your onboarding/ }).getAttribute("href")).toBe("/onboarding")
    a.unmount()

    h.profile.value = { id: "p1" }
    h.pdfUrl.value = null
    render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
    for (const b of screen.getAllByRole("button", { name: /Preview \/ Download Offer/ })) {
      expect((b as HTMLButtonElement).disabled).toBe(true)
    }
  })

  // Spec: CAND-04-A4.5E (docs/spec/clauses/04-dashboard.md#cand-04-a4-5e)
  // Characterization: pins current behaviour, not endorsed.
  it("opens a culture book URL in a new tab when the check answers JSON available, warns when it answers available false, and opens it anyway when the check fails", async () => {
    const open = vi.fn()
    vi.stubGlobal("open", open)
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    try {
      render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
      const button = screen.getByRole("button", { name: /Culture Book/ })

      fetchMock.mockResolvedValueOnce({ headers: { get: () => "application/json" }, json: async () => ({ message: { available: false } }) })
      fireEvent.click(button)
      await vi.waitFor(() => expect(h.toastError).toHaveBeenCalledWith("Culture book is not available."))
      expect(open).not.toHaveBeenCalled()

      fetchMock.mockResolvedValueOnce({ headers: { get: () => "application/pdf" }, json: async () => ({}) })
      fireEvent.click(button)
      await vi.waitFor(() => expect(open).toHaveBeenCalledTimes(1))
      expect(open).toHaveBeenLastCalledWith("https://files.example.invalid/culture.pdf", "_blank", "noopener,noreferrer")

      fetchMock.mockRejectedValueOnce(new Error("offline"))
      fireEvent.click(button)
      await vi.waitFor(() => expect(open).toHaveBeenCalledTimes(2))
      expect(fetchMock).toHaveBeenCalledWith("https://files.example.invalid/culture.pdf", { credentials: "include" })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  // Spec: CAND-04-A4.4F (docs/spec/clauses/04-dashboard.md#cand-04-a4-4f)
  // Characterization: pins current behaviour, not endorsed.
  it("shows an error toast when the offer download answers not OK and keeps a data: URL out of fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal("fetch", fetchMock)
    try {
      render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
      const [mobile] = screen.getAllByRole("button", { name: /Preview \/ Download Offer/ })
      fireEvent.click(mobile)
      await vi.waitFor(() => expect(h.toastError).toHaveBeenCalledWith("Could not download the offer letter. Please try again."))
      expect(fetchMock).toHaveBeenCalledWith("https://files.example.invalid/offer.pdf", { credentials: "include" })

      fetchMock.mockClear()
      h.toastError.mockClear()
      h.pdfUrl.value = null
      h.summary.value = { employment_type: "Trainee" }
      h.letters.value = { count: 1, letters: [{ index: 0, print_format: "Letter A", filename: "a", pdf_base64: "QQ==" }] }
      document.body.innerHTML = ""
      render(<OnboardingSnapshot completedSteps={1} totalSteps={8} dashboardPayload={payload()} />)
      const [mobile2] = screen.getAllByRole("button", { name: /Preview \/ Download Offer/ })
      fireEvent.click(mobile2)
      await Promise.resolve()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(h.toastError).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
