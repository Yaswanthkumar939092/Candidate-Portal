import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

const h = vi.hoisted(() => ({
  goToStep: vi.fn(),
  triggerSubmit: vi.fn(),
  submitAll: vi.fn(),
  ctx: { value: {} as Record<string, unknown> },
}))

vi.mock("@/lib/contexts/onboarding-context", () => ({ useOnboarding: () => h.ctx.value }))
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

import { OnboardingStepNav } from "@/components/onboarding/onboarding-step-nav"
import { OnboardingRightRail } from "@/components/onboarding/onboarding-right-rail"

const mandatory = { fieldtype: "Data", hidden: 0, is_mandatory: 1, read_only: 0 }

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
    setStepData: vi.fn(),
    goToStep: h.goToStep,
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    markStepComplete: vi.fn(),
    submitAll: h.submitAll,
    getFieldValue: vi.fn(),
    triggerSubmit: h.triggerSubmit,
    formConfig: {
      applicantId: "CAND-TEST-0001",
      status: "Pending",
      tabs: [
        {
          tab: "Personal Information",
          sections: [
            { section: "Basic Details", fields: [{ fieldname: "first_name", label: "First Name", ...mandatory }] },
          ],
        },
        { tab: "Education Details", sections: [] },
      ],
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  h.ctx.value = context()
})

describe("OnboardingStepNav step state", () => {
  // Spec: CAND-06-A3.2A (docs/spec/clauses/06-onboarding-components.md#cand-06-a3-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("jumps to a later step even though the current step's mandatory field is empty", () => {
    render(<OnboardingStepNav />)
    fireEvent.click(screen.getByText("Education Details"))
    expect(h.goToStep).toHaveBeenCalledWith(1)
    expect(screen.getByText("Education Details").closest("button")).not.toBeDisabled()
  })

  // Spec: CAND-06-A3.2B (docs/spec/clauses/06-onboarding-components.md#cand-06-a3-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("marks every step including Review as complete as soon as the status leaves draft", () => {
    h.ctx.value = context({ status: "submitted" })
    const { container } = render(<OnboardingStepNav />)
    const done = container.querySelectorAll("span.bg-success")
    expect(done.length).toBe(3)
    expect(container.querySelectorAll("span.bg-primary\\/10").length).toBe(0)
  })

  // Spec: CAND-06-A3.1A (docs/spec/clauses/06-onboarding-components.md#cand-06-a3-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("counts live step data rather than the server counts when any tab has a visible field", () => {
    h.ctx.value = context({
      stepData: { personal_information: { first_name: "Cand" } },
      formConfig: {
        applicantId: "CAND-TEST-0001",
        status: "Pending",
        field_status_counts: { total: 100, pending: 100, filled: 0, approved: 0, rejected: 0 },
        tabs: [
          {
            tab: "Personal Information",
            field_counts: { total: 100, pending: 100, filled: 0, approved: 0, rejected: 0 },
            sections: [
              {
                section: "Basic Details",
                fields: [
                  { fieldname: "first_name", label: "First Name", ...mandatory },
                  { fieldname: "last_name", label: "Last Name", ...mandatory },
                ],
              },
            ],
          },
        ],
      },
    })
    const { container } = render(<OnboardingStepNav />)
    expect(screen.getByText("1/2")).toBeTruthy()
    expect(screen.getByText("1/2 fields")).toBeTruthy()
    expect(container.querySelector(".bg-primary-foreground.transition-all")).toHaveStyle("width: 50%")
  })

  // Spec: CAND-06-A3.1B (docs/spec/clauses/06-onboarding-components.md#cand-06-a3-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("drops a field whose depends_on is false out of the step counts entirely", () => {
    h.ctx.value = context({
      stepData: { personal_information: { first_name: "Cand" } },
      formConfig: {
        applicantId: "CAND-TEST-0001",
        status: "Pending",
        tabs: [
          {
            tab: "Personal Information",
            sections: [
              {
                section: "Basic Details",
                fields: [
                  { fieldname: "first_name", label: "First Name", ...mandatory },
                  {
                    fieldname: "spouse_name",
                    label: "Spouse Name",
                    ...mandatory,
                    depends_on: "eval:doc.marital_status == 'Married'",
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    render(<OnboardingStepNav />)
    expect(screen.getByText("1/1")).toBeTruthy()
  })
})

describe("OnboardingRightRail checklist", () => {
  // Spec: CAND-06-A4.2A (docs/spec/clauses/06-onboarding-components.md#cand-06-a4-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("lists only the first five missing required fields and counts the rest", () => {
    const fields = ["a", "b", "c", "d", "e", "f", "g"].map((k) => ({
      fieldname: `field_${k}`,
      label: `Field ${k.toUpperCase()}`,
      ...mandatory,
    }))
    h.ctx.value = context({
      formConfig: {
        applicantId: "CAND-TEST-0001",
        status: "Pending",
        tabs: [{ tab: "Personal Information", sections: [{ section: "Basic Details", fields }] }],
      },
    })
    render(<OnboardingRightRail focusedFieldname={null} />)
    expect(screen.getByText("Field A")).toBeTruthy()
    expect(screen.getByText("Field E")).toBeTruthy()
    expect(screen.queryByText("Field F")).toBeNull()
    expect(screen.getByText("+ 2 more fields")).toBeTruthy()
    expect(screen.getByText("Fill 7 more to continue")).toBeTruthy()
  })

  // Spec: CAND-06-A4.2B (docs/spec/clauses/06-onboarding-components.md#cand-06-a4-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("disables Save & Continue while a required field is missing and enables it when none is left", () => {
    const { rerender } = render(<OnboardingRightRail focusedFieldname={null} />)
    expect(screen.getByText("Fill 1 more to continue").closest("button")).toBeDisabled()

    h.ctx.value = context({ stepData: { personal_information: { first_name: "Cand" } } })
    rerender(<OnboardingRightRail focusedFieldname={null} />)
    const ready = screen.getByText("Save & Continue").closest("button") as HTMLButtonElement
    expect(ready).not.toBeDisabled()
    fireEvent.click(ready)
    expect(h.triggerSubmit).toHaveBeenCalledWith("save_continue")
  })

  // Spec: CAND-06-A4.3A (docs/spec/clauses/06-onboarding-components.md#cand-06-a4-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the built-in tip text for a focused field name that has one and nothing for one that does not", () => {
    const { rerender } = render(<OnboardingRightRail focusedFieldname="first_name" />)
    expect(screen.getByText("Use your legal name")).toBeTruthy()

    rerender(<OnboardingRightRail focusedFieldname="field_with_no_tip" />)
    expect(screen.queryByText("Use your legal name")).toBeNull()
  })

  // Spec: CAND-06-A4.1A (docs/spec/clauses/06-onboarding-components.md#cand-06-a4-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("falls back to the literal heading COMPANY NAME when branding carries no company", () => {
    h.ctx.value = context({ formConfig: { applicantId: "CAND-TEST-0001", status: "Pending", tabs: [] } })
    render(<OnboardingRightRail focusedFieldname={null} />)
    expect(screen.getByText("COMPANY NAME")).toBeTruthy()
  })
})
