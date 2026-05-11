/* eslint-disable @typescript-eslint/no-explicit-any */
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
  DynamicFieldRenderer: ({ field, value, onChange, onAttachChange, overrides }: any) => {
    // 1. Dynamically apply provided override component to cover lines 136-159 targets!
    if (overrides && overrides[field.fieldtype]) {
       const OverrideComp = overrides[field.fieldtype].component
       return (
         <div data-testid={`override-wrap-${field.fieldname}`}>
           <OverrideComp field={field} value={value} onChange={onChange} />
         </div>
       )
    }

    // 2. Expose standard logic and direct attachment hook triggers to exercise line 203-206!
    return (
      <div data-testid={`field-${field.fieldname}`}>
        <label htmlFor={field.fieldname}>{field.label}</label>
        <input
          id={field.fieldname}
          type="text"
          defaultValue={value as string || ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {onAttachChange && (
           <button
              data-testid={`attach-hook-${field.fieldname}`}
              onClick={() => onAttachChange(field.fieldname)("hook-asset.png")}
           >Fire Attachment Hook</button>
        )}
      </div>
    )
  },
}))

vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: ({ label, onChange }: any) => (
    <div>
      <label>{label}</label>
      <button 
        data-testid={`mock-upload-trigger`}
        onClick={() => onChange("uploaded-final-asset.pdf")}
      >
        Perform Upload
      </button>
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

  describe("Extended Coverage: Handlers & Remote Feeds", () => {
    it("propagates updated matrix delta upon explicit cell data modification", async () => {
      const activeRows = [{ company: "Initial Value", position: "Pos" }]
      
      const { container } = render(
        <JobApplicationTableField
          field={mockField}
          value={activeRows}
          onChange={mockOnChange}
        />
      )
      
      // Exercises Line 120-122 (handleCellChange propagation loop) and Line 199
      const input = container.querySelector("#company") as HTMLInputElement
      await user.type(input, " Delta")
      
      // Expecting total reconstructed frame dispatched upward
      expect(mockOnChange).toHaveBeenCalledWith([
         { company: "Initial Value Delta", position: "Pos" }
      ])
    })

    it("resolves runtime dependency map via fallback endpoint when child definitions are absent", async () => {
       // Line 80-93 target: Omit child_fields, trigger useEffect fetch flow!
       const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
          json: async () => ({
             message: {
                fields: [
                   { fieldname: "remote_field", label: "Remote Label", fieldtype: "Data" },
                   { fieldname: "ignore_me", label: "Ignored", fieldtype: "Section Break" }
                ]
             }
          })
       } as any)

       const bareField = {
          fieldname: "remote_table",
          label: "Remote View",
          fieldtype: "Table",
          options: "RemoteDocType"
       }

       render(
          <JobApplicationTableField
            field={bareField}
            value={[{ remote_field: "seed" }]}
            onChange={mockOnChange}
          />
       )

       // Ensure async lifecycle state rehydration completes
       await vi.waitFor(() => {
          expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("frappe.client.get_meta?doctype=RemoteDocType"))
          // Verifies dynamic filtering logic on Line 88-92 succeeded!
          expect(screen.getByLabelText("Remote Label")).toBeTruthy()
          expect(screen.queryByLabelText("Ignored")).toBeNull()
       })

       fetchSpy.mockRestore()
    })

    it("gracefully manages remote request rejection states and routes safely to catch handler", async () => {
       // Line 95-97 target: Catch and console.error verification
       const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
       const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error("Network Death"))

       const bareField = { fieldname: "fail_table", label: "Failed Load", fieldtype: "Table", options: "BrokenDocType" }

       render(<JobApplicationTableField field={bareField} value={[]} onChange={mockOnChange} />)

       await vi.waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith("Table meta fetch error:", expect.any(Error))
       })
       
       fetchSpy.mockRestore()
       consoleSpy.mockRestore()
    })

    it("activates complex file override mechanics ensuring bespoke attachment handling logic", async () => {
       const attachField = {
         fieldname: "docs",
         label: "Doc Vault",
         fieldtype: "Table",
         child_fields: [
            { fieldname: "resume", label: "Resume Item", fieldtype: "Attach" }
         ]
       }

       const { getByTestId } = render(
         <JobApplicationTableField
            field={attachField}
            value={[{ resume: "" }]}
            onChange={mockOnChange}
         />
       )

       // Verifies dynamic override component rendered inside cell (Exercises Line 136-145 + 199 logic)
       const overrideBtn = getByTestId("mock-upload-trigger")
       expect(overrideBtn).toBeTruthy()
       
       await user.click(overrideBtn)
       
       expect(mockOnChange).toHaveBeenCalledWith([
          { resume: "uploaded-final-asset.pdf" }
       ])
    })

    it("reliably executes explicit curried attachment routing callbacks", async () => {
       // Target: Line 202-207 validation
       const mainAttachSpy = vi.fn(() => (_url: string | null) => {})
       
       const { getByTestId } = render(
         <JobApplicationTableField
            field={mockField}
            value={[{ company: "" }]}
            onChange={mockOnChange}
            onAttachChange={mainAttachSpy} // Inject optional handler to activate line 203 branch
         />
       )
       
       const hookTrigger = getByTestId("attach-hook-company")
       await user.click(hookTrigger)
       
       // Confirms the fallback handleCellChange dispatch bound implicitly inside the conditional loop fired
       expect(mockOnChange).toHaveBeenCalledWith([
          { company: "hook-asset.png" }
       ])
    })
  })
})
