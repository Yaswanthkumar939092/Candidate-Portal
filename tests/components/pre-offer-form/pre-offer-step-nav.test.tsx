import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreOfferStepNav } from "@/components/pre-offer-form/pre-offer-step-nav";
import { usePreOffer, PreOfferContextType } from "@/lib/contexts/pre-offer-context";

vi.mock("@/lib/contexts/pre-offer-context", () => ({
  usePreOffer: vi.fn(),
}));

describe("PreOfferStepNav", () => {
  const mockGoToStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultContext: PreOfferContextType = {
    currentStep: 0,
    stepData: {},
    completedSteps: new Set(),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "Draft",
    setStepData: vi.fn(),
    goToStep: mockGoToStep,
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    markStepComplete: vi.fn(),
    submitAll: vi.fn(),
    getFieldValue: vi.fn(),
    formConfig: {
      applicantId: "test-id",
      status: "Pending",
      tabs: [
        { tab: "Personal Information", sections: [] },
        { tab: "Education Details", sections: [] }
      ]
    }
  };

  it("renders pre-offer header and progress bar", () => {
    vi.mocked(usePreOffer).mockReturnValue(defaultContext);
    render(<PreOfferStepNav />);

    expect(screen.getByText("Pre-Offer Details")).toBeTruthy();
    expect(screen.getByText("Provide all required credentials.")).toBeTruthy();
  });

  it("calculates progress percentage correctly", () => {
    vi.mocked(usePreOffer).mockReturnValue({
      ...defaultContext,
      completedSteps: new Set(["personal_information"])
    });

    const { container } = render(<PreOfferStepNav />);
    const progressBar = container.querySelector(".bg-primary-foreground.transition-all");
    expect(progressBar).toHaveStyle("width: 33%");
  });

  it("renders steps with correct status indicators", () => {
    vi.mocked(usePreOffer).mockReturnValue({
      ...defaultContext,
      currentStep: 1,
      completedSteps: new Set(["personal_information"])
    });

    render(<PreOfferStepNav />);

    expect(screen.getByText("Personal Information")).toBeTruthy();
    expect(screen.getByText("Education Details")).toBeTruthy();
    expect(screen.getByText("Review")).toBeTruthy();

    const completedStep = screen.getByText("Personal Information").parentElement;
    expect(completedStep?.querySelector("svg")).toBeTruthy();
  });

  it("calls goToStep when a clickable step is clicked", () => {
    vi.mocked(usePreOffer).mockReturnValue({
      ...defaultContext,
      currentStep: 1,
      completedSteps: new Set(["personal_information"])
    });

    render(<PreOfferStepNav />);

    const firstStep = screen.getByText("Personal Information");
    fireEvent.click(firstStep);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("disables future steps that are not yet clickable", () => {
    vi.mocked(usePreOffer).mockReturnValue(defaultContext);
    render(<PreOfferStepNav />);

    const futureStep = screen.getByText("Education Details").parentElement;
    expect(futureStep).toBeDisabled();

    fireEvent.click(futureStep!);
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("renders action center link", () => {
    vi.mocked(usePreOffer).mockReturnValue(defaultContext);
    render(<PreOfferStepNav />);

    const backLink = screen.getByText("Action Center");
    expect(backLink).toBeTruthy();
    expect(backLink.closest('a')).toHaveAttribute('href', '/action-center');
  });
});
