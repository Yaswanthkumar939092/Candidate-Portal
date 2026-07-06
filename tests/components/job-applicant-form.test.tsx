import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import JobApplicationPage from "@/components/jobs/job-applicant/JobApplicantForm"
import * as jobAppContext from "@/lib/contexts/job-application-context"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/contexts/job-application-context")

const mockUseAuth = vi.fn()
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}))
const mockUseGetDraftJobApplicant = vi.fn()
vi.mock("@/lib/hooks/useJobOpening", () => ({
  useCreateJobApplicant: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteDraftJobApplicant: vi.fn(() => ({ mutate: vi.fn() })),
  useGetDraftJobApplicant: () => mockUseGetDraftJobApplicant(),
}))

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Loader2: () => <div data-testid="icon-loader" />,
  }
})

vi.mock("@/components/jobs/job-applicant/job-applicationstep-nav", () => ({
  JobApplicationStepNav: ({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<string> }) => (
    <nav data-testid="step-nav">
      <div>Job Application</div>
      <div>Complete all steps to submit your application.</div>
      <div>{Math.round((completedSteps.size / 2) * 100)}% complete</div>
      <div>Current Step: {currentStep}</div>
    </nav>
  ),
}))

interface MockJobTab {
  tab: string
  sections: Array<{
    fields: Array<{
      label: string
      fieldname: string
    }>
  }>
}

interface MockJobApplicationStepProps {
  tab: MockJobTab
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
}

vi.mock("@/components/jobs/job-applicant/DynamicField", () => ({
  JobApplicationStep: ({ tab, currentStep, totalSteps, onNext, onPrev }: MockJobApplicationStepProps) => (
    <form data-testid="job-form">
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
        {currentStep === totalSteps - 1 ? "Submit Application" : "Next Step"}
      </button>
    </form>
  ),
}))

describe("JobApplicationPage", () => {
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
    mockUseAuth.mockReturnValue({ user: { email: "test@example.com" } })
    mockUseGetDraftJobApplicant.mockReturnValue({ data: null, isLoading: false })
      ; (jobAppContext.useJobApp as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
        tabs: mockTabs,
        isLoading: false,
        stepData: {},
        setStepData: vi.fn(),
        initializeAllStepsFromDraft: vi.fn(),
      })
  })

  it("renders loading state", () => {
    ; (jobAppContext.useJobApp as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: [],
      isLoading: true,
      stepData: {},
      setStepData: vi.fn(),
    })

    render(<JobApplicationPage jobID="job-123" />)
    expect(screen.getByTestId("icon-loader")).toBeTruthy()
  })

  it("returns null when no tabs are available", () => {
    ; (jobAppContext.useJobApp as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: [],
      isLoading: false,
      stepData: {},
      setStepData: vi.fn(),
    })

    const { container } = render(<JobApplicationPage jobID="job-123" />)
    expect(container.firstChild).toBeNull()
  })


  it("displays sidebar navigation", () => {
    render(<JobApplicationPage jobID="job-123" />)

    expect(screen.getByTestId("step-nav")).toBeTruthy()
    expect(screen.getByText("Job Application")).toBeTruthy()
    expect(screen.getByText("Complete all steps to submit your application.")).toBeTruthy()
  })

  it("renders form content for current step", () => {
    render(<JobApplicationPage jobID="job-123" />)

    expect(screen.getByText("Full Name")).toBeTruthy()
    expect(screen.getByText("Email")).toBeTruthy()
  })

  it("renders Next Step button on first step", () => {
    render(<JobApplicationPage jobID="job-123" />)

    const nextButton = screen.getByRole("button", { name: /Next Step/i })
    expect(nextButton).toBeTruthy()
  })

  it("disables Previous button on first step", () => {
    render(<JobApplicationPage jobID="job-123" />)

    const prevButton = screen.getByRole("button", { name: /Previous/i })
    expect(prevButton).toBeDisabled()
  })

  it("shows initial progress in sidebar", () => {
    render(<JobApplicationPage jobID="job-123" />)

    // Check that progress text is rendered (should be 0% complete initially)
    const progressText = screen.getByText(/complete/)
    expect(progressText).toBeTruthy()
  })

  it("has form element with test id", () => {
    render(<JobApplicationPage jobID="job-123" />)

    expect(screen.getByTestId("job-form")).toBeTruthy()
  })

  it("renders all form sections", () => {
    render(<JobApplicationPage jobID="job-123" />)

    // Check that all field labels are rendered
    const fullNameLabel = screen.getByText("Full Name")
    const emailLabel = screen.getByText("Email")

    expect(fullNameLabel).toBeTruthy()
    expect(emailLabel).toBeTruthy()
  })

  it("renders both navigation buttons", () => {
    render(<JobApplicationPage jobID="job-123" />)

    const prevButton = screen.getByRole("button", { name: /Previous/i })
    const nextButton = screen.getByRole("button", { name: /Next Step/i })

    expect(prevButton).toBeTruthy()
    expect(nextButton).toBeTruthy()
  })

  it("maintains layout structure with main content", () => {
    const { container } = render(<JobApplicationPage jobID="job-123" />)

    // Check that the main structure exists
    const mainElement = container.querySelector("main")
    expect(mainElement).toBeTruthy()
  })


})
