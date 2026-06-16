import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OnboardingPage from "@/app/(portal)/onboarding/page";
import { OnboardingTab } from "@/lib/types/onboarding";

// Mocks
const mockUseOnboarding = vi.fn();

vi.mock("@/lib/contexts/onboarding-context", () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useOnboarding: () => mockUseOnboarding(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/components/onboarding/onboarding-step-nav", () => ({
  OnboardingStepNav: () => <div data-testid="onboarding-step-nav">Sidebar Nav</div>,
}));

vi.mock("@/components/onboarding/steps/review-step", () => ({
  ReviewStep: () => <div data-testid="review-step">Review Step Mock</div>,
}));

vi.mock("@/components/onboarding/onboarding-form-step", () => ({
  OnboardingFormStep: ({ tab }: { tab: OnboardingTab }) => <div data-testid="onboarding-form-step">Form Step Mock for {tab?.tab}</div>,
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress-bar">Progress: {value}%</div>,
}));

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state when isLoading is true", () => {
    mockUseOnboarding.mockReturnValue({ isLoading: true });
    render(<OnboardingPage />);
    expect(screen.getByText("Loading your onboarding data...")).toBeTruthy();
  });

  it("renders form step when currentStep is less than total tabs", () => {
    mockUseOnboarding.mockReturnValue({
      isLoading: false,
      currentStep: 0,
      completedSteps: new Set(),
      formConfig: {
        tabs: [
          { tab: "Personal Info", sections: [] },
          { tab: "Education", sections: [] },
        ],
      },
      stepData: {},
      status: "in_progress",
    });

    render(<OnboardingPage />);
    
    expect(screen.getByTestId("onboarding-step-nav")).toBeTruthy();
    expect(screen.getAllByText("Personal Info")[0]).toBeTruthy();
    expect(screen.getByTestId("onboarding-form-step")).toBeTruthy();
    expect(screen.getByText("Form Step Mock for Personal Info")).toBeTruthy();
  });

  it("renders review step when currentStep is equal to or greater than tabs length", () => {
    mockUseOnboarding.mockReturnValue({
      isLoading: false,
      currentStep: 2,
      completedSteps: new Set([0, 1]),
      formConfig: {
        tabs: [
          { tab: "Personal Info", sections: [] },
          { tab: "Education", sections: [] },
        ],
      },
      stepData: {},
      status: "in_progress",
    });

    render(<OnboardingPage />);
    
    expect(screen.getByTestId("onboarding-step-nav")).toBeTruthy();
    expect(screen.getByTestId("review-step")).toBeTruthy();
    expect(screen.getByText("Review Step Mock")).toBeTruthy();
  });

  it("hides header and mobile progress bar when status is submitted", () => {
    mockUseOnboarding.mockReturnValue({
      isLoading: false,
      currentStep: 2,
      completedSteps: new Set([0, 1, 2]),
      formConfig: {
        tabs: [
          { tab: "Personal Info", sections: [] },
          { tab: "Education", sections: [] },
        ],
      },
      stepData: {},
      status: "submitted",
    });

    render(<OnboardingPage />);
    
    expect(screen.queryByText(/Please fill in the details below accurately/)).toBeNull();
    expect(screen.queryByTestId("progress-bar")).toBeNull();
    expect(screen.getByTestId("review-step")).toBeTruthy();
  });

  it("renders error state when isError is true", () => {
    mockUseOnboarding.mockReturnValue({ isError: true, isLoading: false });
    render(<OnboardingPage />);
    
    expect(screen.getByText("Onboarding not yet started")).toBeTruthy();
    expect(screen.getByText(/your onboarding journey hasn't been initialized yet/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Back to Dashboard/i })).toBeTruthy();
  });
});
