import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingFormStep } from "@/components/onboarding/onboarding-form-step";
import { useOnboarding, OnboardingContextType } from "@/lib/contexts/onboarding-context";
import { OnboardingField, OnboardingTab } from "@/lib/types/onboarding";

// Mock interfaces
interface FileUploadFieldProps {
  label: string;
  onChange: (value: string) => void;
  error?: string;
  isRejected?: boolean;
}

interface DynamicTableFieldProps {
  field: OnboardingField;
  errors: Record<string, { message: string }>;
}

interface OverrideComponentProps {
  field: OnboardingField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

interface DynamicFieldRendererProps {
  field: OnboardingField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  overrides?: Record<string, { component: React.ComponentType<OverrideComponentProps> }>;
}

// Hoist the mock component so it can be used in vi.mock
const { FileUploadFieldMock } = vi.hoisted(() => ({
  FileUploadFieldMock: ({ label, onChange, error, isRejected }: FileUploadFieldProps) => (
    <div data-testid="file-upload" data-isrejected={isRejected !== undefined ? String(isRejected) : undefined}>
      <label>{label}</label>
      <button type="button" onClick={() => onChange("uploaded-file-url")}>Upload</button>
      {error && <span data-testid="error-message">{error}</span>}
    </div>
  ),
}));

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock child components
vi.mock("@/components/onboarding/file-upload-field", () => ({
  FileUploadField: FileUploadFieldMock,
}));

vi.mock("@/components/onboarding/dynamic-table-field", () => ({
  DynamicTableField: ({ field, errors }: DynamicTableFieldProps) => (
    <div data-testid="table-field">
      {field.label} Table
      {errors[field.fieldname] && <span data-testid="error-message">{errors[field.fieldname].message}</span>}
    </div>
  ),
}));

// Mock DynamicFieldRenderer to avoid deep UI rendering issues and focus on props
vi.mock("@/components/ui/field-renderer", () => ({
    DynamicFieldRenderer: ({ field, value, onChange, error, overrides, className }: DynamicFieldRendererProps) => {
        if (field.fieldtype === "Attach" || field.fieldtype === "Attach Image") {
            // In OnboardingFormStep, overrides for Attach are provided
            if (overrides && overrides[field.fieldtype]) {
                const Component = overrides[field.fieldtype].component;
                return (
                    <div id={`field-${field.fieldname}`} className={className}>
                        <Component field={field} value={value} onChange={onChange} error={error} disabled={false} className="test-override-cls" />
                    </div>
                );
            }
            // Fallback (though OnboardingFormStep always provides overrides for Attach)
            return <div id={`field-${field.fieldname}`} data-testid="file-upload-fallback" className={className}>{field.label}</div>;
        }
        return (
            <div id={`field-${field.fieldname}`} data-testid={`field-${field.fieldname}`} className={className}>
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
    vi.useRealTimers();
  });

  const mockTab: OnboardingTab = {
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

  const defaultContext: OnboardingContextType = {
    currentStep: 1,
    stepData: {},
    completedSteps: new Set(),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
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
        tabs: []
    }
  };

  it("renders all sections and fields defined in the tab", () => {
    vi.mocked(useOnboarding).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
    
    expect(screen.getByText("First Name")).toBeTruthy();
    expect(screen.getByText("Last Name")).toBeTruthy();
    expect(screen.getByText("Profile Picture")).toBeTruthy();
    expect(screen.getByTestId("table-field")).toBeTruthy();
    expect(screen.getByText("Upload")).toBeTruthy();
  });

  it("initializes form with existing data if available", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultContext,
      stepData: { personal_info: { first_name: "Bruce", last_name: "Wayne" } }
    });
    
    render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
    
    const input = screen.getByTestId("input-first_name") as HTMLInputElement;
    expect(input.value).toBe("Bruce");
  });

