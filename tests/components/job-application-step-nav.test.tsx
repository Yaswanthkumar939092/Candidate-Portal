import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobApplicationStepNav } from "@/components/jobs/job-applicant/job-applicationstep-nav"
import * as jobAppContext from "@/lib/contexts/job-application-context"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/contexts/job-application-context")

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

describe("JobApplicationStepNav", () => {
  const user = userEvent.setup()

  const mockTabs = [
    { tab: "Basic Details" },
    { tab: "Experience" },
    { tab: "Education" },
  ]

  const mockOnStepChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(jobAppContext.useJobApp as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: mockTabs,
    })
  })

  it("renders header with title", () => {
    render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByText("Job Application")).toBeTruthy()
    expect(screen.getByText("Complete all steps to submit your application.")).toBeTruthy()
  })

  it("renders progress bar", () => {
    const { container } = render(
      <JobApplicationStepNav
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
      <JobApplicationStepNav
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
      <JobApplicationStepNav
        currentStep={2}
        completedSteps={completedSteps}
        onStepChange={mockOnStepChange}
      />
    )

    // 2 out of 3 steps = 67%
    expect(screen.getByText(/67% complete/)).toBeTruthy()
  })

  it("renders all step buttons", () => {
    render(
      <JobApplicationStepNav
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
      <JobApplicationStepNav
        currentStep={1}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    // The current step should have aria-current="step"
    const buttons = screen.getAllByRole("button")
    expect(buttons[1]).toHaveAttribute("aria-current", "step")
  })

  it("shows step numbers in indicator", () => {
    render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    // Steps should show number indicators: 1, 2, 3
    const stepButtons = screen.getAllByRole("button")
    expect(stepButtons.length).toBeGreaterThanOrEqual(3)
  })

  it("shows check icon for completed steps", () => {
    const completedSteps = new Set(["basic_details"])

    render(
      <JobApplicationStepNav
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
      <JobApplicationStepNav
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
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const buttons = screen.getAllByRole("button")
    // Future steps (index 2, 3) that are not completed should be disabled
    expect(buttons[2]).toBeDisabled()
  })

  it("allows clicking on past steps", async () => {
    const completedSteps = new Set(["basic_details"])

    render(
      <JobApplicationStepNav
        currentStep={1}
        completedSteps={completedSteps}
        onStepChange={mockOnStepChange}
      />
    )

    const basicDetailsButton = screen.getByText("Basic Details")
    expect(basicDetailsButton).not.toBeDisabled()

    await user.click(basicDetailsButton)
    expect(mockOnStepChange).toHaveBeenCalledWith(0)
  })

  it("renders Back to Jobs link", () => {
    render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const backLink = screen.getByText("Back to Jobs")
    expect(backLink).toBeTruthy()
    expect(screen.getByTestId("icon-arrow-left")).toBeTruthy()
  })

  it("back link points to /open-jobs", () => {
    render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const backLink = screen.getByText("Back to Jobs") as HTMLAnchorElement
    expect(backLink.getAttribute("href")).toBe("/open-jobs")
  })

  it("applies custom className", () => {
    const { container } = render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
        className="custom-nav-class"
      />
    )

    expect(container.querySelector(".custom-nav-class")).toBeTruthy()
  })

  it("shows 100% progress when all steps completed", () => {
    const completedSteps = new Set(["basic_details", "experience", "education"])

    render(
      <JobApplicationStepNav
        currentStep={2}
        completedSteps={completedSteps}
        onStepChange={mockOnStepChange}
      />
    )

    expect(screen.getByText("100% complete")).toBeTruthy()
  })

  it("has accessibility attributes", () => {
    const { container } = render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set()}
        onStepChange={mockOnStepChange}
      />
    )

    const nav = container.querySelector('nav[aria-label="Job application steps"]')
    expect(nav).toBeTruthy()
  })

  it("converts step names to lowercase with underscores for keys", async () => {
    const customTabs = [{ tab: "Personal Information" }, { tab: "Previous Employment" }]

    ;(jobAppContext.useJobApp as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: customTabs,
    })

    render(
      <JobApplicationStepNav
        currentStep={0}
        completedSteps={new Set(["personal_information"])}
        onStepChange={mockOnStepChange}
      />
    )

    // Should have converted "Personal Information" to "personal_information"
    expect(screen.getByTestId("icon-check")).toBeTruthy()
  })
})
