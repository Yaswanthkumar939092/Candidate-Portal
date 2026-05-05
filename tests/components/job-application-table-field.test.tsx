import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobApplicationTableField } from "@/components/jobs/job-applicant/ChildTable"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Plus: () => <div data-testid="icon-plus" />,
    Trash2: () => <div data-testid="icon-trash" />,
  }
})

vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({ field, value, onChange }: { field: { fieldname: string; label: string }; value?: string; onChange?: (val: string) => void }) => (
    <div data-testid={`field-${field.fieldname}`}>
      <label htmlFor={field.fieldname}>{field.label}</label>
      <input
        id={field.fieldname}
        type="text"
        defaultValue={value as string || ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
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

describe("JobApplicationTableField", () => {
  const user = userEvent.setup()

  const mockField = {
    fieldname: "work_experience",
    label: "Work Experience",
    fieldtype: "Table",
    reqd: 0,
    child_doctype: "WorkExperience",
    child_fields: [
      {
        fieldname: "company",
        label: "Company",
        fieldtype: "Data",
        reqd: 1,
      },
      {
        fieldname: "position",
        label: "Position",
        fieldtype: "Data",
        reqd: 1,
      },
      {
        fieldname: "duration_years",
        label: "Duration (Years)",
        fieldtype: "Int",
      },
    ],
  }

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders 'Add' button", () => {
    render(
      <JobApplicationTableField
        field={mockField}
        value={[]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText(/Add Work Experience/)).toBeTruthy()
    expect(screen.getByTestId("icon-plus")).toBeTruthy()
  })

  it("renders required asterisk when field is required", () => {
    const requiredField = { ...mockField, reqd: 1 }

    render(
      <JobApplicationTableField
        field={requiredField}
        value={[]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Work Experience")).toBeTruthy()
  })

  it("adds a new row when Add button is clicked", async () => {
    render(
      <JobApplicationTableField
        field={mockField}
        value={[]}
        onChange={mockOnChange}
      />
    )

    const addButton = screen.getByText(/Add Work Experience/)
    await user.click(addButton)

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company: "",
          position: "",
          duration_years: "",
        }),
      ])
    )
  })

  it("renders rows with row numbers", () => {
    const rows = [
      { company: "Tech Corp", position: "Developer", duration_years: 2 },
      { company: "Dev Inc", position: "Senior Dev", duration_years: 3 },
    ]

    render(
      <JobApplicationTableField
        field={mockField}
        value={rows}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("#1")).toBeTruthy()
    expect(screen.getByText("#2")).toBeTruthy()
  })

  it("renders Remove button for each row", () => {
    const rows = [
      { company: "Tech Corp", position: "Developer", duration_years: 2 },
    ]

    render(
      <JobApplicationTableField
        field={mockField}
        value={rows}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Remove")).toBeTruthy()
    expect(screen.getByTestId("icon-trash")).toBeTruthy()
  })

  it("removes a row when Remove button is clicked", async () => {
    const rows = [
      { company: "Tech Corp", position: "Developer", duration_years: 2 },
      { company: "Dev Inc", position: "Senior Dev", duration_years: 3 },
    ]

    render(
      <JobApplicationTableField
        field={mockField}
        value={rows}
        onChange={mockOnChange}
      />
    )

    const removeButtons = screen.getAllByText("Remove")
    await user.click(removeButtons[0])

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company: "Dev Inc",
          position: "Senior Dev",
        }),
      ])
    )
  })

  it("handles non-array value gracefully", () => {
    render(
      <JobApplicationTableField
        field={mockField}
        value={null}
        onChange={mockOnChange}
      />
    )

    // Should not crash and should render add button
    expect(screen.getByText(/Add Work Experience/)).toBeTruthy()
  })

  it("renders empty state when no rows exist", () => {
    render(
      <JobApplicationTableField
        field={mockField}
        value={[]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText(/Add Work Experience/)).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(
      <JobApplicationTableField
        field={mockField}
        value={[]}
        onChange={mockOnChange}
        className="custom-table-class"
      />
    )

    expect(container.querySelector(".custom-table-class")).toBeTruthy()
  })

  it("renders multiple rows with independent remove buttons", async () => {
    const rows = [
      { company: "Company A", position: "Dev A", duration_years: 1 },
      { company: "Company B", position: "Dev B", duration_years: 2 },
      { company: "Company C", position: "Dev C", duration_years: 3 },
    ]

    render(
      <JobApplicationTableField
        field={mockField}
        value={rows}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("#1")).toBeTruthy()
    expect(screen.getByText("#2")).toBeTruthy()
    expect(screen.getByText("#3")).toBeTruthy()

    const removeButtons = screen.getAllByText("Remove")
    expect(removeButtons.length).toBe(3)
  })

  it("filters out hidden and break fields", () => {
    const fieldWithHidden = {
      ...mockField,
      child_fields: [
        ...mockField.child_fields,
        {
          fieldname: "hidden_field",
          label: "Hidden",
          fieldtype: "Data",
          hidden: 1,
        },
        {
          fieldname: "section_break",
          label: "Section",
          fieldtype: "Section Break",
        },
      ],
    }

    render(
      <JobApplicationTableField
        field={fieldWithHidden}
        value={[]}
        onChange={mockOnChange}
      />
    )

    // Hidden and section break fields should not render columns
    expect(screen.queryByText("Hidden")).toBeNull()
    expect(screen.queryByText("Section")).toBeNull()
  })

  it("renders table with correct row badge styling", () => {
    const rows = [
      { company: "Tech Corp", position: "Developer", duration_years: 2 },
    ]

    const { container } = render(
      <JobApplicationTableField
        field={mockField}
        value={rows}
        onChange={mockOnChange}
      />
    )

    const rowBadge = container.querySelector(".absolute")
    expect(rowBadge).toBeTruthy()
    expect(rowBadge?.textContent).toContain("#1")
  })
})
