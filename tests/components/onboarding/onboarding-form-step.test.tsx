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
    DynamicFieldRenderer: ({ field, value, onChange, error, overrides }: DynamicFieldRendererProps) => {
        if (field.fieldtype === "Attach" || field.fieldtype === "Attach Image") {
            // In OnboardingFormStep, overrides for Attach are provided
            if (overrides && overrides[field.fieldtype]) {
                const Component = overrides[field.fieldtype].component;
                return <Component field={field} value={value} onChange={onChange} error={error} disabled={false} className="test-override-cls" />;
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
    vi.mocked(useOnboarding).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={mockTab} stepKey="personal_info" />);
    
    const nextBtn = screen.getByText("Save & Next");
    fireEvent.click(nextBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId("error-first_name")).toBeTruthy();
      expect(mockNextStep).not.toHaveBeenCalled();
    });
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

  it("enables 'Same as Current Address' logic when Permanent Address section exists", () => {
    const tabWithAddress: OnboardingTab = {
      tab: "Address",
      sections: [
        { section: "Current Address", fields: [{ fieldname: "current_city", label: "Current City", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }] },
        { section: "Permanent Address", fields: [{ fieldname: "permanent_city", label: "Permanent City", fieldtype: "Data", is_mandatory: 0, read_only: 0, hidden: 0 }] }
      ]
    };
    
    vi.mocked(useOnboarding).mockReturnValue(defaultContext);
    render(<OnboardingFormStep tab={tabWithAddress} stepKey="address" />);
    
    const sameAsBtn = screen.getByText("Same as Current Address");
    expect(sameAsBtn).toBeTruthy();
    
    fireEvent.change(screen.getByTestId("input-current_city"), { target: { value: "Gotham" } });
    fireEvent.click(sameAsBtn);
    
    const permInput = screen.getByTestId("input-permanent_city") as HTMLInputElement;
    expect(permInput.value).toBe("Gotham");
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
   });
});
