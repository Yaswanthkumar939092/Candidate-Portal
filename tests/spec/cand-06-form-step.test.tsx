import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const h = vi.hoisted(() => ({
  setStepData: vi.fn(),
  submitAll: vi.fn(),
  markStepComplete: vi.fn(),
  nextStep: vi.fn(),
  ctx: { value: {} as Record<string, unknown> },
}))

vi.mock("@/lib/contexts/onboarding-context", () => ({ useOnboarding: () => h.ctx.value }))
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({ user: { id: "CAND-TEST-0001", email: "cand@example.invalid" }, profile: null }),
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/components/onboarding/dynamic-table-field", () => ({
  DynamicTableField: ({ field }: { field: { fieldname: string; label: string; is_mandatory?: number } }) => (
    <div data-testid={`table-${field.fieldname}`} data-mandatory={String(field.is_mandatory ?? 0)}>
      {field.label}
    </div>
  ),
}))
vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({
    field,
    value,
    onChange,
  }: {
    field: { fieldname: string; label: string }
    value: unknown
    onChange: (v: unknown) => void
  }) => (
    <div id={`field-${field.fieldname}`}>
      <label htmlFor={`in-${field.fieldname}`}>{field.label}</label>
      <input
        id={`in-${field.fieldname}`}
        data-testid={`input-${field.fieldname}`}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}))

import { OnboardingFormStep } from "@/components/onboarding/onboarding-form-step"

function context(overrides: Record<string, unknown> = {}) {
  return {
    currentStep: 0,
    stepData: {},
    completedSteps: new Set<string>(),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
    setStepData: h.setStepData,
    goToStep: vi.fn(),
    nextStep: h.nextStep,
    prevStep: vi.fn(),
    markStepComplete: h.markStepComplete,
    submitAll: h.submitAll,
    getFieldValue: vi.fn(),
    formConfig: { applicantId: "CAND-TEST-0001", status: "Pending", tabs: [] },
    ...overrides,
  }
}

const employmentTab = {
  tab: "Employment",
  sections: [
    {
      section: "Work",
      fields: [
        { fieldname: "is_fresher", label: "I am a fresher", fieldtype: "Check", hidden: 0, is_mandatory: 0, read_only: 0 },
        {
          fieldname: "custom_jf_employment",
          label: "Employment History",
          fieldtype: "Table",
          hidden: 0,
          is_mandatory: 0,
          read_only: 0,
          child_fields: [
            { fieldname: "employer", label: "Employer", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 },
          ],
        },
      ],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  h.submitAll.mockResolvedValue(undefined)
  h.ctx.value = context()
})

describe("OnboardingFormStep fresher rule", () => {
  // Spec: CAND-06-A2.4A (docs/spec/clauses/06-onboarding-components.md#cand-06-a2-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("forces the employment table mandatory while the fresher box is clear and hides it once it is set", () => {
    render(<OnboardingFormStep tab={employmentTab} stepKey="employment" />)
    expect(screen.getByTestId("table-custom_jf_employment").getAttribute("data-mandatory")).toBe("1")

    fireEvent.change(screen.getByTestId("input-is_fresher"), { target: { value: "1" } })
    expect(screen.queryByTestId("table-custom_jf_employment")).toBeNull()
  })

  // Spec: CAND-06-A2.4B (docs/spec/clauses/06-onboarding-components.md#cand-06-a2-4b)
  // Characterization: pins current behaviour, not endorsed.
  it("empties the saved employment rows when the step loads with the fresher box already set", async () => {
    h.ctx.value = context({
      stepData: { employment: { is_fresher: 1, custom_jf_employment: [{ employer: "Prior Employer" }] } },
    })
    render(<OnboardingFormStep tab={employmentTab} stepKey="employment" />)
    await waitFor(() =>
      expect(h.setStepData).toHaveBeenCalledWith(
        "employment",
        expect.objectContaining({ custom_jf_employment: [] }),
      ),
    )
  })
})

describe("OnboardingFormStep declaration date", () => {
  const declarationTab = {
    tab: "Declaration",
    sections: [
      {
        section: "Declaration",
        fields: [
          {
            fieldname: "custom_jf_declaration_date",
            label: "Declaration Date",
            fieldtype: "Date",
            hidden: 0,
            is_mandatory: 1,
            read_only: 0,
          },
        ],
      },
    ],
  }

  // Spec: CAND-06-A2.5A (docs/spec/clauses/06-onboarding-components.md#cand-06-a2-5a)
  // Characterization: pins current behaviour, not endorsed.
  it("renders today's date as a disabled dd-mm-yyyy box and saves it in ISO form, ignoring any stored value", async () => {
    h.ctx.value = context({ stepData: { declaration: { custom_jf_declaration_date: "1999-01-01" } } })
    const { container } = render(<OnboardingFormStep tab={declarationTab} stepKey="declaration" />)

    const now = new Date()
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const [y, m, d] = iso.split("-")

    const box = container.querySelector("input") as HTMLInputElement
    expect(box.disabled).toBe(true)
    expect(box.value).toBe(`${d}-${m}-${y}`)
    await waitFor(() =>
      expect(h.setStepData).toHaveBeenCalledWith(
        "declaration",
        expect.objectContaining({ custom_jf_declaration_date: iso }),
      ),
    )
  })
})

describe("OnboardingFormStep section counts", () => {
  // Spec: CAND-06-A2.6A (docs/spec/clauses/06-onboarding-components.md#cand-06-a2-6a)
  // Characterization: pins current behaviour, not endorsed.
  it("counts an approved field as filled in the section badge even when its value is blank", () => {
    const tab = {
      tab: "Identity",
      sections: [
        {
          section: "Government IDs",
          fields: [
            {
              fieldname: "custom_pan_number",
              label: "PAN Number",
              fieldtype: "Data",
              hidden: 0,
              is_mandatory: 0,
              read_only: 0,
              approval_status: "Approved",
            },
            { fieldname: "custom_aadhaar_number", label: "Aadhaar Number", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 },
          ],
        },
      ],
    }
    h.ctx.value = context({ stepData: { identity: { custom_pan_number: "" } } })
    render(<OnboardingFormStep tab={tab} stepKey="identity" />)
    expect(screen.getByText("1/2")).toBeTruthy()
  })
})

describe("OnboardingFormStep save", () => {
  // Spec: CAND-06-A2.3A (docs/spec/clauses/06-onboarding-components.md#cand-06-a2-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("stops at submitAll and never marks the step complete when the save rejects", async () => {
    h.submitAll.mockRejectedValueOnce(new Error("backend stub refused"))
    const tab = {
      tab: "Personal Info",
      sections: [
        {
          section: "Basic Details",
          fields: [{ fieldname: "first_name", label: "First Name", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 }],
        },
      ],
    }
    render(<OnboardingFormStep tab={tab} stepKey="personal_info" />)
    fireEvent.change(screen.getByTestId("input-first_name"), { target: { value: "Cand" } })
    fireEvent.click(screen.getByText("Save & Next"))
    await waitFor(() => expect(h.submitAll).toHaveBeenCalledWith("save", "personal_info", expect.any(Object)))
    expect(h.markStepComplete).not.toHaveBeenCalled()
    expect(h.nextStep).not.toHaveBeenCalled()
  })
})
