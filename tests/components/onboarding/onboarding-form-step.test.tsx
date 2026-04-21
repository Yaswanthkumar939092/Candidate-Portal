import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingFormStep } from "@/components/onboarding/onboarding-form-step";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { useGenderOptions } from "@/lib/hooks/useGenderOptions";

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

vi.mock("@/lib/hooks/useGenderOptions", () => ({
  useGenderOptions: vi.fn(),
}));

// Mock child components to keep it simple
vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: ({ label, onChange }: any) => (
    <div data-testid="file-upload">
      <label>{label}</label>
      <button onClick={() => onChange("uploaded-file-url")}>Upload</button>
    </div>
  ),
}));

vi.mock("@/components/onboarding/dynamic-table-field", () => ({
  DynamicTableField: ({ field }: any) => <div data-testid="table-field">{field.label} Table</div>,
}));

describe("OnboardingFormStep", () => {
  const mockSetStepData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();
  const mockMarkStepComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGenderOptions as any).mockReturnValue({ data: ["Male", "Female"] });
  });

  const mockTab = {
    tab: "Personal Info",
    sections: [
      {
        section: "Basic Details",
        fields: [
          { fieldname: "first_name", label: "First Name", fieldtype: "Data", reqd: 1 },
          { fieldname: "gender", label: "Gender", fieldtype: "Link", options: "Male\nFemale" }
        ]
      },
      {
        section: "Documents",
        fields: [
          { fieldname: "profile_pic", label: "Profile Picture", fieldtype: "Attach" }
        ]
      }
    ]
  };

  const defaultContext = {
    stepData: {},
    setStepData: mockSetStepData,
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
    markStepComplete: mockMarkStepComplete,
    isSaving: false,
    currentStep: 0,
  };

  it("renders all sections and fields defined in the tab", () => {
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    expect(screen.getByText("First Name")).toBeTruthy();
    expect(screen.getByText("Gender")).toBeTruthy();
    expect(screen.getByTestId("file-upload")).toBeTruthy();
    expect(screen.getByText("Profile Picture")).toBeTruthy();
  });

  it("initializes form with existing data if available", () => {
    (useOnboarding as any).mockReturnValue({
      ...defaultContext,
      stepData: { personal_info: { first_name: "Bruce" } }
    });
    
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    const input = screen.getByPlaceholderText("First Name") as HTMLInputElement;
    expect(input.value).toBe("Bruce");
  });

  it("calls setStepData and nextStep on successful form submission", async () => {
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    const input = screen.getByPlaceholderText("First Name");
    fireEvent.change(input, { target: { value: "Clark" } });
    
    const nextBtn = screen.getByText("Next Step");
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(mockSetStepData).toHaveBeenCalledWith("personal_info", expect.objectContaining({ first_name: "Clark" }));
      expect(mockMarkStepComplete).toHaveBeenCalledWith("personal_info");
      expect(mockNextStep).toHaveBeenCalled();
    });
  });

  it("enables 'Same as Current Address' logic when Permanent Address section exists", () => {
    const tabWithAddress = {
      ...mockTab,
      sections: [
        { section: "Current Address", fields: [{ fieldname: "current_city", label: "City", fieldtype: "Data" }] },
        { section: "Permanent Address", fields: [{ fieldname: "permanent_city", label: "City", fieldtype: "Data" }] }
      ]
    };
    
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={tabWithAddress as any} stepKey="address" />);
    
    const sameAsBtn = screen.getByText("Same as Current Address");
    expect(sameAsBtn).toBeTruthy();
    
    const currentInput = screen.getAllByPlaceholderText("City")[0] as HTMLInputElement;
    fireEvent.change(currentInput, { target: { value: "Gotham" } });
    
    fireEvent.click(sameAsBtn);
    
    const permInput = screen.getAllByPlaceholderText("City")[1] as HTMLInputElement;
    expect(permInput.value).toBe("Gotham");
  });

  it("disables 'Previous' button on the first step", () => {
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    const prevBtn = screen.getByText("Previous");
    expect(prevBtn).toBeDisabled();
  });
});
