import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingSnapshot } from "@/components/dashboard/onboarding-snapshot";

describe("OnboardingSnapshot", () => {
  it("renders correctly with in-progress status", () => {
    render(<OnboardingSnapshot completedSteps={3} totalSteps={8} />);
    
    expect(screen.getByText("ONBOARDING IN PROGRESS")).toBeTruthy();
    expect(screen.getByText("3 of 8 steps completed")).toBeTruthy();
    expect(screen.getByText(/Complete your onboarding tasks/)).toBeTruthy();
  });

  it("renders correctly with completed status", () => {
    render(
      <OnboardingSnapshot 
        completedSteps={8} 
        totalSteps={8} 
        joiningDate="2026-09-08T00:00:00Z" 
      />
    );
    
    expect(screen.getByText("ONBOARDING COMPLETE")).toBeTruthy();
    expect(screen.getByText("You are ready to join us on September 8th!")).toBeTruthy();
    expect(screen.getByText(/All mandatory tasks/)).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("calculates percentage correctly", () => {
    render(<OnboardingSnapshot completedSteps={2} totalSteps={8} />);
    // 2/8 = 25%
    expect(screen.getByText("25%")).toBeTruthy();
  });

  it("renders correctly with default totalSteps", () => {
    render(<OnboardingSnapshot completedSteps={4} />);
    // 4/8 = 50%
    expect(screen.getByText("4 of 8 steps completed")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });
});
