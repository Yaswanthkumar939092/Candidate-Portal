import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PreOfferFormStep } from "@/components/pre-offer-form/pre-offer-form-step";
import { usePreOffer, PreOfferContextType } from "@/lib/contexts/pre-offer-context";
import { PreOfferField, PreOfferTab } from "@/lib/types/pre-offer";

interface FileUploadFieldProps {
  label: string;
  onChange: (value: string) => void;
  error?: string;
}

interface DynamicTableFieldProps {
  field: PreOfferField;
  errors: Record<string, { message: string }>;
}

interface OverrideComponentProps {
  field: PreOfferField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

interface DynamicFieldRendererProps {
  field: PreOfferField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  overrides?: Record<string, { component: React.ComponentType<OverrideComponentProps> }>;
}

const { FileUploadFieldMock } = vi.hoisted(() => ({
  FileUploadFieldMock: ({ label, onChange, error }: FileUploadFieldProps) => (
    <div data-testid="file-upload">
      <label>{label}</label>
      <button type="button" onClick={() => onChange("uploaded-file-url")}>Upload</button>
      {error && <span data-testid="error-message">{error}</span>}
    </div>
  ),
}));

vi.mock("@/lib/contexts/pre-offer-context", () => ({
  usePreOffer: vi.fn(),
}));

vi.mock("@/components/pre-offer-form/file-upload-field", () => ({
  FileUploadField: FileUploadFieldMock,
}));

vi.mock("@/components/pre-offer-form/dynamic-table-field", () => ({
  DynamicTableField: ({ field, errors }: DynamicTableFieldProps) => (
    <div data-testid="table-field">
      {field.label} Table
      {errors[field.fieldname] && <span data-testid="error-message">{errors[field.fieldname].message}</span>}
    </div>
  ),
}));

vi.mock("@/components/ui/field-renderer", () => ({
    DynamicFieldRenderer: ({ field, value, onChange, error, overrides }: DynamicFieldRendererProps) => {
        if (field.fieldtype === "Attach" || field.fieldtype === "Attach Image") {
            if (overrides && overrides[field.fieldtype]) {
                const Component = overrides[field.fieldtype].component;
                return <Component field={field} value={value} onChange={onChange} error={error} />;
            }
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

describe("PreOfferFormStep", () => {
  const mockSetStepData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();
  const mockMarkStepComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const mockTab: PreOfferTab = {
    tab: "Personal Info",
    sections: [
      {
        section: "Basic Details",
        fields: [
          { fieldname: "first_name", label: "First Name", fieldtype: "Data", reqd: 1, is_mandatory: 1, read_only: 0, hidden: 0 },
          { fieldname: "last_name", label: "Last Name", fieldtype: "Data", reqd: 0, is_mandatory: 0, read_only: 0, hidden: 0 },
        ]
      },
      {
        section: "Documents",
        fields: [
          { fieldname: "profile_pic", label: "Profile Picture", fieldtype: "Attach", reqd: 1, is_mandatory: 1, read_only: 0, hidden: 0 }
        ]
      },
      {
        section: "Work History",
        fields: [
          { fieldname: "experience", label: "Experience", fieldtype: "Table", reqd: 0, is_mandatory: 0, read_only: 0, hidden: 0 }
        ]
      }
    ]
  };

  const defaultContext: PreOfferContextType = {
    currentStep: 1,
    stepData: {},
    completedSteps: new Set(),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "Draft",
    setStepData: mockSetStepData,
    goToStep: vi.fn(),
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
    markStepComplete: mockMarkStepComplete,
    submitAll: vi.fn(),
    getFieldValue: vi.fn(),
    formConfig: {
        applicantId: "test",
        status: "Pending",
        tabs: [mockTab]
    }
  };

  it("renders all sections and fields defined in the tab", () => {
    vi.mocked(usePreOffer).mockReturnValue(defaultContext);
    render(<PreOfferFormStep tab={mockTab} stepKey="personal_info" />);
    
    expect(screen.getByText("First Name")).toBeTruthy();
    expect(screen.getByText("Last Name")).toBeTruthy();
    expect(screen.getByText("Profile Picture")).toBeTruthy();
    expect(screen.getByTestId("table-field")).toBeTruthy();
    expect(screen.getByText("Upload")).toBeTruthy();
  });

  it("initializes form with existing data if available", () => {
    vi.mocked(usePreOffer).mockReturnValue({
      ...defaultContext,
      stepData: { personal_info: { first_name: "Bruce", last_name: "Wayne" } }
    });
    
    render(<PreOfferFormStep tab={mockTab} stepKey="personal_info" />);
    
    const input = screen.getByTestId("input-first_name") as HTMLInputElement;
    expect(input.value).toBe("Bruce");
  });

  it("validates mandatory fields and prevents submission", async () => {
    vi.mocked(usePreOffer).mockReturnValue(defaultContext);
    render(<PreOfferFormStep tab={mockTab} stepKey="personal_info" />);
    
    const nextBtn = screen.getByText("Next Step");
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId("error-first_name")).toBeTruthy();
      expect(mockNextStep).not.toHaveBeenCalled();
    });
  });

  it("calls setStepData and nextStep on successful form submission", async () => {
    vi.mocked(usePreOffer).mockReturnValue(defaultContext);
    render(<PreOfferFormStep tab={mockTab} stepKey="personal_info" />);
    
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

  it("disables buttons when isSaving is true", () => {
    vi.mocked(usePreOffer).mockReturnValue({
      ...defaultContext,
      isSaving: true
    });
    
    render(<PreOfferFormStep tab={mockTab} stepKey="personal_info" />);
    
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next Step")).toBeDisabled();
  });

  it("disables 'Previous' button on the first step", () => {
    vi.mocked(usePreOffer).mockReturnValue({
      ...defaultContext,
      currentStep: 0
    });
    render(<PreOfferFormStep tab={mockTab} stepKey="personal_info" />);
    
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  describe("Extended Edge Verification", () => {
    it("initializes form from definition defaults when existing data is blank", () => {
      const defaultMapTab: PreOfferTab = {
        tab: "Defaults",
        sections: [{
          section: "Default Section",
          fields: [
            { fieldname: "preset", label: "Preset", fieldtype: "Data", default: "AutoValue", is_mandatory: 0, read_only: 0, hidden: 0 }
          ]
        }]
      };
      
      vi.mocked(usePreOffer).mockReturnValue(defaultContext);
      render(<PreOfferFormStep tab={defaultMapTab} stepKey="def_test" />);
      
      const input = screen.getByTestId("input-preset") as HTMLInputElement;
      expect(input.value).toBe("AutoValue");
    });

    it("validates special collection types ensuring required states are populated", async () => {
       const strictTab: PreOfferTab = {
          tab: "Strict",
          sections: [{
             section: "Required Checklist",
             fields: [
                { fieldname: "req_table", label: "Mandatory Table", fieldtype: "Table", is_mandatory: 1, read_only: 0, hidden: 0 },
                { fieldname: "req_check", label: "Mandatory Check", fieldtype: "Check", is_mandatory: 1, read_only: 0, hidden: 0 }
             ]
          }]
       };
       
       vi.mocked(usePreOffer).mockReturnValue(defaultContext);
       render(<PreOfferFormStep tab={strictTab} stepKey="strict_test" />);
       
       fireEvent.click(screen.getByText("Next Step"));
       
       await waitFor(() => {
          expect(screen.getByText("Mandatory Table is required")).toBeTruthy();
          expect(screen.getByTestId("error-req_check")).toBeTruthy();
       });
    });

    it("enforces custom pattern matching constraints on defined contact dimensions", async () => {
       const contactTab: PreOfferTab = {
          tab: "Contacts",
          sections: [{
             section: "Direct Contact Info",
             fields: [
                { fieldname: "email_addr", label: "Contact Email", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
                { fieldname: "phone_num", label: "Mobile Phone", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
             ]
          }]
       };
       
       vi.mocked(usePreOffer).mockReturnValue(defaultContext);
       render(<PreOfferFormStep tab={contactTab} stepKey="contact_test" />);
       
       fireEvent.change(screen.getByTestId("input-email_addr"), { target: { value: "not_an_email" } });
       fireEvent.change(screen.getByTestId("input-phone_num"), { target: { value: "123" } });
       
       fireEvent.blur(screen.getByTestId("input-email_addr"));
       fireEvent.blur(screen.getByTestId("input-phone_num"));
       fireEvent.click(screen.getByText("Next Step"));
       
       await waitFor(() => {
          expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
          expect(screen.getByText("Please enter a valid 10-digit mobile number")).toBeTruthy();
       });
    });

    it("triggers background state replication on throttle loop completion", () => {
       vi.useFakeTimers();
       vi.mocked(usePreOffer).mockReturnValue(defaultContext);
       
       render(<PreOfferFormStep tab={mockTab} stepKey="auto_save_test" />);
       
       fireEvent.change(screen.getByTestId("input-first_name"), { target: { value: "Diana" } });
       
       vi.advanceTimersByTime(200);
       expect(mockSetStepData).not.toHaveBeenCalledWith("auto_save_test", expect.any(Object));
       
       vi.advanceTimersByTime(400);
       expect(mockSetStepData).toHaveBeenCalledWith("auto_save_test", expect.objectContaining({ first_name: "Diana" }));
       
       vi.useRealTimers();
    });

    it("satisfies specialized container mappings when resolving image attachments", () => {
       const imageTab: PreOfferTab = {
          tab: "Photo",
          sections: [{
             section: "Visual Verify",
             fields: [
                { fieldname: "selfie", label: "Portrait Upload", fieldtype: "Attach Image", is_mandatory: 0, read_only: 0, hidden: 0 }
             ]
          }]
       };
       
       vi.mocked(usePreOffer).mockReturnValue(defaultContext);
       render(<PreOfferFormStep tab={imageTab} stepKey="image_test" />);
       
       expect(screen.getByTestId("file-upload")).toBeTruthy();
       expect(screen.getByText("Portrait Upload")).toBeTruthy();
     });
  });
});
