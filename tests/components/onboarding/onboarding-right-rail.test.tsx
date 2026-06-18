import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingRightRail } from "@/components/onboarding/onboarding-right-rail";
import { useOnboarding } from "@/lib/contexts/onboarding-context";

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

describe("OnboardingRightRail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders company name and joining details when provided in formConfig", () => {
    const mockFormConfig = {
      branding: {
        company_name: "Test Corporate LLC",
      },
      joining: {
        date_of_joining: "2026-06-30",
        role_name: "DSSS",
        department_name: "Accounts - D",
      },
      tabs: [],
    };

    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: mockFormConfig,
      currentStep: 0,
      stepData: {},
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    render(<OnboardingRightRail focusedFieldname={null} />);

    // Assert company name is present
    expect(screen.getByText("Test Corporate LLC")).toBeTruthy();

    // Assert joining details are displayed
    expect(screen.getByText("Role")).toBeTruthy();
    expect(screen.getByText("DSSS")).toBeTruthy();
    expect(screen.getByText("Department")).toBeTruthy();
    expect(screen.getByText("Accounts - D")).toBeTruthy();
    expect(screen.getByText("Date of Joining")).toBeTruthy();
    // 2026-06-30 formatted en-IN should be "30-Jun-2026" or similar.
    // The formatDisplayDate uses toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    // Let's assert on the content of the date
    expect(screen.getByText(/30\s+Jun\s+2026/)).toBeTruthy();
  });

  it("does not render joining details sections if joining info is missing", () => {
    const mockFormConfig = {
      branding: {
        company_name: "Test Corporate LLC",
      },
      tabs: [],
    };

    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: mockFormConfig,
      currentStep: 0,
      stepData: {},
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    render(<OnboardingRightRail focusedFieldname={null} />);

    expect(screen.getByText("Test Corporate LLC")).toBeTruthy();
    expect(screen.queryByText("Role")).toBeNull();
    expect(screen.queryByText("Department")).toBeNull();
    expect(screen.queryByText("Date of Joining")).toBeNull();
  });
});
