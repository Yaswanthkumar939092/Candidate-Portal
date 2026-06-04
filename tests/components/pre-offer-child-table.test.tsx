import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PreOfferTableField } from "@/components/pre-offer-form/ChildTable"
import { FrappeAPI } from "@/lib/frappe-api"

vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}))

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Plus: () => <div data-testid="icon-plus" />,
    Trash2: () => <div data-testid="icon-trash" />,
  }
})

vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({ field, value, onChange, overrides, onAttachChange }: any) => {
    if (overrides && overrides[field.fieldtype]) {
      const C = overrides[field.fieldtype].component
      return (
        <div data-testid={`override-${field.fieldname}`}>
          <C field={field} value={value} onChange={onChange} />
        </div>
      )
    }

    return (
      <div data-testid={`field-${field.fieldname}`}>
        <label>{field.label}</label>
        <input
          data-testid={`input-${field.fieldname}`}
          defaultValue={value as string || ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {onAttachChange && (
          <>
            <button
              data-testid={`attach-change-${field.fieldname}`}
              type="button"
              onClick={() => onAttachChange(field.fieldname)("new_attached_url.pdf")}
            >
              Attach Change
            </button>
            <button
              data-testid={`attach-change-null-${field.fieldname}`}
              type="button"
              onClick={() => onAttachChange(field.fieldname)(null)}
            >
              Attach Change Null
            </button>
          </>
        )}
      </div>
    )
  },
}))

vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: ({ label, onChange }: any) => (
    <div data-testid="file-upload">
      <label>{label}</label>
      <button type="button" onClick={() => onChange("uploaded_document.pdf")}>Upload File</button>
      <button type="button" data-testid="upload-null" onClick={() => onChange(null)}>Upload Null</button>
    </div>
  ),
}))

