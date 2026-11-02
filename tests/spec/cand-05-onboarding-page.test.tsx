import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { OnboardingTab } from "@/lib/types/onboarding"

const mockUseOnboarding = vi.fn()

vi.mock("@/lib/contexts/onboarding-context", () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useOnboarding: () => mockUseOnboarding(),
}))

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("@/components/onboarding/onboarding-step-nav", () => ({
  OnboardingStepNav: () => <div data-testid="onboarding-step-nav">Sidebar Nav</div>,
}))

vi.mock("@/components/onboarding/steps/review-step", () => ({
  ReviewStep: () => <div data-testid="review-step">Review Step Mock</div>,
}))

vi.mock("@/components/onboarding/onboarding-form-step", () => ({
  OnboardingFormStep: ({ stepKey }: { tab: OnboardingTab; stepKey: string }) => (
    <div data-testid="onboarding-form-step">{stepKey}</div>
  ),
}))

vi.mock("@/components/onboarding/onboarding-right-rail", () => ({
  OnboardingRightRail: ({ focusedFieldname }: { focusedFieldname: string | null }) => (
    <div data-testid="right-rail">{String(focusedFieldname)}</div>
  ),
}))

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress-bar">{value}</div>,
}))

const mockPush = vi.fn()
const mockInvalidateQueries = vi.fn()

import OnboardingPage from "@/app/(portal)/onboarding/page"

const tabs = [
  { tab: "Personal Info", sections: [{ section: "section-basic_details", fields: [] }] },
  { tab: "Work Experience", sections: [{ section: "Work History", fields: [] }] },
]

function state(overrides: Record<string, unknown> = {}) {
  return {
    currentStep: 0,
    completedSteps: new Set<string>(),
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
    formConfig: { tabs },
    stepData: {},
    prevStep: vi.fn(),
    triggerSubmit: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Onboarding page gates", () => {
  // Spec: CAND-05-A7.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("keeps the loading screen when loading has stopped but no form arrived and no error was reported", () => {
    mockUseOnboarding.mockReturnValue(state({ isLoading: false, isError: false, formConfig: undefined }))
    render(<OnboardingPage />)
    expect(screen.getByText("Loading your onboarding data...")).toBeTruthy()
    expect(screen.queryByTestId("onboarding-step-nav")).toBeNull()
  })

  // Spec: CAND-05-A7.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("clears the dashboard query and routes to the dashboard from the not-started screen", async () => {
    const user = userEvent.setup()
    mockUseOnboarding.mockReturnValue(state({ isError: true, formConfig: undefined }))
    render(<OnboardingPage />)

    await user.click(screen.getByRole("button", { name: /Back to Dashboard/i }))
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] })
    expect(mockPush).toHaveBeenCalledWith("/dashboard")
  })

  // Spec: CAND-05-A7.1C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the wizard's review step, and no read-only copy, when the status is submitted but the form carries no tab", () => {
    mockUseOnboarding.mockReturnValue(state({ status: "submitted", formConfig: { tabs: [] } }))
    render(<OnboardingPage />)

    expect(screen.queryByText("You have already submitted your onboarding details.")).toBeNull()
    expect(screen.getByTestId("review-step")).toBeTruthy()
    expect(screen.queryByTestId("onboarding-step-nav")).toBeNull()
    expect(screen.queryByTestId("progress-bar")).toBeNull()
  })

  // Spec: CAND-05-A7.1D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the spinner while the context is loading and the not-started screen once it reports an error", () => {
    mockUseOnboarding.mockReturnValue(state({ isLoading: true }))
    const loading = render(<OnboardingPage />)
    expect(screen.getByText("Loading your onboarding data...")).toBeTruthy()
    expect(screen.queryByText("Onboarding not yet started")).toBeNull()
    loading.unmount()

    mockUseOnboarding.mockReturnValue(state({ isError: true, formConfig: undefined }))
    render(<OnboardingPage />)
    expect(screen.getByText("Onboarding not yet started")).toBeTruthy()
    expect(screen.queryByText("Loading your onboarding data...")).toBeNull()
    expect(screen.getByRole("button", { name: /Back to Dashboard/i })).toBeTruthy()
  })

  // Spec: CAND-05-A7.1E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-1e)
  // Characterization: pins current behaviour, not endorsed.
  it("replaces the whole wizard with a read-only copy of the submitted answers when the status is submitted and a tab exists", () => {
    mockUseOnboarding.mockReturnValue(
      state({
        status: "submitted",
        currentStep: 1,
        formConfig: {
          branding: { company_name: "Test Company" },
          tabs: [
            {
              tab: "Personal Info",
              sections: [
                {
                  section: "Basics",
                  fields: [{ fieldname: "first_name", label: "First Name", fieldtype: "Data", value: "Test Candidate" }],
                },
              ],
            },
          ],
        },
      }),
    )
    render(<OnboardingPage />)

    expect(screen.getByText("You have already submitted your onboarding details.")).toBeTruthy()
    expect(screen.getByText("First Name")).toBeTruthy()
    expect(screen.getByText("Test Candidate")).toBeTruthy()
    expect(screen.queryByTestId("onboarding-step-nav")).toBeNull()
    expect(screen.queryByTestId("right-rail")).toBeNull()
    expect(screen.queryByRole("button", { name: /Save & Next/i })).toBeNull()
  })
})

