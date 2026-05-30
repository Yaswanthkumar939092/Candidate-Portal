import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { PreOfferStep } from "@/components/pre-offer-form/DynamicField"
import * as preOfferContext from "@/lib/contexts/pre-offer-context"

vi.mock("@/lib/contexts/pre-offer-context")

const { mockToastWarning } = vi.hoisted(() => ({
  mockToastWarning: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: mockToastWarning,
  },
}))

vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form")
  return {
    ...actual,
    useWatch: vi.fn(),
  }
})

vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: (props: any) => {
    const { field, onChange, overrides } = props
    const defaultRender = (
      <div>
        <label>{field.label}</label>
        <input
          data-testid={`input-${field.fieldname}`}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    )

    const overrideElements: any[] = []
    if (overrides) {
      Object.entries(overrides).forEach(([key, val]: any) => {
        if (val?.component) {
          const C = val.component
          overrideElements.push(
            <div key={key} data-testid={`render-override-${key}-${field.fieldname}`}>
              <C {...props} />
            </div>
          )
        }
      })
    }

    return <>{defaultRender}{overrideElements}</>
  },
}))

vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: ({ label, value, onChange }: any) => (
    <div data-testid="file-upload-component">
      <span>{label}</span>
      <span>{value}</span>
      <button type="button" onClick={() => onChange("uploaded_url.pdf")}>Upload</button>
    </div>
  ),
}))

vi.mock("@/components/pre-offer-form/ChildTable", () => ({
  PreOfferTableField: ({ field, onChange }: any) => (
    <div data-testid="table-field-component">
      <span>{field.label}</span>
      <button type="button" onClick={() => onChange([{ child_col: "val" }])}>Add Row</button>
    </div>
  ),
}))

describe("PreOfferStep", () => {
  const mockTab = {
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
            hidden: 0,
          },
          {
            fieldname: "resume",
            label: "Resume Attachment",
            fieldtype: "Attach",
            reqd: 0,
            hidden: 0,
          },
          {
            fieldname: "avatar",
            label: "Avatar Attachment",
            fieldtype: "Attach Image",
            reqd: 0,
            hidden: 0,
          },
          {
            fieldname: "work_history",
            label: "Work History Table",
            fieldtype: "Table",
            reqd: 0,
            hidden: 0,
          },
        ],
      },
    ],
  }

  const mockMethods = {
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault()
      fn({ full_name: "John Doe", resume: "", avatar: "", work_history: [] })
    },
    watch: () => ({ full_name: "John Doe", resume: "", avatar: "", work_history: [] }),
    setValue: vi.fn(),
    control: {},
    formState: { errors: {} },
  }

  const mockSetStepData = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(preOfferContext.usePreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      setStepData: mockSetStepData,
    })
  })

  it("renders step fields and custom override components", () => {
    render(
      <PreOfferStep
        tab={mockTab}
        stepKey="basic_details"
        currentStep={0}
        totalSteps={2}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        methods={mockMethods}
      />
    )

    expect(screen.getAllByText("Full Name").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Resume Attachment").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Avatar Attachment").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Work History Table").length).toBeGreaterThan(0)

    // Assert custom override mock wrappers mounted successfully
    expect(screen.getByTestId("render-override-Attach-resume")).toBeTruthy()
    expect(screen.getByTestId("render-override-Attach Image-avatar")).toBeTruthy()
    expect(screen.getByTestId("render-override-Table-resume")).toBeTruthy()
  })

  it("calls setValue when custom file upload onChange triggers", () => {
    render(
      <PreOfferStep
        tab={mockTab}
        stepKey="basic_details"
        currentStep={0}
        totalSteps={2}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        methods={mockMethods}
      />
    )

    const resumeContainer = screen.getByTestId("render-override-Attach-resume")
    const uploadBtn = within(resumeContainer).getByRole("button", { name: "Upload" })
    fireEvent.click(uploadBtn)

    expect(mockMethods.setValue).toHaveBeenCalledWith("resume", "uploaded_url.pdf", { shouldValidate: false })
  })

  it("calls setValue when custom table field onChange triggers", () => {
    render(
      <PreOfferStep
        tab={mockTab}
        stepKey="basic_details"
        currentStep={0}
        totalSteps={2}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        methods={mockMethods}
      />
    )

    const tableContainer = screen.getByTestId("render-override-Table-resume")
    const addRowBtn = within(tableContainer).getByRole("button", { name: "Add Row" })
    fireEvent.click(addRowBtn)

    expect(mockMethods.setValue).toHaveBeenCalledWith("resume", [{ child_col: "val" }], { shouldValidate: false })
  })

  it("calls onNext and setStepData when form is submitted", () => {
    const mockOnNext = vi.fn()
    const { container } = render(
      <PreOfferStep
        tab={mockTab}
        stepKey="basic_details"
        currentStep={0}
        totalSteps={2}
        onNext={mockOnNext}
        onPrev={vi.fn()}
        methods={mockMethods}
      />
    )

    const form = container.querySelector("form")
    fireEvent.submit(form!)

    expect(mockSetStepData).toHaveBeenCalledWith("basic_details", { full_name: "John Doe", resume: "", avatar: "", work_history: [] })
    expect(mockOnNext).toHaveBeenCalled()
  })

  it("shows toast warning when validation fails on submit", () => {
    const mockMethodsWithMissing = {
      handleSubmit: (fn: any) => (e: any) => {
        e?.preventDefault()
        fn({ full_name: "" })
      },
      watch: () => ({ full_name: "" }),
      setValue: vi.fn(),
      control: {},
      formState: { errors: {} },
    }

    const { container } = render(
      <PreOfferStep
        tab={mockTab}
        stepKey="basic_details"
        currentStep={0}
        totalSteps={2}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        methods={mockMethodsWithMissing}
      />
    )

    const form = container.querySelector("form")
    fireEvent.submit(form!)

    expect(mockToastWarning).toHaveBeenCalledWith("Please fill all required fields before proceeding.")
  })
})