describe("PreOfferTableField component", () => {
  const mockField = {
    fieldname: "education",
    label: "Education Details",
    fieldtype: "Table",
    reqd: 1,
    child_fields: [
      {
        fieldname: "school",
        label: "School Name",
        fieldtype: "Data",
        reqd: 1,
        hidden: 0,
      },
      {
        fieldname: "transcript",
        label: "Transcript File",
        fieldtype: "Attach",
        reqd: 0,
        hidden: 0,
      },
    ],
  }

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders table field title and Add button", () => {
    render(
      <PreOfferTableField
        field={mockField}
        value={[]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Education Details")).toBeTruthy()
    expect(screen.getByText("Add Education Details")).toBeTruthy()
  })

  it("triggers onChange with default values when Add button is clicked", () => {
    render(
      <PreOfferTableField
        field={mockField}
        value={[]}
        onChange={mockOnChange}
      />
    )

    const addButton = screen.getByRole("button", { name: "Add Education Details" })
    fireEvent.click(addButton)

    expect(mockOnChange).toHaveBeenCalledWith([{ school: "", transcript: "" }])
  })

  it("renders columns provided through table_fields", () => {
    const fieldWithTableFields = {
      fieldname: "education",
      label: "Education Details",
      fieldtype: "Table",
      table_fields: [
        {
          fieldname: "school_univ",
          label: "Institute",
          fieldtype: "Small Text",
          reqd: 0,
          hidden: 0,
        },
      ],
    }

    render(
      <PreOfferTableField
        field={fieldWithTableFields}
        value={[{ school_univ: "Delhi University" }]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Institute")).toBeTruthy()
    expect((screen.getByTestId("input-school_univ") as HTMLInputElement).value).toBe("Delhi University")
    expect(FrappeAPI.get).not.toHaveBeenCalled()
  })

  it("renders rows and triggers onChange with cell edits", () => {
    const mockValue = [{ school: "Harvard", transcript: "" }]

    render(
      <PreOfferTableField
        field={mockField}
        value={mockValue}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("#1")).toBeTruthy()
    const input = screen.getByTestId("input-school") as HTMLInputElement
    expect(input.value).toBe("Harvard")

    fireEvent.change(input, { target: { value: "Yale" } })
    expect(mockOnChange).toHaveBeenCalledWith([{ school: "Yale", transcript: "" }])
  })

  it("triggers cell file uploads correctly using attachment overrides", () => {
    const mockValue = [{ school: "Harvard", transcript: "" }]

    render(
      <PreOfferTableField
        field={mockField}
        value={mockValue}
        onChange={mockOnChange}
      />
    )

    const uploadBtn = screen.getByRole("button", { name: "Upload File" })
    fireEvent.click(uploadBtn)

    expect(mockOnChange).toHaveBeenCalledWith([{ school: "Harvard", transcript: "uploaded_document.pdf" }])
  })

  it("triggers row deletion successfully", () => {
    const mockValue = [
      { school: "Harvard", transcript: "" },
      { school: "Yale", transcript: "" },
    ]

    render(
      <PreOfferTableField
        field={mockField}
        value={mockValue}
        onChange={mockOnChange}
      />
    )

    const removeButtons = screen.getAllByRole("button", { name: /Remove/i })
    fireEvent.click(removeButtons[0]) // Delete row #1

    expect(mockOnChange).toHaveBeenCalledWith([{ school: "Yale", transcript: "" }])
  })

  it("fetches columns from meta API if child_fields is not provided", async () => {
    const fieldWithoutFields = {
      fieldname: "education",
      label: "Education Details",
      fieldtype: "Table",
      options: "EducationMeta",
    }

    const mockMetaFields = [
      { reference_name: "degree", display_name: "Degree Title", fieldtype: "Data", hidden: 0 },
    ]
    ;(FrappeAPI.get as any).mockResolvedValue({ fields: mockMetaFields })

    render(
      <PreOfferTableField
        field={fieldWithoutFields}
        value={[]}
        onChange={mockOnChange}
      />
    )

    await waitFor(() => {
      expect(FrappeAPI.get).toHaveBeenCalledWith("frappe.client.get_meta", { doctype: "EducationMeta" })
    })
  })

  it("logs error to console when meta API fetch fails", async () => {
    const fieldWithoutFields = {
      fieldname: "education",
      label: "Education Details",
      fieldtype: "Table",
      options: "EducationMeta",
    }
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    ;(FrappeAPI.get as any).mockRejectedValue(new Error("API Error"))

    render(
      <PreOfferTableField
        field={fieldWithoutFields}
        value={[]}
        onChange={mockOnChange}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Pre-Offer table meta fetch error:", expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  it("triggers cell file uploads correctly using Attach Image overrides including null case", () => {
    const mockAttachImageField = {
      fieldname: "portfolio",
      label: "Portfolio",
      fieldtype: "Table",
      child_fields: [
        {
          fieldname: "photo",
          label: "Photo",
          fieldtype: "Attach Image",
          reqd: 1,
          hidden: 0,
        },
      ],
    }
    const mockValue = [{ photo: "" }]

    render(
      <PreOfferTableField
        field={mockAttachImageField}
        value={mockValue}
        onChange={mockOnChange}
      />
    )

    // upload document
    const uploadBtn = screen.getByRole("button", { name: "Upload File" })
    fireEvent.click(uploadBtn)
    expect(mockOnChange).toHaveBeenLastCalledWith([{ photo: "uploaded_document.pdf" }])

    // upload null to trigger fallback
    const uploadNullBtn = screen.getByTestId("upload-null")
    fireEvent.click(uploadNullBtn)
    expect(mockOnChange).toHaveBeenLastCalledWith([{ photo: "" }])
  })

  it("triggers cell change callback when onAttachChange is triggered including null case", () => {
    const mockOnAttachChange = vi.fn()
    const mockValue = [{ school: "Harvard", transcript: "" }]

    render(
      <PreOfferTableField
        field={mockField}
        value={mockValue}
        onChange={mockOnChange}
        onAttachChange={mockOnAttachChange}
      />
    )

    const attachBtn = screen.getByTestId("attach-change-school")
    fireEvent.click(attachBtn)
    expect(mockOnChange).toHaveBeenLastCalledWith([{ school: "new_attached_url.pdf", transcript: "" }])

    const attachNullBtn = screen.getByTestId("attach-change-null-school")
    fireEvent.click(attachNullBtn)
    expect(mockOnChange).toHaveBeenLastCalledWith([{ school: "", transcript: "" }])
  })

  it("handles hidden columns and filters them during render", () => {
    const mockHiddenField = {
      fieldname: "education",
      label: "Education Details",
      fieldtype: "Table",
      child_fields: [
        {
          fieldname: "school",
          label: "School Name",
          fieldtype: "Data",
          hidden: 0,
        },
        {
          fieldname: "hidden_field",
          label: "Hidden Field",
          fieldtype: "Data",
          hidden: 1,
        },
      ],
    }

    render(
      <PreOfferTableField
        field={mockHiddenField}
        value={[{ school: "Stanford", hidden_field: "Secret" }]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("School Name")).toBeTruthy()
    expect(screen.queryByText("Hidden Field")).toBeNull()
  })
})
