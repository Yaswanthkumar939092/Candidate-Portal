import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}))

vi.mock("@/lib/hooks/useOnboardingMutation", () => ({
  useOnboardingSubmit: vi.fn(),
}))

vi.mock("@/lib/hooks/useOnboardingForm", () => ({
  useOnboardingForm: vi.fn(),
}))

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { OnboardingProvider, useOnboarding } from "@/lib/contexts/onboarding-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { useOnboardingSubmit } from "@/lib/hooks/useOnboardingMutation"
import { useOnboardingForm } from "@/lib/hooks/useOnboardingForm"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { OnboardingForm } from "@/lib/types/onboarding"

const mockUseRouter = vi.mocked(useRouter)
const mockUseSearchParams = vi.mocked(useSearchParams)
const mockUseAuth = vi.mocked(useAuth)
const mockUseOnboardingSubmit = vi.mocked(useOnboardingSubmit)
const mockUseOnboardingForm = vi.mocked(useOnboardingForm)
const mockUseQueryClient = vi.mocked(useQueryClient)

const push = vi.fn()
const mutateAsync = vi.fn()
const invalidateQueries = vi.fn()

const twoTabForm = {
  applicantId: "CAND-TEST-0001",
  status: "Draft",
  tabs: [
    {
      tab: "Personal Info",
      sections: [
        {
          section: "Basics",
          fields: [{ fieldname: "first_name", fieldtype: "Data", label: "First Name", value: "Test", is_mandatory: 1, hidden: 0, read_only: 0 }],
        },
      ],
    },
    {
      tab: "Work Experience",
      sections: [
        {
          section: "Work",
          fields: [{ fieldname: "company", fieldtype: "Data", label: "Company", value: "", is_mandatory: 1, hidden: 0, read_only: 0 }],
        },
      ],
    },
  ],
} as unknown as OnboardingForm

function setup(options: {
  form?: unknown
  step?: string | null
  user?: unknown
  isLoading?: boolean
  isError?: boolean
} = {}) {
  mockUseRouter.mockReturnValue({ push } as never)
  mockUseSearchParams.mockReturnValue({ get: () => options.step ?? null } as never)
  mockUseAuth.mockReturnValue(
    ("user" in options ? { user: options.user } : { user: { email: "cand@example.invalid", user_metadata: {} } }) as never,
  )
  mockUseOnboardingSubmit.mockReturnValue({ mutateAsync, isPending: false } as never)
  mockUseOnboardingForm.mockReturnValue({
    data: "form" in options ? options.form : twoTabForm,
    isLoading: options.isLoading ?? false,
    isError: options.isError ?? false,
  } as never)
  mockUseQueryClient.mockReturnValue({ invalidateQueries } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  setup()
})

function StepProbe() {
  const { currentStep, goToStep, completedSteps } = useOnboarding()
  return (
    <div>
      <span data-testid="step">{currentStep}</span>
      <span data-testid="completed">{[...completedSteps].sort().join(",")}</span>
      <button onClick={() => goToStep(5)}>Go 5</button>
      <button onClick={() => goToStep(-1)}>Go -1</button>
      <button onClick={() => goToStep(2)}>Go 2</button>
    </div>
  )
}

describe("OnboardingProvider step from the URL", () => {
  // Spec: CAND-05-A2.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("takes the step query value when it is a whole number inside the range and ignores it otherwise", async () => {
    setup({ step: "2" })
    const inRange = render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("step").textContent).toBe("2"))
    inRange.unmount()

    setup({ step: "3" })
    const tooHigh = render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("step").textContent).toBe("0"))
    tooHigh.unmount()

    setup({ step: "abc" })
    const notANumber = render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("step").textContent).toBe("0"))
    notANumber.unmount()

    // parseInt stops at the first non-digit, so "1abc" is read as step 1.
    setup({ step: "1abc" })
    render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("step").textContent).toBe("1"))
  })

  // Spec: CAND-05-A2.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a2-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("refuses a goToStep outside zero and the tab count plus one, and pushes no URL for it", async () => {
    const user = userEvent.setup()
    render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("step").textContent).toBe("0"))

    await user.click(screen.getByText("Go 5"))
    await user.click(screen.getByText("Go -1"))
    expect(screen.getByTestId("step").textContent).toBe("0")
    expect(push).not.toHaveBeenCalled()

    await user.click(screen.getByText("Go 2"))
    await waitFor(() => expect(screen.getByTestId("step").textContent).toBe("2"))
    expect(push).toHaveBeenCalledWith("/onboarding?step=2", { scroll: false })
  })
})

describe("OnboardingProvider initial completed steps", () => {
  // Spec: CAND-05-A1.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("marks a tab complete when every visible mandatory field already carries a value", async () => {
    render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("completed").textContent).toBe("personal_info"))
  })

  // Spec: CAND-05-A1.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a1-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("marks a tab without any mandatory field complete as soon as one of its fields is not empty", async () => {
    setup({
      form: {
        applicantId: "CAND-TEST-0001",
        status: "Draft",
        tabs: [
          {
            tab: "Optional One",
            sections: [{ section: "S", fields: [{ fieldname: "note", fieldtype: "Data", label: "Note", value: "filled", is_mandatory: 0, hidden: 0, read_only: 0 }] }],
          },
          {
            tab: "Optional Two",
            sections: [{ section: "S", fields: [{ fieldname: "other", fieldtype: "Data", label: "Other", value: "", is_mandatory: 0, hidden: 0, read_only: 0 }] }],
          },
        ],
      },
    })
    render(<OnboardingProvider><StepProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("completed").textContent).toBe("optional_one"))
  })
})

