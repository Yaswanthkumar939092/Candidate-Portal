import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DynamicFieldRenderer, FormField } from "@/components/ui/field-renderer"

vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    getresourceDocumentData: vi.fn(),
  },
}))

import { FrappeAPI } from "@/lib/frappe-api"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrappeAPI = FrappeAPI as any

describe("DynamicFieldRenderer", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Data Field Type", () => {
    it("renders data field with input", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer
          field={field}
          value="John"
          onChange={onChange}
        />
      )

      expect(screen.getByText("Name")).toBeTruthy()
      expect(screen.getByDisplayValue("John")).toBeTruthy()
    })

    it("shows required indicator for mandatory fields", () => {
      const field: FormField = {
        fieldname: "email",
        label: "Email",
        fieldtype: "Data",
        reqd: true,
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      expect(screen.getByText("*")).toBeTruthy()
    })

    it("calls onChange when input changes", async () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={onChange}
        />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      await user.clear(input)
      await user.type(input, "A")
      expect(onChange).toHaveBeenLastCalledWith("A")
      expect(onChange).toHaveBeenCalled()
    })

    it("renders as email input when field is email", () => {
      const field: FormField = {
        fieldname: "email",
        label: "Email Address",
        fieldtype: "Data",
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.type).toBe("email")
    })

    it("disables field when read_only is set", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
        read_only: true,
      }

      render(
        <DynamicFieldRenderer field={field} value="John" onChange={vi.fn()} />
      )

      expect(screen.getByDisplayValue("John")).toBeDisabled()
    })

    it("shows error message when error prop is provided", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }

      render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          error="Name is required"
        />
      )

      expect(screen.getByText("Name is required")).toBeTruthy()
    })

    it("normalizes phone number input to 10 digits", async () => {
      const field: FormField = {
        fieldname: "mobile",
        label: "Mobile",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).toBe(10)

      rerender(
        <DynamicFieldRenderer field={field} value="9876543210" onChange={vi.fn()} />
      )

      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("9876543210")
    })

    it("normalizes pincode input to 6 digits", async () => {
      const field: FormField = {
        fieldname: "pincode",
        label: "Pincode",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).toBe(6)

      rerender(
        <DynamicFieldRenderer field={field} value="123456" onChange={vi.fn()} />
      )

      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("123456")
    })

    it("normalizes aadhaar input to 12 digits", async () => {
      const field: FormField = {
        fieldname: "uid",
        label: "UID",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).toBe(12)

      rerender(
        <DynamicFieldRenderer field={field} value="123456789012" onChange={vi.fn()} />
      )

      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("123456789012")
    })
  })

  describe("Int Field Type", () => {
    it("renders integer input field", () => {
      const field: FormField = {
        fieldname: "age",
        label: "Age",
        fieldtype: "Int",
      }

      render(
        <DynamicFieldRenderer field={field} value="25" onChange={vi.fn()} />
      )

      const input = screen.getByRole("spinbutton") as HTMLInputElement
      expect(input.type).toBe("number")
      expect(input.value).toBe("25")
    })

    it("handles int value changes", async () => {
      const field: FormField = {
        fieldname: "count",
        label: "Count",
        fieldtype: "Int",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value="" onChange={onChange} />
      )

      await user.type(screen.getByRole("spinbutton"), "4")
      expect(onChange).toHaveBeenLastCalledWith("4")
    })
  })

  describe("Float Field Type", () => {
    it("renders float input field", () => {
      const field: FormField = {
        fieldname: "rating",
        label: "Rating",
        fieldtype: "Float",
      }

      render(
        <DynamicFieldRenderer field={field} value="4.5" onChange={vi.fn()} />
      )

      const input = screen.getByRole("spinbutton") as HTMLInputElement
      expect(input.value).toBe("4.5")
    })

    it("accepts decimal values", async () => {
      const field: FormField = {
        fieldname: "price",
        label: "Price",
        fieldtype: "Float",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value="" onChange={onChange} />
      )

      await user.type(screen.getByRole("spinbutton"), "9")
      expect(onChange).toHaveBeenLastCalledWith("9")
    })
  })

  describe("Date Field Type", () => {
    it("renders date input field", () => {
      const field: FormField = {
        fieldname: "dob",
        label: "Date of Birth",
        fieldtype: "Date",
      }

      const { container } = render(
        <DynamicFieldRenderer
          field={field}
          value="2000-01-15"
          onChange={vi.fn()}
        />
      )

      const input = container.querySelector('input[type="date"]') as HTMLInputElement
      expect(input).toBeTruthy()
      expect(input.type).toBe("date")
      expect(input.value).toBe("2000-01-15")
    })

    it("handles date changes", async () => {
      const field: FormField = {
        fieldname: "start_date",
        label: "Start Date",
        fieldtype: "Date",
      }
      const onChange = vi.fn()

      const { container } = render(
        <DynamicFieldRenderer field={field} value="" onChange={onChange} />
      )

      const input = container.querySelector('input[type="date"]') as HTMLInputElement
      if (input) {
        await user.click(input)
        await user.type(input, "2025-06-15")
        expect(onChange).toHaveBeenCalled()
      }
    })
  })

  describe("Check Field Type", () => {
    it("renders checkbox field", () => {
      const field: FormField = {
        fieldname: "agree",
        label: "I agree",
        fieldtype: "Check",
      }

      render(
        <DynamicFieldRenderer field={field} value={false} onChange={vi.fn()} />
      )

      const checkbox = screen.getByRole("checkbox")
      expect(checkbox).toBeTruthy()
    })

    it("toggles checkbox on click", async () => {
      const field: FormField = {
        fieldname: "subscribe",
        label: "Subscribe",
        fieldtype: "Check",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value={false} onChange={onChange} />
      )

      await user.click(screen.getByRole("checkbox"))
      expect(onChange).toHaveBeenCalledWith(true)
    })

    it("shows checked state", () => {
      const field: FormField = {
        fieldname: "terms",
        label: "Agree to terms",
        fieldtype: "Check",
      }

      render(
        <DynamicFieldRenderer field={field} value={true} onChange={vi.fn()} />
      )

      expect(screen.getByRole("checkbox")).toBeChecked()
    })
  })

  describe("Select Field Type", () => {
    it("renders select field with options", () => {
      const field: FormField = {
        fieldname: "status",
        label: "Status",
        fieldtype: "Select",
        options: "Active\nInactive\nPending",
      }

      render(
        <DynamicFieldRenderer
          field={field}
          value="Active"
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText("Status")).toBeTruthy()
      const trigger = screen.getByRole("combobox")
      expect(trigger.textContent).toContain("Active")
    })

    it("parses options separated by newline", async () => {
      const field: FormField = {
        fieldname: "priority",
        label: "Priority",
        fieldtype: "Select",
        options: "High\nMedium\nLow",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value="" onChange={onChange} />
      )

      await user.click(screen.getByRole("combobox"))
      expect(screen.getByText("High")).toBeTruthy()
      expect(screen.getByText("Medium")).toBeTruthy()
      expect(screen.getByText("Low")).toBeTruthy()
    })

    it("handles select value change", async () => {
      const field: FormField = {
        fieldname: "type",
        label: "Type",
        fieldtype: "Select",
        options: "Type A\nType B\nType C",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value="Type A" onChange={onChange} />
      )

      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByText("Type B"))
      expect(onChange).toHaveBeenCalledWith("Type B")
    })
  })

  describe("Link Field Type", () => {
    it("renders link field and fetches options", async () => {
      mockFrappeAPI.getresourceDocumentData.mockResolvedValue({
        data: [{ name: "User1" }, { name: "User2" }],
      })

      const field: FormField = {
        fieldname: "user",
        label: "User",
        fieldtype: "Link",
        options: "User",
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      await waitFor(() => {
        expect(mockFrappeAPI.getresourceDocumentData).toHaveBeenCalledWith(
          "User",
          expect.objectContaining({ fields: ["name"] })
        )
      })
    })

    it("displays loading state while fetching link options", () => {
      mockFrappeAPI.getresourceDocumentData.mockImplementation(
        () => new Promise(() => { })
      )

      const field: FormField = {
        fieldname: "department",
        label: "Department",
        fieldtype: "Link",
        options: "Department",
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const trigger = screen.getByRole("combobox")
      expect(trigger.textContent).toContain("Loading...")
    })

    it("handles link option selection", async () => {
      mockFrappeAPI.getresourceDocumentData.mockResolvedValue({
        data: [{ name: "Sales" }, { name: "HR" }, { name: "IT" }],
      })

      const field: FormField = {
        fieldname: "dept",
        label: "Department",
        fieldtype: "Link",
        options: "Department",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value="" onChange={onChange} />
      )

      await waitFor(() => {
        expect(mockFrappeAPI.getresourceDocumentData).toHaveBeenCalled()
      }, { timeout: 2000 })

      await user.click(screen.getByRole("combobox"))

      await waitFor(() => {
        expect(screen.getByText("HR")).toBeTruthy()
      })

      await user.click(screen.getByText("HR"))
      expect(onChange).toHaveBeenCalledWith("HR")
    })
  })

  describe("Text Field Type", () => {
    it("renders text field similar to Data field", () => {
      const field: FormField = {
        fieldname: "description",
        label: "Description",
        fieldtype: "Text",
      }

      render(
        <DynamicFieldRenderer field={field} value="Some text" onChange={vi.fn()} />
      )

      expect(screen.getByDisplayValue("Some text")).toBeTruthy()
    })
  })

  describe("Small Text Field Type", () => {
    it("renders small text field", () => {
      const field: FormField = {
        fieldname: "note",
        label: "Note",
        fieldtype: "Small Text",
      }

      render(
        <DynamicFieldRenderer field={field} value="A note" onChange={vi.fn()} />
      )

      expect(screen.getByDisplayValue("A note")).toBeTruthy()
    })
  })

  describe("Hidden Fields", () => {
    it("does not render hidden fields", () => {
      const field: FormField = {
        fieldname: "internal_id",
        label: "Internal ID",
        fieldtype: "Data",
        hidden: true,
      }

      const { container } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe("Validation State", () => {
    it("applies validation class when status is Rejected", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
        approval_status: "Rejected",
        hr_comment: "Invalid format",
      }

      const { container } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = container.querySelector("input")
      expect(input?.className).toContain("border-yellow-500")
    })

    it("shows rejection tooltip with hr_comment", async () => {
      const field: FormField = {
        fieldname: "email",
        label: "Email",
        fieldtype: "Data",
        approval_status: "Rejected",
        hr_comment: "Email already registered",
      }

      const { container } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const alertIcon = container.querySelector("div[class*='text-yellow-500']")
      expect(alertIcon).toBeTruthy()

      if (alertIcon) {
        await user.hover(alertIcon)
        await waitFor(
          () => {
            const tooltipText = screen.queryAllByText("Email already registered")
            expect(tooltipText.length).toBeGreaterThan(0)
          },
          { timeout: 2000 }
        )
      }
    })
  })

  describe("Disabled State", () => {
    it("disables field when disabled prop is true", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }

      render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          disabled={true}
        />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    it("disables field when read_only is true", () => {
      const field: FormField = {
        fieldname: "id",
        label: "ID",
        fieldtype: "Data",
        read_only: true,
      }

      render(
        <DynamicFieldRenderer field={field} value="123" onChange={vi.fn()} />
      )

      expect(screen.getByDisplayValue("123")).toBeDisabled()
    })
  })

  describe("Custom ClassName", () => {
    it("applies custom className", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }

      const { container } = render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          className="custom-class"
        />
      )

      expect(container.querySelector(".custom-class")).toBeTruthy()
    })
  })

  describe("onBlur Callback", () => {
    it("calls onBlur when field loses focus", async () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }
      const onBlur = vi.fn()

      render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          onBlur={onBlur}
        />
      )

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.tab()
      expect(onBlur).toHaveBeenCalled()
    })
  })

  describe("Unsupported Field Types", () => {
    it("renders fallback input for unknown field type", () => {
      const field: FormField = {
        fieldname: "custom",
        label: "Custom",
        fieldtype: "CustomType",
      }

      render(
        <DynamicFieldRenderer field={field} value="test" onChange={vi.fn()} />
      )

      expect(screen.getByDisplayValue("test")).toBeTruthy()
    })
  })
  describe("Field Value Types", () => {
    it("handles string values", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }

      render(
        <DynamicFieldRenderer field={field} value="Alice" onChange={vi.fn()} />
      )

      expect(screen.getByDisplayValue("Alice")).toBeTruthy()
    })

    it("handles empty values", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      expect(screen.getByRole("textbox")).toHaveValue("")
    })

    it("handles null/undefined values", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value={null} onChange={vi.fn()} />
      )

      expect(screen.getByRole("textbox")).toHaveValue("")

      rerender(
        <DynamicFieldRenderer field={field} value={undefined} onChange={vi.fn()} />
      )

      expect(screen.getByRole("textbox")).toHaveValue("")
    })
  })

  describe("Mandatory Field Indicators", () => {
    it("shows asterisk for reqd=true", () => {
      const field: FormField = {
        fieldname: "email",
        label: "Email",
        fieldtype: "Data",
        reqd: true,
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      expect(screen.getByText("*")).toBeTruthy()
    })

    it("shows asterisk for is_mandatory=true", () => {
      const field: FormField = {
        fieldname: "name",
        label: "Name",
        fieldtype: "Data",
        is_mandatory: true,
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      expect(screen.getByText("*")).toBeTruthy()
    })

    it("shows asterisk for is_mandatory=1", () => {
      const field: FormField = {
        fieldname: "phone",
        label: "Phone",
        fieldtype: "Data",
        is_mandatory: 1,
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      expect(screen.getByText("*")).toBeTruthy()
    })
  })
})