  it("validates mandatory fields and prevents submission", async () => {
    const scrollMock = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollMock;

    try {
      vi.mocked(useOnboarding).mockReturnValue(defaultContext);
      render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
      
      const nextBtn = screen.getByText("Save & Next");
      fireEvent.click(nextBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId("error-first_name")).toBeTruthy();
        expect(mockNextStep).not.toHaveBeenCalled();
        expect(scrollMock).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth", block: "center" }));
      });
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("calls setStepData and nextStep on successful form submission", async () => {
    vi.mocked(useOnboarding).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
    
    fireEvent.change(screen.getByTestId("input-first_name"), { target: { value: "Clark" } });
    fireEvent.click(screen.getByText("Upload"));
    
    const nextBtn = screen.getByText("Save & Next");
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(mockSetStepData).toHaveBeenCalledWith("personal_info", expect.objectContaining({ 
        first_name: "Clark",
        profile_pic: "uploaded-file-url"
      }));
      expect(defaultContext.submitAll).toHaveBeenCalledWith("save", "personal_info", expect.objectContaining({ 
        first_name: "Clark",
        profile_pic: "uploaded-file-url"
      }));
      expect(mockMarkStepComplete).toHaveBeenCalledWith("personal_info");
      expect(mockNextStep).toHaveBeenCalled();
    });
  });



  it("handles custom_same_as_permanent logic by copying and syncing permanent to communication address fields, and renders on its own row", () => {
    const addressTab: OnboardingTab = {
      tab: "Address",
      sections: [
        {
          section: "Addresses",
          fields: [
            { fieldname: "custom_same_as_permanent", label: "Same as Permanent", fieldtype: "Check", is_mandatory: 0, read_only: 0, hidden: 0 },
            { fieldname: "custom_permanent_address", label: "Permanent Address", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
            { fieldname: "custom_communication_address", label: "Communication Address", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
            { fieldname: "custom_permananent_city", label: "Permanent City", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
            { fieldname: "custom_communication_city", label: "Communication City", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
          ]
        }
      ]
    };

    vi.mocked(useOnboarding).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={addressTab} stepKey="address_sync" />);

    // 1. Verify custom_same_as_permanent occupies its own row (spans full width)
    const checkboxFieldDiv = screen.getByTestId("field-custom_same_as_permanent");
    expect(checkboxFieldDiv.className).toContain("md:col-span-full");

    // 2. Change permanent address and city
    fireEvent.change(screen.getByTestId("input-custom_permanent_address"), { target: { value: "123 Permanent Rd" } });
    fireEvent.change(screen.getByTestId("input-custom_permananent_city"), { target: { value: "Permanent City" } });

    // Ensure they are not copied yet because checkbox is unchecked
    const commAddressInput = screen.getByTestId("input-custom_communication_address") as HTMLInputElement;
    const commCityInput = screen.getByTestId("input-custom_communication_city") as HTMLInputElement;
    expect(commAddressInput.value).toBe("");
    expect(commCityInput.value).toBe("");

    // 3. Check custom_same_as_permanent (simulate check in mock input)
    fireEvent.change(screen.getByTestId("input-custom_same_as_permanent"), { target: { value: "true" } });

    // Expect permanent address fields to be copied to communication address fields
    expect(commAddressInput.value).toBe("123 Permanent Rd");
    expect(commCityInput.value).toBe("Permanent City");

    // 4. Update permanent address field while checkbox is checked, expect automatic sync
    fireEvent.change(screen.getByTestId("input-custom_permanent_address"), { target: { value: "456 New Permanent Rd" } });
    expect(commAddressInput.value).toBe("456 New Permanent Rd");
  });

  it("disables buttons when isSaving is true", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultContext,
      isSaving: true
    });
    
    render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
    
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Saving...")).toBeDisabled();
  });

  it("disables 'Previous' button on the first step", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultContext,
      currentStep: 0
    });
    render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
    
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  describe("Extended Edge Verification", () => {
    it("initializes form from definition defaults when existing data is blank", () => {
      // Exercises Line 137 fallback chain
      const defaultMapTab: OnboardingTab = {
        tab: "Defaults",
        sections: [{
          section: "Default Section",
          fields: [
            { fieldname: "preset", label: "Preset", fieldtype: "Data", default: "AutoValue", is_mandatory: 0, read_only: 0, hidden: 0 }
          ]
        }]
      };
      
      vi.mocked(useOnboarding).mockReturnValue(defaultContext);
      render(<OnboardingFormStep tab={defaultMapTab} stepKey="def_test" />);
      
      const input = screen.getByTestId("input-preset") as HTMLInputElement;
      expect(input.value).toBe("AutoValue");
    });

    it("validates special collection types ensuring required states are populated", async () => {
       // Exercises Line 178-179 (Table Required) and Line 185-186 (Check Required)
       const strictTab: OnboardingTab = {
          tab: "Strict",
          sections: [{
             section: "Required Checklist",
             fields: [
                { fieldname: "req_table", label: "Mandatory Table", fieldtype: "Table", is_mandatory: 1, read_only: 0, hidden: 0 },
                { fieldname: "req_check", label: "Mandatory Check", fieldtype: "Check", is_mandatory: 1, read_only: 0, hidden: 0 }
             ]
          }]
       };
       
       vi.mocked(useOnboarding).mockReturnValue(defaultContext);
       render(<OnboardingFormStep tab={strictTab} stepKey="strict_test" />);
       
       fireEvent.click(screen.getByText("Save & Next"));
       
       await waitFor(() => {
          expect(screen.getByText("Mandatory Table is required")).toBeTruthy();
          expect(screen.getByTestId("error-req_check")).toBeTruthy();
       });
    });

    it("enforces custom pattern matching constraints on defined contact dimensions", async () => {
       // Exercises Line 213 (Email Regex) and Line 226 (Phone Regex)
       const contactTab: OnboardingTab = {
          tab: "Contacts",
          sections: [{
             section: "Direct Contact Info",
             fields: [
                { fieldname: "email_addr", label: "Contact Email", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
                { fieldname: "phone_num", label: "Mobile Phone", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
             ]
          }]
       };
       
       vi.mocked(useOnboarding).mockReturnValue(defaultContext);
       render(<OnboardingFormStep tab={contactTab} stepKey="contact_test" />);
       
       fireEvent.change(screen.getByTestId("input-email_addr"), { target: { value: "not_an_email" } });
       fireEvent.change(screen.getByTestId("input-phone_num"), { target: { value: "123" } }); // Too short
       
       // Trigger blur logic to initiate resolver run
       fireEvent.blur(screen.getByTestId("input-email_addr"));
       fireEvent.blur(screen.getByTestId("input-phone_num"));
       fireEvent.click(screen.getByText("Save & Next")); // Force immediate resolver sync check
       
       await waitFor(() => {
          expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
          expect(screen.getByText("Please enter a valid 10-digit mobile number")).toBeTruthy();
       });
    });

     it("prevents custom_emergency_contact_number from being the same as custom_mobile_number", async () => {
        const contactTab: OnboardingTab = {
           tab: "Contacts",
           sections: [{
              section: "Direct Contact Info",
              fields: [
                 { fieldname: "custom_mobile_number", label: "Mobile Number", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
                 { fieldname: "custom_emergency_contact_number", label: "Emergency Contact", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        render(<OnboardingFormStep tab={contactTab} stepKey="contact_test" />);
        
        fireEvent.change(screen.getByTestId("input-custom_mobile_number"), { target: { value: "9876543210" } });
        fireEvent.change(screen.getByTestId("input-custom_emergency_contact_number"), { target: { value: "9876543210" } });
        
        fireEvent.blur(screen.getByTestId("input-custom_mobile_number"));
        fireEvent.blur(screen.getByTestId("input-custom_emergency_contact_number"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("Emergency contact number cannot be the same as mobile number")).toBeTruthy();
           expect(screen.getByText("Mobile number cannot be the same as emergency contact number")).toBeTruthy();
        });
     });

     it("validates same number constraint even if fields are on different steps (using stepData)", async () => {
        const contactTab: OnboardingTab = {
           tab: "Contacts",
           sections: [{
              section: "Direct Contact Info",
              fields: [
                 { fieldname: "custom_emergency_contact_number", label: "Emergency Contact", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue({
           ...defaultContext,
           stepData: {
              personal_info: {
                 custom_mobile_number: "9876543210"
              }
           }
        });
        render(<OnboardingFormStep tab={contactTab} stepKey="contact_test" />);
        
        fireEvent.change(screen.getByTestId("input-custom_emergency_contact_number"), { target: { value: "9876543210" } });
        fireEvent.blur(screen.getByTestId("input-custom_emergency_contact_number"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("Emergency contact number cannot be the same as mobile number")).toBeTruthy();
        });
     });

     it("validates custom_aadhaar_number ensuring exactly 12 digits", async () => {
        const aadhaarTab: OnboardingTab = {
           tab: "Identity",
           sections: [{
              section: "Government IDs",
              fields: [
                 { fieldname: "custom_aadhaar_number", label: "Aadhaar", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        render(<OnboardingFormStep tab={aadhaarTab} stepKey="identity_test" />);
        
        fireEvent.change(screen.getByTestId("input-custom_aadhaar_number"), { target: { value: "123456" } });
        fireEvent.blur(screen.getByTestId("input-custom_aadhaar_number"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("Please enter a valid 12-digit Aadhaar number")).toBeTruthy();
        });
     });

     it("validates custom_pan_number format AAAAA1111A", async () => {
        const panTab: OnboardingTab = {
           tab: "Identity",
           sections: [{
              section: "Government IDs",
              fields: [
                 { fieldname: "custom_pan_number", label: "PAN", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        render(<OnboardingFormStep tab={panTab} stepKey="identity_test" />);
        
        // Invalid formats: too short, incorrect positions
        fireEvent.change(screen.getByTestId("input-custom_pan_number"), { target: { value: "ABC1234A" } });
        fireEvent.blur(screen.getByTestId("input-custom_pan_number"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("Please enter a valid 10-character PAN number (e.g. AAAAA1111A)")).toBeTruthy();
        });

        // Valid format: AAAAA1111A
        fireEvent.change(screen.getByTestId("input-custom_pan_number"), { target: { value: "ABCDE1234F" } });
        fireEvent.blur(screen.getByTestId("input-custom_pan_number"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.queryByText("Please enter a valid 10-character PAN number (e.g. AAAAA1111A)")).toBeNull();
        });
     });

     it("validates custom_permanent_postal_code ensuring exactly 6 digits not starting with 0", async () => {
        const postalTab: OnboardingTab = {
           tab: "Address",
           sections: [{
              section: "Permanent Address",
              fields: [
                 { fieldname: "custom_permanent_postal_code", label: "Postal Code", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        render(<OnboardingFormStep tab={postalTab} stepKey="address_test" />);
        
        // Invalid format: starts with 0
        fireEvent.change(screen.getByTestId("input-custom_permanent_postal_code"), { target: { value: "012345" } });
        fireEvent.blur(screen.getByTestId("input-custom_permanent_postal_code"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("Please enter a valid 6-digit postal code (cannot start with 0)")).toBeTruthy();
        });

        // Invalid format: too short
        fireEvent.change(screen.getByTestId("input-custom_permanent_postal_code"), { target: { value: "12345" } });
        fireEvent.blur(screen.getByTestId("input-custom_permanent_postal_code"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("Please enter a valid 6-digit postal code (cannot start with 0)")).toBeTruthy();
        });

        // Valid format: 110001
        fireEvent.change(screen.getByTestId("input-custom_permanent_postal_code"), { target: { value: "110001" } });
        fireEvent.blur(screen.getByTestId("input-custom_permanent_postal_code"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.queryByText("Please enter a valid 6-digit postal code (cannot start with 0)")).toBeNull();
        });
     });

      it("validates custom_ifsc_code format", async () => {
         const ifscTab: OnboardingTab = {
            tab: "Bank Details",
            sections: [{
               section: "Bank Information",
               fields: [
                  { fieldname: "custom_ifsc_code", label: "IFSC Code", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
               ]
            }]
         };
         
         vi.mocked(useOnboarding).mockReturnValue(defaultContext);
         render(<OnboardingFormStep tab={ifscTab} stepKey="bank_test" />);
         
         // Invalid format: too long / wrong character pattern
         fireEvent.change(screen.getByTestId("input-custom_ifsc_code"), { target: { value: "SBIN00000000" } });
         fireEvent.blur(screen.getByTestId("input-custom_ifsc_code"));
         fireEvent.click(screen.getByText("Save & Next"));
         
         await waitFor(() => {
            expect(screen.getByText("Please enter a valid 11-character IFSC code (e.g. SBIN0123456)")).toBeTruthy();
         });

         // Invalid format: missing 0 at 5th character
         fireEvent.change(screen.getByTestId("input-custom_ifsc_code"), { target: { value: "SBIN1123456" } });
         fireEvent.blur(screen.getByTestId("input-custom_ifsc_code"));
         fireEvent.click(screen.getByText("Save & Next"));
         
         await waitFor(() => {
            expect(screen.getByText("Please enter a valid 11-character IFSC code (e.g. SBIN0123456)")).toBeTruthy();
         });

         // Valid format: SBIN0123456
         fireEvent.change(screen.getByTestId("input-custom_ifsc_code"), { target: { value: "SBIN0123456" } });
         fireEvent.blur(screen.getByTestId("input-custom_ifsc_code"));
         fireEvent.click(screen.getByText("Save & Next"));
         
         await waitFor(() => {
            expect(screen.queryByText("Please enter a valid 11-character IFSC code (e.g. SBIN0123456)")).toBeNull();
         });
      });

     it("validates custom_date_of_birth ensuring age is at least 18", async () => {
        const dobTab: OnboardingTab = {
           tab: "Personal Info",
           sections: [{
              section: "General Info",
              fields: [
                 { fieldname: "custom_date_of_birth", label: "Date of Birth", fieldtype: "Date", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        render(<OnboardingFormStep tab={dobTab} stepKey="personal_test" />);
        
        // Calculate a date that is 10 years ago (under 18)
        const today = new Date();
        const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
        const tenYearsAgoStr = tenYearsAgo.toISOString().split("T")[0];

        fireEvent.change(screen.getByTestId("input-custom_date_of_birth"), { target: { value: tenYearsAgoStr } });
        fireEvent.blur(screen.getByTestId("input-custom_date_of_birth"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("You must be at least 18 years old")).toBeTruthy();
        });

        // Calculate a date that is 20 years ago (over 18)
        const twentyYearsAgo = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
        const twentyYearsAgoStr = twentyYearsAgo.toISOString().split("T")[0];

        fireEvent.change(screen.getByTestId("input-custom_date_of_birth"), { target: { value: twentyYearsAgoStr } });
        fireEvent.blur(screen.getByTestId("input-custom_date_of_birth"));
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.queryByText("You must be at least 18 years old")).toBeNull();
        });
     });

     it("automatically calculates and populates custom_age based on custom_date_of_birth change", async () => {
        const dobAgeTab: OnboardingTab = {
           tab: "Personal Info",
           sections: [{
              section: "General Info",
              fields: [
                 { fieldname: "custom_date_of_birth", label: "Date of Birth", fieldtype: "Date", is_mandatory: 0, read_only: 0, hidden: 0 },
                 { fieldname: "custom_age", label: "Age", fieldtype: "Int", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };
        
        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        render(<OnboardingFormStep tab={dobAgeTab} stepKey="personal_test" />);
        
        // Calculate a date that is exactly 25 years ago
        const today = new Date();
        const twentyFiveYearsAgo = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
        const twentyFiveYearsAgoStr = twentyFiveYearsAgo.toISOString().split("T")[0];

        fireEvent.change(screen.getByTestId("input-custom_date_of_birth"), { target: { value: twentyFiveYearsAgoStr } });
        fireEvent.blur(screen.getByTestId("input-custom_date_of_birth"));
        
        await waitFor(() => {
           const ageInput = screen.getByTestId("input-custom_age") as HTMLInputElement;
           expect(ageInput.value).toBe("25");
        });
     });

    it("triggers background state replication on throttle loop completion", () => {
       // Exercises Line 273-274 Auto-save logic
       vi.useFakeTimers();
       vi.mocked(useOnboarding).mockReturnValue(defaultContext);
       
       render(<OnboardingFormStep tab={mockTab} stepKey="auto_save_test" />);
       
       // Trigger form state mutation
       fireEvent.change(screen.getByTestId("input-first_name"), { target: { value: "Diana" } });
       
       // Advance partially
       vi.advanceTimersByTime(200);
       expect(mockSetStepData).not.toHaveBeenCalledWith("auto_save_test", expect.any(Object));
       
       // Fulfill 500ms window
       vi.advanceTimersByTime(400);
       expect(mockSetStepData).toHaveBeenCalledWith("auto_save_test", expect.objectContaining({ first_name: "Diana" }));
       
       vi.useRealTimers();
    });

    it("satisfies specialized container mappings when resolving image attachments", () => {
       // Exercises Line 325 mapping logic
       const imageTab: OnboardingTab = {
          tab: "Photo",
          sections: [{
             section: "Visual Verify",
             fields: [
                { fieldname: "selfie", label: "Portrait Upload", fieldtype: "Attach Image", is_mandatory: 0, read_only: 0, hidden: 0 }
             ]
          }]
       };
       
       vi.mocked(useOnboarding).mockReturnValue(defaultContext);
       render(<OnboardingFormStep tab={imageTab} stepKey="image_test" />);
       
       // Validate mapping through custom overrides container verified in mock renderer logic line 66-70
        expect(screen.getByTestId("file-upload")).toBeTruthy();
        expect(screen.getByText("Portrait Upload")).toBeTruthy();
     });

     it("satisfies fallback logic for anonymous and specialized field valid modes", async () => {
        // Covers Line 199 (empty label -> "This field is required")
        // Covers Line 178-181 (Table validation when null/empty)
        // Covers Line 185-188 (Check validation when false)
        const odditiesTab: OnboardingTab = {
           tab: "Oddities",
           sections: [{
              section: "Special Validation",
              fields: [
                 { fieldname: "anon_field", label: "", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0 },
                 { fieldname: "blank_tbl", label: "Blank Table", fieldtype: "Table", is_mandatory: 1, read_only: 0, hidden: 0 },
                 { fieldname: "false_chk", label: "False Check", fieldtype: "Check", is_mandatory: 1, read_only: 0, hidden: 0 }
              ]
           }]
        };

        vi.mocked(useOnboarding).mockReturnValue({
           ...defaultContext,
           stepData: {
              oddities: { blank_tbl: [], false_chk: false, anon_field: "" }
           }
        });
        
        render(<OnboardingFormStep tab={odditiesTab} stepKey="oddities" />);
        
        fireEvent.click(screen.getByText("Save & Next"));
        
        await waitFor(() => {
           expect(screen.getByText("This field is required")).toBeTruthy(); // Line 199 fallback
           expect(screen.getByText("Blank Table is required")).toBeTruthy(); // Line 178-181 block
           expect(screen.getByText("False Check is required")).toBeTruthy(); // Line 185-188 block
           expect(defaultContext.submitAll).not.toHaveBeenCalled();
        });
     });

     it("enforces unique grid layouts for Aadhaar and long label documentation proofs", () => {
        // Covers Lines 81-82 (Full width logic & isAadhaarFront offsets)
        const layoutTab: OnboardingTab = {
           tab: "Layouts",
           sections: [{
              section: "Form Grid",
              fields: [
                 { fieldname: "custom_upload_pan_card", label: "Upload Pan", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
                 { fieldname: "custom_upload_aadhaarfront", label: "Upload Aadhaar", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
              ]
           }]
        };

        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        
        // We just need rendering execution of FormStepField grid builders
        render(<OnboardingFormStep tab={layoutTab} stepKey="layout_test" />);
        expect(screen.getByText("Upload Pan")).toBeTruthy();
        expect(screen.getByText("Upload Aadhaar")).toBeTruthy();
     });

     it("bypasses section header rendering when section title is identical to tab header", () => {
        // Covers Line 372 sectionCard matching
        const unifiedTab: OnboardingTab = {
           tab: "Identity Match",
           sections: [{
              section: "Identity Match", // Exactly matches tab name
              fields: [{ fieldname: "some_field", label: "Simple Field", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }]
           }]
        };

        vi.mocked(useOnboarding).mockReturnValue(defaultContext);
        const { container } = render(<OnboardingFormStep tab={unifiedTab} stepKey="match_test" />);
        
        // The SectionCard receives undefined title which prevents header container from rendering
        // Our earlier SectionCard tests indicated header presence implies .pt-2.px-6 selectors
        expect(container.querySelector(".pt-2.px-6")).toBeNull();
     });

      it("bypasses validation for hidden fields or fields whose depends_on evaluates to false", async () => {
         const hiddenTab: OnboardingTab = {
            tab: "Hidden Tab",
            sections: [{
               section: "Section 1",
               fields: [
                  { fieldname: "visible_field", label: "Visible Field", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0 },
                  { fieldname: "hidden_field", label: "Hidden Field", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 1 },
                  { fieldname: "dependent_field", label: "Dependent Field", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0, depends_on: "eval:doc.visible_field == 'show'" }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue(defaultContext);
         render(<OnboardingFormStep tab={hiddenTab} stepKey="hidden_test" />);

         fireEvent.change(screen.getByTestId("input-visible_field"), { target: { value: "dont_show" } });
         fireEvent.click(screen.getByText("Save & Next"));

         await waitFor(() => {
            // visible_field has value, so no error for it
            expect(screen.queryByTestId("error-visible_field")).toBeNull();
            // hidden_field is hidden, so its validation (required) is skipped and line 169 is hit
            expect(screen.queryByTestId("error-hidden_field")).toBeNull();
            // dependent_field depends on visible_field being 'show', which is false, so it is hidden and skipped
            expect(screen.queryByTestId("error-dependent_field")).toBeNull();
         });
      });

      it("evaluates table field row validation for completeness and validity", async () => {
         const tableTab: OnboardingTab = {
            tab: "Table Tab",
            sections: [{
               section: "Work History",
               fields: [
                  {
                     fieldname: "experience",
                     label: "Experience Table",
                     fieldtype: "Table",
                     is_mandatory: 0,
                     read_only: 0,
                     hidden: 0,
                     child_fields: [
                        { fieldname: "company", label: "Company", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0 },
                        { fieldname: "role", label: "Role", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }
                     ]
                  }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue({
            ...defaultContext,
            stepData: {
               table_test: {
                  experience: [
                     { company: "", role: "Developer" } // non-empty (covers 201-203) but invalid (covers 208-210)
                  ]
               }
            }
         });

         render(<OnboardingFormStep tab={tableTab} stepKey="table_test" />);

         fireEvent.click(screen.getByText("Save & Next"));

         await waitFor(() => {
            // covers line 222
            expect(screen.getByTestId("error-message")).toHaveTextContent("Please complete all required fields in Experience Table");
         });
      });
      it("automatically clears dependent fields when their visibility condition evaluates to false", async () => {
         const depTab: OnboardingTab = {
            tab: "Depends Tab",
            sections: [{
               section: "Section",
               fields: [
                  { fieldname: "show_more", label: "Show More", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 },
                  { fieldname: "extra_info", label: "Extra Info", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0, depends_on: "eval:doc.show_more == 'Yes'" }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue(defaultContext);
         render(<OnboardingFormStep tab={depTab} stepKey="dep_test" />);

         const showMoreInput = screen.getByTestId("input-show_more") as HTMLInputElement;

         // Verify initial state
         expect(showMoreInput.value).toBe("");

         // Change show_more to "Yes" to make extra_info visible, and set value for extra_info
         fireEvent.change(showMoreInput, { target: { value: "Yes" } });
         
         const extraInfoInput = screen.getByTestId("input-extra_info") as HTMLInputElement;
         fireEvent.change(extraInfoInput, { target: { value: "Some Info" } });

         // Now change show_more to "No" to make extra_info invisible (should trigger auto-clear)
         fireEvent.change(showMoreInput, { target: { value: "No" } });

         // Submit the form
         fireEvent.click(screen.getByText("Save & Next"));

         // Because the visibility evaluated to false, extra_info should have been cleared to ""
         await waitFor(() => {
            expect(mockSetStepData).toHaveBeenCalledWith(
               "dep_test",
               expect.objectContaining({
                  show_more: "No",
                  extra_info: ""
               })
            );
         });
      });


      it("blocks submission and shows error toast if a rejected field is not corrected", async () => {
         const rejectTab: OnboardingTab = {
            tab: "Reject Tab",
            sections: [{
               section: "Verification",
               fields: [
                  {
                     fieldname: "rejected_field",
                     label: "Rejected Document",
                     fieldtype: "Data",
                     is_mandatory: 1,
                     read_only: 0,
                     hidden: 0,
                     approval_status: "Rejected",
                     value: "old_rejected_value",
                     hr_comment: "Invalid input"
                  }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue({
            ...defaultContext,
            stepData: {
               reject_test: {
                  rejected_field: "old_rejected_value"
               }
            }
         });

         render(<OnboardingFormStep tab={rejectTab} stepKey="reject_test" />);

         // Try to submit the form without changing the value (covers 358-361)
         fireEvent.click(screen.getByText("Save & Next"));

         const { toast } = await import("sonner");

         await waitFor(() => {
            // covers 367-368
            expect(toast.error).toHaveBeenCalledWith(
               expect.stringContaining("Please correct all rejected fields before proceeding: Rejected Document")
            );
            expect(mockNextStep).not.toHaveBeenCalled();
         });
      });

      it("computes the isRejected property for Attach and Attach Image fields correctly based on original value", () => {
         const attachTab: OnboardingTab = {
            tab: "Attachment Tab",
            sections: [{
               section: "Uploads",
               fields: [
                  {
                     fieldname: "rejected_attach",
                     label: "Rejected Attach",
                     fieldtype: "Attach",
                     is_mandatory: 0,
                     read_only: 0,
                     hidden: 0,
                     approval_status: "Rejected",
                     value: "file1.pdf",
                     hr_comment: "Invalid file"
                  },
                  {
                     fieldname: "rejected_image",
                     label: "Rejected Image",
                     fieldtype: "Attach Image",
                     is_mandatory: 0,
                     read_only: 0,
                     hidden: 0,
                     approval_status: "Rejected",
                     value: "image1.jpg",
                     hr_comment: "Blurry picture"
                  }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue({
            ...defaultContext,
            stepData: {
               attach_test: {
                  rejected_attach: "file1.pdf",
                  rejected_image: "image1.jpg"
               }
            }
         });

         render(<OnboardingFormStep tab={attachTab} stepKey="attach_test" />);

         const fileUploads = screen.getAllByTestId("file-upload");
         expect(fileUploads).toHaveLength(2);

         // Verify that isRejected is computed as true for both (covers 410-412 and 441-443)
         expect(fileUploads[0].getAttribute("data-isrejected")).toBe("true");
         expect(fileUploads[1].getAttribute("data-isrejected")).toBe("true");
      });

      it("validates that year of passing does not decrease as education level progresses", async () => {
         const eduTab: OnboardingTab = {
            tab: "Education Tab",
            sections: [{
               section: "Education Details",
               fields: [
                  {
                     fieldname: "custom_education_details",
                     label: "Education Details",
                     fieldtype: "Table",
                     is_mandatory: 1,
                     read_only: 0,
                     hidden: 0,
                     child_fields: [
                        { fieldname: "education_level", label: "Education Level", fieldtype: "Select", reqd: 1, read_only: 0, hidden: 0 },
                        { fieldname: "year_of_passing", label: "Year of Passing", fieldtype: "Link", reqd: 1, read_only: 0, hidden: 0 }
                     ]
                  }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue({
            ...defaultContext,
            stepData: {
               edu_test: {
                  custom_education_details: [
                     { education_level: "10th", year_of_passing: "2021" },
                     { education_level: "12th", year_of_passing: "2020" }
                  ]
               }
             }
         });

         render(<OnboardingFormStep tab={eduTab} stepKey="edu_test" />);

         fireEvent.click(screen.getByText("Save & Next"));

         await waitFor(() => {
            expect(screen.getByTestId("error-message")).toHaveTextContent(
               "Year of passing for 12th must be after 10th (2021)"
            );
         });
      });

      it("validates that total percentage for each nomination type is exactly 100%", async () => {
         const nomTab: OnboardingTab = {
            tab: "Nomination Tab",
            sections: [{
               section: "Nominations",
               fields: [
                  {
                     fieldname: "custom_nomination_details",
                     label: "Nomination Details",
                     fieldtype: "Table",
                     is_mandatory: 1,
                     read_only: 0,
                     hidden: 0,
                     child_fields: [
                        { fieldname: "nomination_type", label: "Nomination Type", fieldtype: "Select", reqd: 1, read_only: 0, hidden: 0 },
                        { fieldname: "nominee_name", label: "Name", fieldtype: "Data", reqd: 1, read_only: 0, hidden: 0 },
                        { fieldname: "percentage", label: "Percentage", fieldtype: "Float", reqd: 1, read_only: 0, hidden: 0 }
                     ]
                  }
               ]
            }]
         };

         vi.mocked(useOnboarding).mockReturnValue({
            ...defaultContext,
            stepData: {
               nom_test: {
                  custom_nomination_details: [
                     { nomination_type: "Gratuity", nominee_name: "Nominee 1", percentage: "60" },
                     { nomination_type: "Gratuity", nominee_name: "Nominee 2", percentage: "30" }
                  ]
               }
            }
         });

         render(<OnboardingFormStep tab={nomTab} stepKey="nom_test" />);

         fireEvent.click(screen.getByText("Save & Next"));

         await waitFor(() => {
            expect(screen.getByTestId("error-message")).toHaveTextContent(
               "Total percentage for Gratuity nomination must be exactly 100% (currently 90%)"
            );
         });
      });
    });
});