describe("Onboarding page progress and step key", () => {
  // Spec: CAND-05-A7.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("takes the percentage from the backend field counts when their total is above zero, and from the completed steps otherwise", () => {
    mockUseOnboarding.mockReturnValue(
      state({
        completedSteps: new Set(["personal_info"]),
        formConfig: { tabs, field_status_counts: { total: 8, filled: 2, approved: 2, rejected: 0, pending: 4 } },
      }),
    )
    const counted = render(<OnboardingPage />)
    expect(screen.getByTestId("progress-bar").textContent).toBe("50")
    expect(screen.getByText("Step 1 of 3")).toBeTruthy()
    counted.unmount()

    mockUseOnboarding.mockReturnValue(
      state({
        completedSteps: new Set(["personal_info"]),
        formConfig: { tabs, field_status_counts: { total: 0, filled: 0, approved: 0, rejected: 0, pending: 0 } },
      }),
    )
    render(<OnboardingPage />)
    // One of three steps (two tabs plus the review step) is complete.
    expect(Number(screen.getByTestId("progress-bar").textContent)).toBeCloseTo(100 / 3, 5)
  })

  // Spec: CAND-05-A7.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("builds the step key from the tab name by lower-casing it and replacing runs of spaces with underscores", () => {
    mockUseOnboarding.mockReturnValue(state({ currentStep: 1 }))
    render(<OnboardingPage />)
    expect(screen.getByTestId("onboarding-form-step").textContent).toBe("work_experience")
  })

  // Spec: CAND-05-A7.2C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("names the first section of the current tab in the autosave bar, with the section- prefix and underscores removed", () => {
    mockUseOnboarding.mockReturnValue(state({ currentStep: 0 }))
    render(<OnboardingPage />)
    expect(screen.getByText("Basic Details")).toBeTruthy()
    expect(screen.getByText("All changes saved")).toBeTruthy()
  })

  // Spec: CAND-05-A7.3A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("disables the mobile Previous button on the first step and asks the registered form to save and continue", async () => {
    const user = userEvent.setup()
    const triggerSubmit = vi.fn()
    const prevStep = vi.fn()
    mockUseOnboarding.mockReturnValue(state({ currentStep: 0, prevStep, triggerSubmit }))
    render(<OnboardingPage />)

    const previous = screen.getByRole("button", { name: /Previous/i })
    expect((previous as HTMLButtonElement).disabled).toBe(true)

    await user.click(screen.getByRole("button", { name: /Save & Next/i }))
    expect(triggerSubmit).toHaveBeenCalledWith("save_continue")
    expect(prevStep).not.toHaveBeenCalled()
  })

  // Spec: CAND-05-A7.3B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a7-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("reports saving in the autosave bar and on the Save button while a save is in flight", () => {
    mockUseOnboarding.mockReturnValue(state({ isSaving: true }))
    render(<OnboardingPage />)

    expect(screen.getByText("Saving changes...")).toBeTruthy()
    expect(screen.queryByText("All changes saved")).toBeNull()
    const save = screen.getByRole("button", { name: /Saving\.\.\./i }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
  })
})
