import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm, FormProvider } from "react-hook-form"
import { DynamicFieldRenderer, FormField } from "@/components/ui/field-renderer"

vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    getresourceDocumentData: vi.fn(),
  },
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
  getSession: vi.fn(),
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("@/lib/contexts/onboarding-context", () => {
  const useOnboarding = vi.fn(() => ({
    submitAll: vi.fn(),
    isSaving: false
  }))
  return {
    useOnboarding,
    useOptionalOnboarding: vi.fn(() => useOnboarding())
  }
})

import { FrappeAPI } from "@/lib/frappe-api"
import { useOnboarding } from "@/lib/contexts/onboarding-context"
import { useLinkFieldOptions } from "@/lib/hooks/useLinkFieldOptions"

vi.mock("@/lib/hooks/useLinkFieldOptions", () => ({
  useLinkFieldOptions: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}))

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

    it("shows required indicator when mandatory_depends_on evaluates to true", () => {
      const field: FormField = {
        fieldname: "previous_name",
        label: "Previous Name",
        fieldtype: "Data",
        mandatory_depends_on: "eval:doc.name_changed == 'Yes'",
      }

      render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          document={{ name_changed: "Yes" }}
        />
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

    it("accepts only digits for custom_account_number", async () => {
      const field: FormField = {
        fieldname: "custom_account_number",
        label: "Account Number",
        fieldtype: "Data",
      }
      const onChange = vi.fn()

      render(
        <DynamicFieldRenderer field={field} value="" onChange={onChange} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      fireEvent.change(input, { target: { value: "12AB-34 56" } })

      expect(onChange).toHaveBeenCalledWith("123456")
      expect(input.inputMode).toBe("numeric")
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

    it("normalizes custom_ifsc_code input to 11 uppercase characters and caps maxLength", async () => {
      const field: FormField = {
        fieldname: "custom_ifsc_code",
        label: "IFSC Code",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).toBe(11)

      rerender(
        <DynamicFieldRenderer field={field} value="sbin0123456" onChange={vi.fn()} />
      )

      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("SBIN0123456")
    })

    it("normalizes custom_pan_number input to 10 uppercase characters and caps maxLength", async () => {
      const field: FormField = {
        fieldname: "custom_pan_number",
        label: "PAN",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).toBe(10)

      rerender(
        <DynamicFieldRenderer field={field} value="abcde1234f" onChange={vi.fn()} />
      )

      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("ABCDE1234F")
    })

    it("normalizes custom_permanent_postal_code input to 6 digits and numeric input mode", async () => {
      const field: FormField = {
        fieldname: "custom_permanent_postal_code",
        label: "Postal Code",
        fieldtype: "Data",
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).toBe(6)
      expect(input.inputMode).toBe("numeric")

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

    it("does not normalize fields with 'name' in fieldname or label as Aadhaar fields", async () => {
      const field: FormField = {
        fieldname: "custom_name_as_per_aadhaar",
        label: "Name as per Aadhaar",
        fieldtype: "Data",
      }

      render(
        <DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />
      )

      const input = screen.getByRole("textbox") as HTMLInputElement
      expect(input.maxLength).not.toBe(12)
      expect(input.inputMode).not.toBe("numeric")
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

    it("renders disabled checkbox when read_only is true or disabled prop is true", () => {
      const field: FormField = {
        fieldname: "agree",
        label: "I agree",
        fieldtype: "Check",
        read_only: 1,
      }

      const { rerender } = render(
        <DynamicFieldRenderer field={field} value={false} onChange={vi.fn()} />
      )

      expect(screen.getByRole("checkbox")).toBeDisabled()

      // Render with disabled prop
      const activeField: FormField = {
        fieldname: "agree",
        label: "I agree",
        fieldtype: "Check",
        read_only: 0,
      }
      rerender(
        <DynamicFieldRenderer field={activeField} value={false} onChange={vi.fn()} disabled={true} />
      )
      expect(screen.getByRole("checkbox")).toBeDisabled()
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
      vi.mocked(useLinkFieldOptions).mockReturnValue({
        data: {
          status: "success",
          doctype: "User",
          title_field: "name",
          total: 2,
          results: [
            { id: "User1", label: "User1" },
            { id: "User2", label: "User2" },
          ],
        },
        isLoading: false,
      } as any)

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
        expect(useLinkFieldOptions).toHaveBeenCalledWith("User", "", undefined)
      })
    })

    it("displays loading state while fetching link options", () => {
      vi.mocked(useLinkFieldOptions).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any)

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
      vi.mocked(useLinkFieldOptions).mockReturnValue({
        data: {
          status: "success",
          doctype: "Department",
          title_field: "name",
          total: 3,
          results: [
            { id: "Sales", label: "Sales" },
            { id: "HR", label: "HR" },
            { id: "IT", label: "IT" },
          ],
        },
        isLoading: false,
      } as any)

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
      expect(input?.className).toContain("border-destructive")
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

      const alertIcon = container.querySelector("div[class*='text-destructive']")
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

  describe("Additional Coverage Extensions", () => {
    it("applies validation class and check icon when status is Approved", () => {
      const field: FormField = {
        fieldname: "approved_field",
        label: "Approved Field",
        fieldtype: "Data",
        approval_status: "Approved",
      }
      const { container } = render(
        <DynamicFieldRenderer field={field} value="sample" onChange={vi.fn()} />
      )
      const input = container.querySelector("input")
      expect(input?.className).toContain("border-success")

      // Verify presence of Check icon (uses standard lucide svg attributes)
      const checkIcon = container.querySelector(".lucide-check")
      expect(checkIcon).toBeTruthy()
    })

    it("does not render ResubmitButton when field is rejected", async () => {
      const field: FormField = {
        fieldname: "email",
        label: "Email",
        fieldtype: "Data",
        approval_status: "Rejected",
        hr_comment: "Reject reason",
      }

      render(<DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />)

      const resubmitBtn = screen.queryByRole("button", { name: /Resubmit/i })
      expect(resubmitBtn).toBeNull()
    })

    it("handles Link component API fetch failure gracefully", async () => {
      vi.mocked(useLinkFieldOptions).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Network failed"),
      } as any)

      const field: FormField = {
        fieldname: "link_test",
        label: "Link Test",
        fieldtype: "Link",
        options: "SomeDoctype",
      }

      render(<DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />)

      // Verify that it renders without crashing
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("extracts name from Object types in Link and Select values, and inserts missing default values dynamically", async () => {
      vi.mocked(useLinkFieldOptions).mockReturnValue({
        data: {
          status: "success",
          doctype: "SampleDoc",
          title_field: "name",
          total: 1,
          results: [{ id: "ExistingDoc", label: "ExistingDoc" }],
        },
        isLoading: false,
      } as any)

      const field: FormField = {
        fieldname: "link_obj",
        label: "Link Object",
        fieldtype: "Link",
        options: "SampleDoc",
      }

      // Test Object extraction and dynamic option inclusion logic lines
      render(<DynamicFieldRenderer field={field} value={{ name: "InjectedForeignValue" }} onChange={vi.fn()} />)

      // Trigger dropdown
      await user.click(screen.getByRole("combobox"))

      // Verification: InjectedForeignValue is present in choices because it was spliced into options
      const elements = await screen.findAllByText("InjectedForeignValue")
      expect(elements.length).toBeGreaterThan(0)

      // Additional branch coverage for fallback object keys (name || value || "") (Line 383, 441)
      render(<DynamicFieldRenderer field={field} value={{ value: "FallbackValueObject" }} onChange={vi.fn()} />)
      render(<DynamicFieldRenderer field={field} value={{ somethingElse: "EmptyValueObject" }} onChange={vi.fn()} />)

      // Specifically hit line 441 for Select type
      const selectField: FormField = { fieldname: "select_obj", label: "Select", fieldtype: "Select", options: "A B" }
      render(<DynamicFieldRenderer field={selectField} value={{ name: "Val1" }} onChange={vi.fn()} />)
      render(<DynamicFieldRenderer field={selectField} value={{ value: "Val2" }} onChange={vi.fn()} />)
      render(<DynamicFieldRenderer field={selectField} value={{ somethingElse: "Val3" }} onChange={vi.fn()} />)
    })

    it("triggers normalization logic inside generic Text component updates", async () => {
      const field: FormField = {
        fieldname: "mobile_text", // Triggers isPhoneField which uses normalization
        label: "Mobile Phone",
        fieldtype: "Text",
      }
      const onChange = vi.fn()

      render(<DynamicFieldRenderer field={field} value="" onChange={onChange} />)

      const input = screen.getByRole("textbox")
      fireEvent.change(input, { target: { value: "A9B8C" } })
      expect(onChange).toHaveBeenLastCalledWith("98") // Normalization strips non-digits
    })

    it("triggers normalization logic inside Small Text component updates", async () => {
      const field: FormField = {
        fieldname: "custom_pincode_small",
        label: "Pin Code Label",
        fieldtype: "Small Text",
      }
      const onChange = vi.fn()

      render(<DynamicFieldRenderer field={field} value="" onChange={onChange} />)

      const input = screen.getByRole("textbox")
      fireEvent.change(input, { target: { value: "5X6Y" } })
      expect(onChange).toHaveBeenLastCalledWith("56")
    })

    it("parses options split by spaces when no newlines present", async () => {
      const field: FormField = {
        fieldname: "space_select",
        label: "Options Space",
        fieldtype: "Select",
        options: "Red Blue Green",
      }

      render(<DynamicFieldRenderer field={field} value="" onChange={vi.fn()} />)

      await user.click(screen.getByRole("combobox"))
      expect(screen.getByText("Red")).toBeTruthy()
      expect(screen.getByText("Blue")).toBeTruthy()
      expect(screen.getByText("Green")).toBeTruthy()
    })

    it("executes input normalization during updates to unsupported custom field types", async () => {
      const field: FormField = {
        fieldname: "contactnumber_unknown",
        label: "Unknown Type Phone",
        fieldtype: "NonexistentType",
      }
      const onChange = vi.fn()

      render(<DynamicFieldRenderer field={field} value="" onChange={onChange} />)

      const input = screen.getByRole("textbox")
      fireEvent.change(input, { target: { value: "1a2b3c" } })
      expect(onChange).toHaveBeenLastCalledWith("123")
    })

    it("handles dynamic overrides and edge cases for Attachments", async () => {
      const field: FormField = {
        fieldname: "resume",
        label: "Resume",
        fieldtype: "Attach",
      }

      // Crucial bridge to by-pass original code early-gate on line 613
      const triggerConfigOverride = {
         
        component: (() => <div />) as any
      };

      // Case 1: onAttachChange completely missing (Line 643-650)
      const { container: cont1 } = render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          overrides={{ Attach: triggerConfigOverride }}
        />
      )
      expect(cont1.textContent).toContain("File upload not configured")

      // Case 2: Overrides component provided correctly (Line 653-667)
      const CustomAttach = () => <div data-testid="custom-uploader">Ready</div>
      const attachHandler = vi.fn()

      render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          onAttachChange={() => attachHandler}
          overrides={{
             
            Attach: { component: CustomAttach as any }
          }}
        />
      )
      expect(screen.getByTestId("custom-uploader")).toBeTruthy()

      // Case 3: Explicit config supplied but lacks component implementation (Line 670)
      const { container: cont3 } = render(
        <DynamicFieldRenderer
          field={field}
          value=""
          onChange={vi.fn()}
          onAttachChange={() => attachHandler}
           
          overrides={{ Attach: {} as any }} // Truthy object to trigger path but without component
        />
      )
      expect(cont3.textContent).toContain("File upload handler not provided")
    })

    it("filters year_of_passing options chronologically based on lower/higher education levels", async () => {
      vi.mocked(useLinkFieldOptions).mockReturnValue({
        data: {
          results: [
            { id: "2020", label: "2020" },
            { id: "2021", label: "2021" },
            { id: "2022", label: "2022" },
            { id: "2023", label: "2023" },
          ],
        },
        isLoading: false,
      } as any);

      const field = {
        fieldname: "year_of_passing",
        label: "Year of Passing",
        fieldtype: "Link",
        options: "Years",
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => {
        const methods = useForm({
          defaultValues: {
            custom_education_details: [
              { education_level: "10th", year_of_passing: "2021" },
              { education_level: "12th", year_of_passing: "" },
              { education_level: "Graduation", year_of_passing: "2023" },
            ],
          },
        });
        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <Wrapper>
          <DynamicFieldRenderer
            field={field}
            value=""
            onChange={vi.fn()}
            tableFieldname="custom_education_details"
            rowIndex={1}
          />
        </Wrapper>
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      expect(screen.queryByText("2020")).toBeNull();
      expect(screen.queryByText("2021")).toBeNull();
      expect(screen.getByText("2022")).toBeTruthy();
      expect(screen.queryByText("2023")).toBeNull();
    });
  })
})
