import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewStep } from "@/components/onboarding/steps/review-step";
import { useOnboarding, OnboardingContextType } from "@/lib/contexts/onboarding-context";

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("ReviewStep", () => {
  const mockSubmitAll = vi.fn();
  const mockPrevStep = vi.fn();
  const mockGoToStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getMockContext = (overrides = {}): OnboardingContextType => ({
    currentStep: 0,
    stepData: {
      personal_info: {
        first_name: "John",
      },
    },
    completedSteps: new Set(["personal_info"]),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
    setStepData: vi.fn(),
    goToStep: mockGoToStep,
    nextStep: vi.fn(),
    prevStep: mockPrevStep,
    markStepComplete: vi.fn(),
    submitAll: mockSubmitAll,
    getFieldValue: vi.fn(),
    formConfig: {
      applicantId: "test-id",
      status: "Pending",
      tabs: [
        {
          tab: "Personal Info",
          sections: [
            {
              section: "Basic Details",
              fields: [{ fieldname: "first_name", label: "First Name", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 }],
            },
          ],
        },
      ],
    },
    ...overrides,
  });

  it("renders success state when submitted", () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext({ status: "submitted" }));
    render(<ReviewStep />);

    expect(screen.getByText("Onboarding Submitted!")).toBeTruthy();
    expect(screen.getByText(/Your onboarding information has been submitted successfully/)).toBeTruthy();
  });

  it("renders incomplete steps warning and disables submit", () => {
    vi.mocked(useOnboarding).mockReturnValue(
      getMockContext({ completedSteps: new Set() }) // Personal Info is incomplete
    );
    render(<ReviewStep />);

    expect(screen.getByText("Please complete all steps before submitting.")).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    expect(submitBtn).toBeDisabled();

    // Clicking the incomplete step link should call goToStep.
    // There are two buttons with Personal Info text: Accordion and the Missing Step link.
    const buttons = screen.getAllByRole("button", { name: "Personal Info" });
    const stepLink = buttons.find(b => b.className.includes("underline"));
    fireEvent.click(stepLink!);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("renders step tabs and allows expanding sections to see summary data", () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const accordionBtn = screen.getByRole("button", { name: /Personal Info/i });
    expect(accordionBtn).toBeTruthy();

    // Expanded data shouldn't be visible initially in the details block
    expect(screen.queryByText("Edit this section")).toBeNull();

    // Click to expand
    fireEvent.click(accordionBtn);

    // After expanding, we should see the values
    expect(screen.getByText("First Name:")).toBeTruthy();
    expect(screen.getAllByText("John")[0]).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit this section" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Edit this section" }));
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("calls prevStep when Back button is clicked", () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);
    expect(mockPrevStep).toHaveBeenCalled();
  });

  it("handles standard successful submission flow after declaration acceptance", async () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    expect(submitBtn).not.toBeDisabled();

    // Check the declaration checkbox (required)
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitAll).toHaveBeenCalled();
    });
  });

  it("displays server error message on submit failure", async () => {
    mockSubmitAll.mockRejectedValueOnce(new Error("Network Error occurred"));
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());

    render(<ReviewStep />);

    // Check the declaration checkbox (required)
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Network Error occurred")).toBeTruthy();
    });
  });
});
