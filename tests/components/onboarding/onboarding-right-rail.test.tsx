import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("calculates days to joining from days_to_joining field or custom date, including invalid date fallback", () => {
    // 1. With days_to_joining in formConfig
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        joining: {
          days_to_joining: 15,
        },
        tabs: [],
      },
      currentStep: 0,
      stepData: {},
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    const { rerender } = render(<OnboardingRightRail focusedFieldname={null} />);
    expect(screen.getByText("15")).toBeTruthy();

    // 2. Omit days_to_joining, compute dynamically
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        tabs: [],
      },
      currentStep: 0,
      stepData: {
        tab1: {
          custom_date_of_joining: targetDateStr,
        }
      },
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    rerender(<OnboardingRightRail focusedFieldname={null} />);
    expect(screen.getByText("5")).toBeTruthy();

    // 3. Invalid date format fallback
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        tabs: [],
      },
      currentStep: 0,
      stepData: {
        tab1: {
          custom_date_of_joining: "not-a-date",
        }
      },
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    rerender(<OnboardingRightRail focusedFieldname={null} />);
    expect(screen.getByText("Start date passed")).toBeTruthy();

    // 4. Omit custom_date_of_joining entirely
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        tabs: [],
      },
      currentStep: 0,
      stepData: {
        tab1: {
          custom_date_of_joining: "",
        }
      },
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    rerender(<OnboardingRightRail focusedFieldname={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("handles buddy name initials generation properly", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        key_contacts: [
          { name: "", designation: "Buddy 1", email: "buddy1@test.com" },
          { name: "SingleName", designation: "Buddy 2", email: "buddy2@test.com" },
          { name: "John Doe", designation: "Buddy 3", email: "buddy3@test.com" },
        ],
        tabs: [],
      },
      currentStep: 0,
      stepData: {},
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    render(<OnboardingRightRail focusedFieldname={null} />);

    expect(screen.getByText("OB")).toBeTruthy();
    expect(screen.getByText("SI")).toBeTruthy();
    expect(screen.getByText("JD")).toBeTruthy();
  });

  it("renders required fields checklist and handles jumping to field when clicked", () => {
    const mockTabs = [
      {
        tab: "Personal",
        sections: [
          {
            section: "General",
            fields: [
              { fieldname: "first_name", label: "First Name", fieldtype: "Data", is_mandatory: 1, hidden: 0 },
              { fieldname: "last_name", label: "Last Name", fieldtype: "Data", is_mandatory: 1, hidden: 0 },
              { fieldname: "agree_terms", label: "Agree Terms", fieldtype: "Check", is_mandatory: 1, hidden: 0 },
              { fieldname: "nominees", label: "Nominees", fieldtype: "Table", is_mandatory: 1, hidden: 0 },
            ]
          }
        ]
      }
    ];

    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        tabs: mockTabs,
      },
      currentStep: 0,
      stepData: {
        personal: {
          first_name: "John",
          agree_terms: false,
          nominees: [],
        }
      },
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    const mockInput = document.createElement("input");
    const mockContainer = document.createElement("div");
    mockContainer.id = "field-last_name";
    mockContainer.appendChild(mockInput);
    document.body.appendChild(mockContainer);

    const scrollMock = vi.fn();
    const animateMock = vi.fn().mockReturnValue({ finished: Promise.resolve() });
    mockContainer.scrollIntoView = scrollMock;
    mockContainer.animate = animateMock;

    render(<OnboardingRightRail focusedFieldname={null} />);

    expect(screen.getByText("Last Name")).toBeTruthy();
    expect(screen.getByText("Agree Terms")).toBeTruthy();
    expect(screen.getByText("Nominees")).toBeTruthy();

    const jumpButton = screen.getByText("Last Name").closest("button");
    expect(jumpButton).toBeTruthy();
    fireEvent.click(jumpButton!);

    expect(scrollMock).toHaveBeenCalled();
    
    document.body.removeChild(mockContainer);
  });

  it("renders onboarding journey step-by-step info", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        onboarding_journey: {
          title: "Your First Weeks",
          subtitle: "Journey map",
          steps: [
            { title: "Day 1 Orientation", timeframe: "Day 1", detail: "Get laptop" },
            { title: "Meet Team", timeframe: "Week 1", detail: "Intro call" },
          ]
        },
        tabs: [],
      },
      currentStep: 0,
      stepData: {},
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    render(<OnboardingRightRail focusedFieldname={null} />);

    expect(screen.getByText("Your First Weeks")).toBeTruthy();
    expect(screen.getByText("Journey map")).toBeTruthy();
    expect(screen.getByText("Day 1 Orientation")).toBeTruthy();
    expect(screen.getByText("Day 1")).toBeTruthy();
    expect(screen.getByText("Get laptop")).toBeTruthy();
    expect(screen.getByText("Meet Team")).toBeTruthy();
    expect(screen.getByText("Week 1")).toBeTruthy();
    expect(screen.getByText("Intro call")).toBeTruthy();
  });

  it("renders onboarding buddy card and handles say hello click", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        key_contacts: [
          { name: "John Doe", designation: "Buddy Manager", email: "johndoe@test.com", phone: "1234567890" },
        ],
        tabs: [],
      },
      currentStep: 0,
      stepData: {},
      triggerSubmit: vi.fn(),
      isSaving: false,
    } as any);

    const windowMock = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<OnboardingRightRail focusedFieldname={null} />);

    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Buddy Manager")).toBeTruthy();
    expect(screen.getByText("johndoe@test.com")).toBeTruthy();
    expect(screen.getByText("1234567890")).toBeTruthy();

    const sayHelloButton = screen.getByText("Say hello to John");
    expect(sayHelloButton).toBeTruthy();
    fireEvent.click(sayHelloButton);

    expect(windowMock).toHaveBeenCalledWith("mailto:johndoe@test.com");
    windowMock.mockRestore();
  });

  it("handles bottom action triggers (Save & Continue, Save as Draft & Exit)", async () => {
    const mockTriggerSubmit = vi.fn().mockResolvedValue(true);
    vi.mocked(useOnboarding).mockReturnValue({
      formConfig: {
        tabs: [],
      },
      currentStep: 0,
      stepData: {},
      triggerSubmit: mockTriggerSubmit,
      isSaving: false,
    } as any);

    render(<OnboardingRightRail focusedFieldname={null} />);

    const saveContinueButton = screen.getByText("Save & Continue");
    expect(saveContinueButton).toBeTruthy();
    fireEvent.click(saveContinueButton);
    expect(mockTriggerSubmit).toHaveBeenCalledWith("save_continue");

    const saveDraftButton = screen.getByText("Save as Draft & Exit");
    expect(saveDraftButton).toBeTruthy();
    fireEvent.click(saveDraftButton);
    expect(mockTriggerSubmit).toHaveBeenCalledWith("save_draft");
  });
});
