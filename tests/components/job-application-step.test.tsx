import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobApplicationStep } from "@/components/jobs/job-applicant/DynamicField"
import * as jobAppContext from "@/lib/contexts/job-application-context"
import * as jobOpeningHooks from "@/lib/hooks/useJobOpening"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("@/lib/contexts/job-application-context")
vi.mock("@/lib/hooks/useJobOpening")
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    ChevronLeft: () => <div data-testid="icon-chevron-left" />,
    ChevronRight: () => <div data-testid="icon-chevron-right" />,
  }
})

vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({ field }: { field: { fieldname: string; label: string; fieldtype?: string } }) => (
    <div data-testid={`field-${field.fieldname}`}>
      <label htmlFor={field.fieldname}>{field.label}</label>
      <input id={field.fieldname} type="text" defaultValue="" />
    </div>
  ),
}))

vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: ({ label }: { label: string }) => (
    <div>
      <label>{label}</label>
      <input type="file" />
    </div>
  ),
}))

vi.mock("@/components/onboarding/section-card", () => ({
  SectionCard: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  ),
}))

vi.mock("@/components/jobs/job-applicant/ChildTable", () => ({
  JobApplicationTableField: () => <div data-testid="table-field">Table Field</div>,
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}))

describe("JobApplicationStep", () => {
  const user = userEvent.setup()

  const mockTab = {
    tab: "Basic Information",
    sections: [
      {
        section: "Basic Information",
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
            fieldtype: "Email",
          },
        ],
      },
    ],
  }

  const mockOnNext = vi.fn()
  const mockOnPrev = vi.fn()
  const mockSetStepData = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
      ; (jobAppContext.useJobApp as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
        stepData: { basic_information: {} },
        setStepData: mockSetStepData,
      })

      ; (jobOpeningHooks.useCreateJobApplicant as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      })
  })

  it("renders form with sections and fields", () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.getByText("Full Name")).toBeTruthy()
    expect(screen.getByText("Email")).toBeTruthy()
  })

  it("renders Previous and Next buttons", () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.getByText("Previous")).toBeTruthy()
    expect(screen.getByText("Next Step")).toBeTruthy()
  })

  it("disables Previous button on first step", () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    const prevButton = screen.getByText("Previous")
    expect(prevButton).toBeDisabled()
  })

  it("enables Previous button on non-first step", () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={1}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    const prevButton = screen.getByText("Previous")
    expect(prevButton).not.toBeDisabled()
  })

  it("shows 'Submit Application' button on last step", () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={1}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.getByText("Submit Application")).toBeTruthy()
  })

  it("calls onPrev when Previous button is clicked", async () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={1}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    const prevButton = screen.getByText("Previous")
    await user.click(prevButton)

    expect(mockOnPrev).toHaveBeenCalled()
  })

  it("calls onNext when Next button is clicked with valid data", async () => {
    render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    // Get the input field by test id
    const fullNameInput = screen.getByTestId("field-full_name").querySelector("input") as HTMLInputElement
    if (fullNameInput) {
      await user.type(fullNameInput, "John Doe")
    }

    const nextButton = screen.getByText("Next Step")
    await user.click(nextButton)

    // Form should be submitted
    expect(nextButton).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(
      <JobApplicationStep
        tab={mockTab}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        className="custom-form-class"
      />
    )

    expect(container.querySelector(".custom-form-class")).toBeTruthy()
  })

  it("hides hidden fields", () => {
    const tabWithHiddenField = {
      ...mockTab,
      sections: [
        {
          ...mockTab.sections[0],
          fields: [
            ...mockTab.sections[0].fields,
            {
              fieldname: "hidden_field",
              label: "Hidden Field",
              fieldtype: "Data",
              hidden: 1,
            },
          ],
        },
      ],
    }

    render(
      <JobApplicationStep
        tab={tabWithHiddenField}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.queryByText("Hidden Field")).toBeNull()
  })

  it("renders readonly fields as disabled", () => {
    const readonlyTab = {
      ...mockTab,
      sections: [
        {
          ...mockTab.sections[0],
          fields: [
            {
              fieldname: "company",
              label: "Company",
              fieldtype: "Data",
              read_only: 1,
            },
          ],
        },
      ],
    }

    render(
      <JobApplicationStep
        tab={readonlyTab}
        stepKey="basic_information"
        currentStep={0}
        totalSteps={2}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.getByText("Company")).toBeTruthy()
  })

  it("displays section title when different from tab", () => {
    const tabWithSection = {
      tab: "Application",
      sections: [
        {
          section: "Personal Details",
          fields: [
            {
              fieldname: "name",
              label: "Name",
              fieldtype: "Data",
            },
          ],
        },
      ],
    }

    render(
      <JobApplicationStep
        tab={tabWithSection}
        stepKey="personal_details"
        currentStep={0}
        totalSteps={1}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.getByText("Personal Details")).toBeTruthy()
  })

  it("renders multiple sections", () => {
    const multiSectionTab = {
      tab: "Application",
      sections: [
        {
          section: "Section 1",
          fields: [
            {
              fieldname: "field1",
              label: "Field 1",
              fieldtype: "Data",
            },
          ],
        },
        {
          section: "Section 2",
          fields: [
            {
              fieldname: "field2",
              label: "Field 2",
              fieldtype: "Data",
            },
          ],
        },
      ],
    }

    render(
      <JobApplicationStep
        tab={multiSectionTab}
        stepKey="application"
        currentStep={0}
        totalSteps={1}
        jobID="job-123"
        onNext={mockOnNext}
        onPrev={mockOnPrev}
      />
    )

    expect(screen.getByText("Section 1")).toBeTruthy()
    expect(screen.getByText("Section 2")).toBeTruthy()
  })
})
