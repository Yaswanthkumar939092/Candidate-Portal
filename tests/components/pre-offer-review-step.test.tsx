import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PreOfferReviewStep } from "@/components/pre-offer-form/pre-offer-review-step"
import * as preOfferContext from "@/lib/contexts/pre-offer-context"
import * as preOfferHooks from "@/lib/hooks/usePreOfferForm"

vi.mock("@/lib/contexts/pre-offer-context")
vi.mock("@/lib/hooks/usePreOfferForm")

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
    warning: vi.fn(),
  },
}))

describe("PreOfferReviewStep", () => {
  const mockTabs = [
    {
      tab: "Basic Details",
      sections: [
        {
          section: "Basic Details",
          fields: [
            {
              fieldname: "full_name",
              label: "Full Name",
              fieldtype: "Data",
            },
            {
              fieldname: "education_table",
              label: "Education Details",
              fieldtype: "Table",
              child_fields: [
                { fieldname: "school", label: "School Name", fieldtype: "Data" },
                { fieldname: "degree", label: "Degree Title", fieldtype: "Data" },
              ],
            },
          ],
        },
      ],
    },
  ]

  const mockStepData = {
    basic_details: {
      full_name: "John Doe",
      education_table: [
        { school: "Stanford University", degree: "M.S. Computer Science" },
      ],
    },
  }

  const mockSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(preOfferContext.usePreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      tabs: mockTabs,
      stepData: mockStepData,
      applicantId: "test-id",
    })
    ;(preOfferHooks.useSubmitPreOffer as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      mutate: mockSubmit,
      isPending: false,
    })
  })

  it("renders review headers and fields", () => {
    render(
      <PreOfferReviewStep
        completedSteps={new Set(["basic_details"])}
        goToStep={vi.fn()}
        onPrev={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText("Review All Details")).toBeTruthy()
    expect(screen.getByText("Basic Details")).toBeTruthy()
    expect(screen.getByText("1 Education Details Added")).toBeTruthy()
  })

  it("toggles sections and renders nested details", () => {
    const mockGoToStep = vi.fn()
    render(
      <PreOfferReviewStep
        completedSteps={new Set(["basic_details"])}
        goToStep={mockGoToStep}
        onPrev={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    const toggleButton = screen.getByRole("button", { name: /Basic Details/i })
    fireEvent.click(toggleButton) // Expand

    expect(screen.getByText("School Name:")).toBeTruthy()
    expect(screen.getByText("Stanford University")).toBeTruthy()

    const editBtn = screen.getByRole("button", { name: "Edit this section" })
    fireEvent.click(editBtn)
    expect(mockGoToStep).toHaveBeenCalledWith(0)
  })

  it("renders incomplete step warnings", () => {
    const mockGoToStep = vi.fn()
    render(
      <PreOfferReviewStep
        completedSteps={new Set()} // No steps completed
        goToStep={mockGoToStep}
        onPrev={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText("Please complete all steps before submitting.")).toBeTruthy()
    const warningLink = screen.getByRole("button", { name: "Basic Details" })
    fireEvent.click(warningLink)
    expect(mockGoToStep).toHaveBeenCalledWith(0)
  })

  it("triggers submission after accepting declaration", async () => {
    mockSubmit.mockImplementation((payload, config) => {
      config?.onSuccess?.()
    })

    render(
      <PreOfferReviewStep
        completedSteps={new Set(["basic_details"])}
        goToStep={vi.fn()}
        onPrev={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    const submitButton = screen.getByRole("button", { name: /Submit Application/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        {
          jobApplicant: "test-id",
          data: {
            full_name: "John Doe",
            education_table: [
              { school: "Stanford University", degree: "M.S. Computer Science" },
            ],
          },
        },
        expect.any(Object)
      )
    })

    expect(mockToastSuccess).toHaveBeenCalledWith("Pre-offer details submitted successfully!")
  })

  it("shows inline error when submission fails", async () => {
    mockSubmit.mockImplementation((payload, config) => {
      config?.onError?.(new Error("API submit failed"))
    })

    render(
      <PreOfferReviewStep
        completedSteps={new Set(["basic_details"])}
        goToStep={vi.fn()}
        onPrev={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    const submitButton = screen.getByRole("button", { name: /Submit Application/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("API submit failed")).toBeTruthy()
    })
    expect(mockToastError).toHaveBeenCalledWith("API submit failed")
  })
})
