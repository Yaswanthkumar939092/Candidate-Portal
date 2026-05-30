import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PreOfferForm from "@/components/pre-offer-form/PreOfferForm"
import * as preOfferContext from "@/lib/contexts/pre-offer-context"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/contexts/pre-offer-context")

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Loader2: () => <div data-testid="icon-loader" />,
    Check: () => <div data-testid="icon-check" />,
  }
})

vi.mock("@/components/pre-offer-form/pre-offer-step-nav", () => ({
  PreOfferStepNav: ({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<string> }) => (
    <nav data-testid="step-nav">
      <div>Pre-Offer Form</div>
      <div>Complete all steps to submit your pre-offer details.</div>
      <div>{Math.round((completedSteps.size / 2) * 100)}% complete</div>
      <div>Current Step: {currentStep}</div>
    </nav>
  ),
}))

vi.mock("@/components/pre-offer-form/pre-offer-review-step", () => ({
  PreOfferReviewStep: ({ onSuccess, onPrev }: { onSuccess: () => void; onPrev: () => void }) => (
    <div data-testid="review-step">
      <button type="button" onClick={onPrev}>Go Back</button>
      <button type="button" onClick={onSuccess}>Trigger Success</button>
    </div>
  ),
}))

interface MockPreOfferTab {
  tab: string
  sections: Array<{
    fields: Array<{
      label: string
      fieldname: string
    }>
  }>
}

interface MockPreOfferStepProps {
  tab: MockPreOfferTab
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
}

vi.mock("@/components/pre-offer-form/DynamicField", () => ({
  PreOfferStep: ({ tab, currentStep, totalSteps, onNext, onPrev }: MockPreOfferStepProps) => (
    <form data-testid="pre-offer-form">
      <div>Step {currentStep + 1} of {totalSteps}</div>
      <div>{tab.tab}</div>
      {tab.sections.map((section, idx: number) => (
        <div key={idx}>
          {section.fields.map((field, fidx: number) => (
            <div key={fidx}>
              <label>{field.label}</label>
            </div>
          ))}
        </div>
      ))}
      <button type="button" onClick={onPrev} disabled={currentStep === 0}>
        Previous
      </button>
      <button type="button" onClick={onNext}>
        Next Step
      </button>
    </form>
  ),
}))

describe("PreOfferForm component", () => {
  const mockTabs = [
    {
      tab: "Basic Details",
      sections: [
        {
          section: "Basic Details",
          fields: [
            {
              fieldname: "full_name",
              label: "Full Name",
              fieldtype: "Data",
              reqd: 1,
            },
            {
              fieldname: "email",
              label: "Email",
              fieldtype: "Data",
              reqd: 1,
            },
          ],
        },
      ],
    },
    {
      tab: "Experience",
      sections: [
        {
          section: "Experience",
          fields: [
            {
              fieldname: "years_experience",
              label: "Years of Experience",
              fieldtype: "Int",
              reqd: 1,
            },
          ],
        },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(preOfferContext.usePreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: mockTabs,
      allFields: [
        { fieldname: "full_name", label: "Full Name", fieldtype: "Data", value: "" },
        { fieldname: "email", label: "Email", fieldtype: "Data", value: "" },
      ],
      isLoading: false,
      stepData: {},
      setStepData: vi.fn(),
      initializeAllStepsFromDraft: vi.fn(),
    })
  })

  it("renders loading state", () => {
    ;(preOfferContext.usePreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: [],
      allFields: [],
      isLoading: true,
      stepData: {},
      setStepData: vi.fn(),
      initializeAllStepsFromDraft: vi.fn(),
    })

    render(<PreOfferForm />)
    expect(screen.getByTestId("icon-loader")).toBeTruthy()
  })

  it("returns null when no tabs are available", () => {
    ;(preOfferContext.usePreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: [],
      allFields: [],
      isLoading: false,
      stepData: {},
      setStepData: vi.fn(),
      initializeAllStepsFromDraft: vi.fn(),
    })

    const { container } = render(<PreOfferForm />)
    expect(container.firstChild).toBeNull()
  })

  it("displays sidebar navigation", () => {
    render(<PreOfferForm />)

    expect(screen.getByTestId("step-nav")).toBeTruthy()
    expect(screen.getByText("Pre-Offer Form")).toBeTruthy()
    expect(screen.getByText("Complete all steps to submit your pre-offer details.")).toBeTruthy()
  })

  it("renders form content for current step", () => {
    render(<PreOfferForm />)

    expect(screen.getByText("Full Name")).toBeTruthy()
    expect(screen.getByText("Email")).toBeTruthy()
  })

  it("renders Next Step button on first step", () => {
    render(<PreOfferForm />)

    const nextButton = screen.getByRole("button", { name: /Next Step/i })
    expect(nextButton).toBeTruthy()
  })

  it("disables Previous button on first step", () => {
    render(<PreOfferForm />)

    const prevButton = screen.getByRole("button", { name: /Previous/i })
    expect(prevButton).toBeDisabled()
  })

  it("navigates through steps to review and submit successfully", async () => {
    const user = userEvent.setup()
    render(<PreOfferForm />)

    // Initially at Step 1 (Basic Details)
    expect(screen.getAllByText("Basic Details").length).toBeGreaterThan(0)

    // Click Next Step
    const nextBtn = screen.getByRole("button", { name: /Next Step/i })
    await user.click(nextBtn)

    // Now at Step 2 (Experience)
    expect(screen.getAllByText("Experience").length).toBeGreaterThan(0)

    // Click Next Step again to go to Review step
    await user.click(screen.getByRole("button", { name: /Next Step/i }))

    // Now on Review Step mock
    expect(screen.getByTestId("review-step")).toBeTruthy()

    // Click Go Back
    await user.click(screen.getByRole("button", { name: /Go Back/i }))
    // Should be back to Experience step
    expect(screen.getAllByText("Experience").length).toBeGreaterThan(0)

    // Go forward again
    await user.click(screen.getByRole("button", { name: /Next Step/i }))

    // Click Trigger Success
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: "" }

    await user.click(screen.getByRole("button", { name: /Trigger Success/i }))

    // Should show Success view
    expect(screen.getByText("Details Submitted!")).toBeTruthy()

    // Click Return to Dashboard
    await user.click(screen.getByRole("button", { name: /Return to Dashboard/i }))
    expect(window.location.href).toBe("/")

    // Restore window.location
    window.location = originalLocation
  })
})