function SaveProbe({ action, stepKey, data }: { action: "save" | "submit"; stepKey?: string; data?: Record<string, unknown> }) {
  const { submitAll, status } = useOnboarding()
  const [failed, setFailed] = React.useState("no")
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="failed">{failed}</span>
      <button
        onClick={async () => {
          try {
            await submitAll(action, stepKey, data)
          } catch {
            setFailed("yes")
          }
        }}
      >
        Go
      </button>
    </div>
  )
}

describe("OnboardingProvider submitAll", () => {
  // Spec: CAND-05-A3.1C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("sends every loaded step when no step key is given and keeps the empty string placeholders the loader wrote", async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue(undefined)
    render(<OnboardingProvider><SaveProbe action="save" /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("draft"))

    await user.click(screen.getByText("Go"))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        stepData: { personal_info: { first_name: "Test" }, work_experience: { company: "" } },
        userEmail: "cand@example.invalid",
        action: "save",
      }),
    )
    expect(toast.success).toHaveBeenCalledWith("Progress saved successfully!")
    // A save does not move the status away from draft.
    expect(screen.getByTestId("status").textContent).toBe("draft")
  })

  // Spec: CAND-05-A3.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the mutation's message in an error toast, rethrows it and leaves the status on draft", async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mutateAsync.mockRejectedValue(new Error("Submission failed"))

    render(<OnboardingProvider><SaveProbe action="submit" /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("draft"))

    await user.click(screen.getByText("Go"))
    await waitFor(() => expect(screen.getByTestId("failed").textContent).toBe("yes"))
    expect(toast.error).toHaveBeenCalledWith("Submission failed")
    expect(toast.success).not.toHaveBeenCalled()
    expect(invalidateQueries).not.toHaveBeenCalled()
    expect(screen.getByTestId("status").textContent).toBe("draft")
    consoleSpy.mockRestore()
  })

  // Spec: CAND-05-A3.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("falls back to the literal unknown address when the signed-in user carries no e-mail", async () => {
    const user = userEvent.setup()
    setup({ user: { user_metadata: {} } })
    mutateAsync.mockResolvedValue(undefined)

    render(<OnboardingProvider><SaveProbe action="save" stepKey="personal_info" data={{ first_name: "Test" }} /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("draft"))

    await user.click(screen.getByText("Go"))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ userEmail: "unknown@example.com" }),
      ),
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["onboarding-form", { userEmail: "unknown@example.com" }] })
  })

  // Spec: CAND-05-A3.2C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("keeps a field whose approval_status is Rejected in the payload it sends", async () => {
    const user = userEvent.setup()
    setup({
      form: {
        applicantId: "CAND-TEST-0001",
        status: "Draft",
        tabs: [
          {
            tab: "Personal Info",
            sections: [
              {
                section: "Basics",
                fields: [
                  { fieldname: "first_name", fieldtype: "Data", label: "First Name", value: "Test", is_mandatory: 0, hidden: 0, read_only: 0, approval_status: "Rejected" },
                ],
              },
            ],
          },
        ],
      },
    })
    mutateAsync.mockResolvedValue(undefined)

    render(<OnboardingProvider><SaveProbe action="save" /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("draft"))

    await user.click(screen.getByText("Go"))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        stepData: { personal_info: { first_name: "Test" } },
        userEmail: "cand@example.invalid",
        action: "save",
      }),
    )
  })
})

function TriggerProbe({ calls }: { calls: string[] }) {
  const { registerSubmitTrigger, triggerSubmit } = useOnboarding()
  const [result, setResult] = React.useState("none")
  const unregisterRef = React.useRef<(() => void) | null>(null)
  return (
    <div>
      <span data-testid="result">{result}</span>
      <button
        onClick={() => {
          unregisterRef.current = registerSubmitTrigger!(async (action) => {
            calls.push(action)
            return true
          })
        }}
      >
        Register
      </button>
      <button onClick={() => unregisterRef.current?.()}>Unregister</button>
      <button onClick={async () => setResult(String(await triggerSubmit!("save_continue")))}>Trigger</button>
    </div>
  )
}

describe("OnboardingProvider submit trigger", () => {
  // Spec: CAND-05-A4.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a4-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns false until a form registers a trigger, forwards the action to it, and returns false again after the form unregisters", async () => {
    const user = userEvent.setup()
    const calls: string[] = []
    render(<OnboardingProvider><TriggerProbe calls={calls} /></OnboardingProvider>)

    await user.click(screen.getByText("Trigger"))
    await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("false"))
    expect(calls).toEqual([])

    await user.click(screen.getByText("Register"))
    await user.click(screen.getByText("Trigger"))
    await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("true"))
    expect(calls).toEqual(["save_continue"])

    await user.click(screen.getByText("Unregister"))
    await user.click(screen.getByText("Trigger"))
    await waitFor(() => expect(screen.getByTestId("result").textContent).toBe("false"))
    expect(calls).toEqual(["save_continue"])
  })
})

function FieldValueProbe() {
  const { getFieldValue, setStepData } = useOnboarding()
  return (
    <div>
      <span data-testid="value">{String(getFieldValue("company"))}</span>
      <button onClick={() => setStepData("personal_info", { first_name: "Test", company: "First tab wins" })}>Shadow</button>
    </div>
  )
}

describe("OnboardingProvider getFieldValue", () => {
  // Spec: CAND-05-A3.3A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a3-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the value from the first step that holds the fieldname, so an earlier step shadows a later one", async () => {
    const user = userEvent.setup()
    render(<OnboardingProvider><FieldValueProbe /></OnboardingProvider>)
    await waitFor(() => expect(screen.getByTestId("value").textContent).toBe(""))

    await user.click(screen.getByText("Shadow"))
    await waitFor(() => expect(screen.getByTestId("value").textContent).toBe("First tab wins"))
  })
})
