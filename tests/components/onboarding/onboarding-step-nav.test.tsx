import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingStepNav } from "@/components/onboarding/onboarding-step-nav";
import { useOnboarding } from "@/lib/contexts/onboarding-context";

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

describe("OnboardingStepNav", () => {
  const mockGoToStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    currentStep: 0,
    completedSteps: new Set(),
    goToStep: mockGoToStep,
    status: "draft",
    formConfig: {
      tabs: [
        { tab: "Personal Information" },
        { tab: "Education Details" }
      ]
    }
  };

  it("renders onboarding header and progress bar", () => {
    (useOnboarding as any).mockReturnValue(defaultProps);
    render(<OnboardingStepNav />);
    
    expect(screen.getByText("Onboarding")).toBeTruthy();
    expect(screen.getByText("Complete your profile to get started.")).toBeTruthy();
  });

  it("calculates progress percentage correctly", () => {
    // 2 tabs + 1 review = 3 steps total.
    // 1 completed step.
    (useOnboarding as any).mockReturnValue({
      ...defaultProps,
      completedSteps: new Set(["personal_information"])
    });
    
    const { container } = render(<OnboardingStepNav />);
    const progressBar = container.querySelector(".bg-primary-foreground.transition-all");
    expect(progressBar).toHaveStyle("width: 33%");
  });

  it("renders steps with correct status indicators", () => {
    (useOnboarding as any).mockReturnValue({
      ...defaultProps,
      currentStep: 1, // At Education Details
      completedSteps: new Set(["personal_information"])
    });
    
    render(<OnboardingStepNav />);
    
    // Personal Information should show check icon (completed)
    // Education Details should show active style (2)
    // Review should show pending style (3)
    
    expect(screen.getByText("Personal Information")).toBeTruthy();
    expect(screen.getByText("Education Details")).toBeTruthy();
    expect(screen.getByText("Review")).toBeTruthy();
    
    // Check for check icon in completed step
    const completedStep = screen.getByText("Personal Information").parentElement;
    expect(completedStep?.querySelector("svg")).toBeTruthy(); // Check icon
  });

  it("calls goToStep when a clickable step is clicked", () => {
    (useOnboarding as any).mockReturnValue({
      ...defaultProps,
      currentStep: 1,
      completedSteps: new Set(["personal_information"])
    });
    
    render(<OnboardingStepNav />);
    
    const firstStep = screen.getByText("Personal Information");
    fireEvent.click(firstStep);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("disables future steps that are not yet clickable", () => {
    (useOnboarding as any).mockReturnValue(defaultProps);
    render(<OnboardingStepNav />);
    
    const futureStep = screen.getByText("Education Details").parentElement;
    expect(futureStep).toBeDisabled();
    
    fireEvent.click(futureStep!);
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("renders back to dashboard link", () => {
    (useOnboarding as any).mockReturnValue(defaultProps);
    render(<OnboardingStepNav />);
    
    const backLink = screen.getByText("Back to Dashboard");
    expect(backLink).toBeTruthy();
    expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
