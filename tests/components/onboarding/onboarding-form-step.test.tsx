import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingFormStep } from "@/components/onboarding/onboarding-form-step";
import { useOnboarding } from "@/lib/contexts/onboarding-context";

// Hoist the mock component so it can be used in vi.mock
const { FileUploadFieldMock } = vi.hoisted(() => ({
  FileUploadFieldMock: ({ label, onChange, error }: any) => (
    <div data-testid="file-upload">
      <label>{label}</label>
      <button type="button" onClick={() => onChange("uploaded-file-url")}>Upload</button>
      {error && <span data-testid="error-message">{error}</span>}
    </div>
  ),
}));

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

// Mock child components
vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: FileUploadFieldMock,
}));

vi.mock("@/components/onboarding/dynamic-table-field", () => ({
  DynamicTableField: ({ field, errors }: any) => (
    <div data-testid="table-field">
      {field.label} Table
      {errors[field.fieldname] && <span data-testid="error-message">{errors[field.fieldname].message}</span>}
    </div>
  ),
}));

// Mock DynamicFieldRenderer to avoid deep UI rendering issues and focus on props
vi.mock("@/components/ui/field-renderer", () => ({
    DynamicFieldRenderer: ({ field, value, onChange, error, overrides }: any) => {
        if (field.fieldtype === "Attach" || field.fieldtype === "Attach Image") {
            // In OnboardingFormStep, overrides for Attach are provided
            if (overrides && overrides[field.fieldtype]) {
                const Component = overrides[field.fieldtype].component;
                return <Component field={field} value={value} onChange={onChange} error={error} />;
            }
            // Fallback (though OnboardingFormStep always provides overrides for Attach)
            return <div data-testid="file-upload-fallback">{field.label}</div>;
        }
        return (
            <div data-testid={`field-${field.fieldname}`}>
                <label>{field.label}</label>
                <input 
                    data-testid={`input-${field.fieldname}`}
                    value={(value as string) || ""} 
                    onChange={(e) => onChange(e.target.value)} 
                    placeholder={field.label}
                />
                {error && <span data-testid={`error-${field.fieldname}`}>{error}</span>}
            </div>
        );
    }
}));

describe("OnboardingFormStep", () => {
  const mockSetStepData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();
  const mockMarkStepComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTab = {
    tab: "Personal Info",
    sections: [
      {
        section: "Basic Details",
        fields: [
          { fieldname: "first_name", label: "First Name", fieldtype: "Data", reqd: 1 },
          { fieldname: "last_name", label: "Last Name", fieldtype: "Data", reqd: 0 },
        ]
      },
      {
        section: "Documents",
        fields: [
          { fieldname: "profile_pic", label: "Profile Picture", fieldtype: "Attach", reqd: 1 }
        ]
      },
      {
        section: "Work History",
        fields: [
          { fieldname: "experience", label: "Experience", fieldtype: "Table", reqd: 0 }
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
    currentStep: 1,
  };

  it("renders all sections and fields defined in the tab", () => {
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    expect(screen.getByText("First Name")).toBeTruthy();
    expect(screen.getByText("Last Name")).toBeTruthy();
    expect(screen.getByText("Profile Picture")).toBeTruthy();
    expect(screen.getByTestId("table-field")).toBeTruthy();
    expect(screen.getByText("Upload")).toBeTruthy();
  });

  it("initializes form with existing data if available", () => {
    (useOnboarding as any).mockReturnValue({
      ...defaultContext,
      stepData: { personal_info: { first_name: "Bruce", last_name: "Wayne" } }
    });
    
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    const input = screen.getByTestId("input-first_name") as HTMLInputElement;
    expect(input.value).toBe("Bruce");
  });

  it("validates mandatory fields and prevents submission", async () => {
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    const nextBtn = screen.getByText("Next Step");
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId("error-first_name")).toBeTruthy();
      expect(mockNextStep).not.toHaveBeenCalled();
    });
  });

  it("calls setStepData and nextStep on successful form submission", async () => {
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    fireEvent.change(screen.getByTestId("input-first_name"), { target: { value: "Clark" } });
    fireEvent.click(screen.getByText("Upload"));
    
    const nextBtn = screen.getByText("Next Step");
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(mockSetStepData).toHaveBeenCalledWith("personal_info", expect.objectContaining({ 
        first_name: "Clark",
        profile_pic: "uploaded-file-url"
      }));
      expect(mockMarkStepComplete).toHaveBeenCalledWith("personal_info");
      expect(mockNextStep).toHaveBeenCalled();
    });
  });

  it("enables 'Same as Current Address' logic when Permanent Address section exists", () => {
    const tabWithAddress = {
      tab: "Address",
      sections: [
        { section: "Current Address", fields: [{ fieldname: "current_city", label: "Current City", fieldtype: "Data" }] },
        { section: "Permanent Address", fields: [{ fieldname: "permanent_city", label: "Permanent City", fieldtype: "Data" }] }
      ]
    };
    
    (useOnboarding as any).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={tabWithAddress as any} stepKey="address" />);
    
    const sameAsBtn = screen.getByText("Same as Current Address");
    expect(sameAsBtn).toBeTruthy();
    
    fireEvent.change(screen.getByTestId("input-current_city"), { target: { value: "Gotham" } });
    fireEvent.click(sameAsBtn);
    
    const permInput = screen.getByTestId("input-permanent_city") as HTMLInputElement;
    expect(permInput.value).toBe("Gotham");
  });

  it("disables buttons when isSaving is true", () => {
    (useOnboarding as any).mockReturnValue({
      ...defaultContext,
      isSaving: true
    });
    
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next Step")).toBeDisabled();
  });

  it("disables 'Previous' button on the first step", () => {
    (useOnboarding as any).mockReturnValue({
      ...defaultContext,
      currentStep: 0
    });
    render(<OnboardingFormStep tab={mockTab as any} stepKey="personal_info" />);
    
    expect(screen.getByText("Previous")).toBeDisabled();
  });
});
