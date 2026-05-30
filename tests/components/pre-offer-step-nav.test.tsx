import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PreOfferStepNav } from "@/components/pre-offer-form/pre-offer-step-nav"
import * as preOfferContext from "@/lib/contexts/pre-offer-context"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/contexts/pre-offer-context")

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    ArrowLeft: () => <div data-testid="icon-arrow-left" />,
    Check: () => <div data-testid="icon-check" />,
  }
})

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

describe("PreOfferStepNav", () => {
  const user = userEvent.setup()

  const mockTabs = [
    { tab: "Basic Details" },
    { tab: "Experience" },
    { tab: "Education" },
  ]

  const mockOnStepChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(preOfferContext.usePreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: mockTabs,
    })
  })

  it("renders header with title", () => {
    render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByText("Pre-Offer Form")).toBeTruthy()
    expect(screen.getByText("Complete all steps to submit your pre-offer details.")).toBeTruthy()
  })

  it("renders progress bar", () => {
    const { container } = render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByText(/% complete/)).toBeTruthy()
    const progressBar = container.querySelector("div[class*='h-']")
    expect(progressBar).toBeTruthy()
  })

  it("displays 0% progress when no steps completed", () => {
    render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByText("0% complete")).toBeTruthy()
  })

  it("calculates progress percentage correctly", () => {
    const completedSteps = new Set(["basic_details", "experience"])

    render(
      <PreOfferStepNav
        currentStep={2}
        completedSteps={completedSteps}
        onStepChange={mockOnStepChange}
      />
    )

    // 2 out of 4 steps (3 tabs + 1 review) = 50%
    expect(screen.getByText(/50% complete/)).toBeTruthy()
  })

  it("renders all step buttons", () => {
    render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByText("Basic Details")).toBeTruthy()
    expect(screen.getByText("Experience")).toBeTruthy()
    expect(screen.getByText("Education")).toBeTruthy()
  })

  it("highlights current step", () => {
    render(
      <PreOfferStepNav
        currentStep={1}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    // The current step should have aria-current="step"
    const buttons = screen.getAllByRole("button")
    expect(buttons[1]).toHaveAttribute("aria-current", "step")
  })

  it("shows check icon for completed steps", () => {
    const completedSteps = new Set(["basic_details"])

    render(
      <PreOfferStepNav
        currentStep={1}
        completedSteps={completedSteps}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByTestId("icon-check")).toBeTruthy()
  })

  it("calls onStepChange when a clickable step is clicked", async () => {
    const completedSteps = new Set(["basic_details"])

    render(
      <PreOfferStepNav
        currentStep={1}
        completedSteps={completedSteps}
        onStepChange={mockOnStepChange}
      />
    )

    const basicDetailsButton = screen.getByText("Basic Details")
    await user.click(basicDetailsButton)

    expect(mockOnStepChange).toHaveBeenCalledWith(0)
  })

  it("disables non-clickable future steps", () => {
    render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const buttons = screen.getAllByRole("button")
    // Future steps that are not completed should be disabled
    expect(buttons[2]).toBeDisabled()
  })

  it("renders Back to Dashboard link", () => {
    render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const backLink = screen.getByText("Back to Dashboard")
    expect(backLink).toBeTruthy()
    expect(screen.getByTestId("icon-arrow-left")).toBeTruthy()
  })

  it("back link points to /", () => {
    render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const backLink = screen.getByText("Back to Dashboard") as HTMLAnchorElement
    expect(backLink.getAttribute("href")).toBe("/")
  })

  it("applies custom className", () => {
    const { container } = render(
      <PreOfferStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
        className="custom-nav-class"
      />
    )

    expect(container.querySelector(".custom-nav-class")).toBeTruthy()
  })
})
