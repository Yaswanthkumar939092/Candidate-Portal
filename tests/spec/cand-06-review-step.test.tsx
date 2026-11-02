import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

const h = vi.hoisted(() => ({
  submitAll: vi.fn(),
  prevStep: vi.fn(),
  goToStep: vi.fn(),
  push: vi.fn(),
  toastError: vi.fn(),
  ctx: { value: {} as Record<string, unknown> },
}))

vi.mock("@/lib/contexts/onboarding-context", () => ({ useOnboarding: () => h.ctx.value }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push, replace: vi.fn(), prefetch: vi.fn() }) }))
vi.mock("sonner", () => ({ toast: { error: h.toastError, success: vi.fn() } }))

import { ReviewStep } from "@/components/onboarding/steps/review-step"

const rejectedField = {
  fieldname: "custom_pan_number",
  label: "PAN Number",
  fieldtype: "Data",
  hidden: 0,
  is_mandatory: 0,
  read_only: 0,
  approval_status: "Rejected",
  value: "CANDTEST01",
}

function context(overrides: Record<string, unknown> = {}) {
  return {
    currentStep: 1,
    stepData: { personal_info: { first_name: "Cand", last_name: "Test", custom_age: 24 } },
    completedSteps: new Set(["personal_info"]),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
    setStepData: vi.fn(),
    goToStep: h.goToStep,
    nextStep: vi.fn(),
    prevStep: h.prevStep,
    markStepComplete: vi.fn(),
    submitAll: h.submitAll,
    getFieldValue: vi.fn(),
    formConfig: {
      applicantId: "CAND-TEST-0001",
      status: "Pending",
      tabs: [
        {
          tab: "Personal Info",
          sections: [
            {
              section: "Basic Details",
              fields: [
                { fieldname: "first_name", label: "First Name", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 },
                { fieldname: "last_name", label: "Last Name", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 },
                { fieldname: "custom_age", label: "Age", fieldtype: "Int", hidden: 0, is_mandatory: 0, read_only: 0 },
              ],
            },
          ],
        },
      ],
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  h.submitAll.mockResolvedValue(undefined)
  h.ctx.value = context()
})

describe("ReviewStep declaration", () => {
  // Spec: CAND-06-A8.1A (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("blocks the submit and shows the schema message while the declaration box is unticked", async () => {
    render(<ReviewStep />)
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }))
    expect(await screen.findByText("You must accept the declaration to submit")).toBeTruthy()
    expect(h.submitAll).not.toHaveBeenCalled()
  })

  // Spec: CAND-06-A8.1B (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("submits with the single argument submit once the declaration box is ticked", async () => {
    render(<ReviewStep />)
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }))
    await waitFor(() => expect(h.submitAll).toHaveBeenCalledWith("submit"))
    expect(h.submitAll).toHaveBeenCalledTimes(1)
  })
})

describe("ReviewStep rejected fields", () => {
  // Spec: CAND-06-A8.2A (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("disables the Submit button while a rejected field still carries its original value", () => {
    h.ctx.value = context({
      stepData: { personal_info: { custom_pan_number: "CANDTEST01" } },
      formConfig: {
        applicantId: "CAND-TEST-0001",
        status: "Pending",
        tabs: [{ tab: "Personal Info", sections: [{ section: "Basic Details", fields: [rejectedField] }] }],
      },
    })
    render(<ReviewStep />)
    expect(screen.getByRole("button", { name: /Submit/i })).toBeDisabled()
  })

  // Spec: CAND-06-A8.2B (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("names the uncorrected rejected field in an inline error and a toast when the form is submitted around the disabled button", async () => {
    h.ctx.value = context({
      stepData: { personal_info: { custom_pan_number: "CANDTEST01" } },
      formConfig: {
        applicantId: "CAND-TEST-0001",
        status: "Pending",
        tabs: [{ tab: "Personal Info", sections: [{ section: "Basic Details", fields: [rejectedField] }] }],
      },
    })
    const { container } = render(<ReviewStep />)
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.submit(container.querySelector("form") as HTMLFormElement)
    expect(
      await screen.findByText("Please correct all rejected fields before submitting: PAN Number"),
    ).toBeTruthy()
    expect(h.toastError).toHaveBeenCalledWith("Please correct all rejected fields before submitting.")
    expect(h.submitAll).not.toHaveBeenCalled()
  })

  // Spec: CAND-06-A8.2C (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("treats a rejected field as corrected once its value differs from the original and submits", async () => {
    h.ctx.value = context({
      stepData: { personal_info: { custom_pan_number: "CANDTEST02" } },
      formConfig: {
        applicantId: "CAND-TEST-0001",
        status: "Pending",
        tabs: [{ tab: "Personal Info", sections: [{ section: "Basic Details", fields: [rejectedField] }] }],
      },
    })
    render(<ReviewStep />)
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }))
    await waitFor(() => expect(h.submitAll).toHaveBeenCalledWith("submit"))
    expect(h.toastError).not.toHaveBeenCalled()
  })
})

describe("ReviewStep summaries and success state", () => {
  // Spec: CAND-06-A8.3A (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("summarises a tab without a table as the first two string values only, dropping the numeric one", () => {
    render(<ReviewStep />)
    expect(screen.getByText("Cand Test")).toBeTruthy()
  })

  // Spec: CAND-06-A8.3B (docs/spec/clauses/06-onboarding-components.md#cand-06-a8-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the already-submitted wording when the form config status is Completed", () => {
    h.ctx.value = context({
      status: "submitted",
      formConfig: { applicantId: "CAND-TEST-0001", status: "Completed", tabs: [] },
    })
    render(<ReviewStep />)
    expect(screen.getByText("Onboarding already submitted")).toBeTruthy()
    expect(
      screen.getByText("Your onboarding details have already been submitted and completed."),
    ).toBeTruthy()
  })
})
