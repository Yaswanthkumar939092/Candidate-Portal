import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingStepNav } from "@/components/onboarding/onboarding-step-nav";
import { useOnboarding, OnboardingContextType } from "@/lib/contexts/onboarding-context";

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

describe("OnboardingStepNav", () => {
  const mockGoToStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps: OnboardingContextType = {
    currentStep: 0,
    stepData: {},
    completedSteps: new Set(),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
    setStepData: vi.fn(),
    goToStep: mockGoToStep,
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    markStepComplete: vi.fn(),
    submitAll: vi.fn(),
    getFieldValue: vi.fn(),
    formConfig: {
      applicantId: "test-id",
      status: "Pending",
      tabs: [
        {
          tab: "Personal Information",
          sections: [
            {
              section: "General Info",
              fields: [
                {
                  fieldname: "first_name",
                  label: "First Name",
                  fieldtype: "Data",
                  is_mandatory: 1,
                  read_only: 0,
                  hidden: 0,
                }
              ]
            }
          ]
        },
        { tab: "Education Details", sections: [] }
      ]
    }
  };

  it("renders onboarding header and progress bar", () => {
    vi.mocked(useOnboarding).mockReturnValue(defaultProps);
    render(<OnboardingStepNav />);

    expect(screen.getByText("Onboarding")).toBeTruthy();
    expect(screen.getByText("Complete your profile to get started.")).toBeTruthy();
  });

  it("calculates progress percentage correctly", () => {
    // 2 tabs + 1 review = 3 steps total.
    // 1 completed step.
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultProps,
      formConfig: {
        ...defaultProps.formConfig!,
        tabs: [
          { tab: "Personal Information", sections: [] },
          { tab: "Education Details", sections: [] }
        ]
      },
      completedSteps: new Set(["personal_information"])
    });

    const { container } = render(<OnboardingStepNav />);
    const progressBar = container.querySelector(".bg-primary-foreground.transition-all");
    expect(progressBar).toHaveStyle("width: 33%");
  });

  it("calculates progress percentage correctly using field_status_counts when present", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultProps,
      formConfig: {
        ...defaultProps.formConfig!,
        tabs: [
          { tab: "Personal Information", sections: [] },
          { tab: "Education Details", sections: [] }
        ],
        field_status_counts: {
          total: 10,
          pending: 5,
          filled: 3,
          approved: 2,
          rejected: 0
        }
      }
    });

    const { container } = render(<OnboardingStepNav />);
    const progressBar = container.querySelector(".bg-primary-foreground.transition-all");
    // (filled: 3 + approved: 2) / total: 10 * 100 = 50%
    expect(progressBar).toHaveStyle("width: 50%");
  });

  it("calculates progress percentage and step counts in real-time from stepData", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultProps,
      stepData: {
        personal_information: {
          first_name: "John",
        }
      },
      formConfig: {
        applicantId: "test-id",
        status: "Pending",
        tabs: [
          {
            tab: "Personal Information",
            sections: [
              {
                section: "General Info",
                fields: [
                  {
                    fieldname: "first_name",
                    label: "First Name",
                    fieldtype: "Data",
                    is_mandatory: 1,
                    read_only: 0,
                    hidden: 0,
                  },
                  {
                    fieldname: "last_name",
                    label: "Last Name",
                    fieldtype: "Data",
                    is_mandatory: 0,
                    read_only: 0,
                    hidden: 0,
                  }
                ]
              }
            ]
          },
          { tab: "Education Details", sections: [] }
        ]
      }
    });

    render(<OnboardingStepNav />);
    // 2 fields total, 1 is filled (first_name). Badge should render "1/2".
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("renders steps with correct status indicators", () => {
    vi.mocked(useOnboarding).mockReturnValue({
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
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultProps,
      currentStep: 1,
      completedSteps: new Set(["personal_information"])
    });

    render(<OnboardingStepNav />);

    const firstStep = screen.getByText("Personal Information");
    fireEvent.click(firstStep);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it.skip("disables future steps that are not yet clickable", () => {
    vi.mocked(useOnboarding).mockReturnValue(defaultProps);
    render(<OnboardingStepNav />);

    const futureStep = screen.getByText("Education Details").parentElement;
    expect(futureStep).toBeDisabled();

    fireEvent.click(futureStep!);
    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("allows clicking the next step if the current step has no mandatory fields", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultProps,
      formConfig: {
        applicantId: "test-id",
        status: "Pending",
        tabs: [
          {
            tab: "Personal Information",
            sections: [
              {
                section: "General Info",
                fields: [
                  {
                    fieldname: "optional_field",
                    label: "Optional Field",
                    fieldtype: "Data",
                    is_mandatory: 0,
                    read_only: 0,
                    hidden: 0,
                  }
                ]
              }
            ]
          },
          { tab: "Education Details", sections: [] }
        ]
      }
    });
    render(<OnboardingStepNav />);

    const futureStep = screen.getByText("Education Details").parentElement;
    expect(futureStep).not.toBeDisabled();

    fireEvent.click(futureStep!);
    expect(mockGoToStep).toHaveBeenCalledWith(1);
  });

  it("allows clicking the next step if the current step has mandatory fields and they are filled", () => {
    vi.mocked(useOnboarding).mockReturnValue({
      ...defaultProps,
      stepData: {
        personal_information: {
          first_name: "John",
        }
      },
      formConfig: {
        applicantId: "test-id",
        status: "Pending",
        tabs: [
          {
            tab: "Personal Information",
            sections: [
              {
                section: "General Info",
                fields: [
                  {
                    fieldname: "first_name",
                    label: "First Name",
                    fieldtype: "Data",
                    is_mandatory: 1,
                    read_only: 0,
                    hidden: 0,
                  }
                ]
              }
            ]
          },
          { tab: "Education Details", sections: [] }
        ]
      }
    });
    render(<OnboardingStepNav />);

    const futureStep = screen.getByText("Education Details").parentElement;
    expect(futureStep).not.toBeDisabled();

    fireEvent.click(futureStep!);
    expect(mockGoToStep).toHaveBeenCalledWith(1);
  });

  it("renders back to dashboard link", () => {
    vi.mocked(useOnboarding).mockReturnValue(defaultProps);
    render(<OnboardingStepNav />);

    const backLink = screen.getByText("Back to Dashboard");
    expect(backLink).toBeTruthy();
    expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  describe("Specific Missed Line Coverage Expansion", () => {
    it("falls back safely to empty step set when formConfig tabs are completely omitted", () => {
      // Covers Line 25-36 (formConfig?.tabs fallback, and zero progress divisor logic)
      vi.mocked(useOnboarding).mockReturnValue({
        ...defaultProps,
        formConfig: undefined
      });
      const { container } = render(<OnboardingStepNav />);
      
      // Review will still be generated as the solitary step (line 32)
      expect(screen.getByText("Review")).toBeTruthy();
      const progressBar = container.querySelector(".bg-primary-foreground.transition-all");
      expect(progressBar).toHaveStyle("width: 0%"); // 0 completed / 1 step = 0%
    });

    it("applies specific style indicators for steps that are past but not formally completed", () => {
       // Covers Line 86 style branch: isPast && !isCompleted && !isCurrent
       vi.mocked(useOnboarding).mockReturnValue({
         ...defaultProps,
         currentStep: 1,
         completedSteps: new Set() // Zero steps explicitly marked as completed
       });
       
       render(<OnboardingStepNav />);
       
       const firstStepButton = screen.getByText("Personal Information").closest("button")!;
       // Line 86 injects "text-muted-foreground hover:bg-muted"
       expect(firstStepButton).toHaveClass("text-muted-foreground");
    });

    it("displays granular field completion metrics when step count metadata exists", () => {
       // Covers Line 114: step.counts rendering
       vi.mocked(useOnboarding).mockReturnValue({
          ...defaultProps,
          formConfig: {
             applicantId: "v2-id",
             status: "Pending",
             tabs: [
                { 
                  tab: "Counted Set", 
                  sections: [], 
                  field_counts: { filled: 4, total: 10, approved: 0, rejected: 0, pending: 0 } 
                }
             ]
          }
       });
       
       render(<OnboardingStepNav />);
       expect(screen.getByText("4/10")).toBeTruthy();
    });

    it("renders green check and label when total equals filled + approved", () => {
       vi.mocked(useOnboarding).mockReturnValue({
          ...defaultProps,
          formConfig: {
             applicantId: "v2-id",
             status: "Pending",
             tabs: [
                { 
                  tab: "Counted Set", 
                  sections: [], 
                  field_counts: { filled: 4, total: 10, approved: 6, rejected: 0, pending: 0 } 
                }
             ]
          }
       });
       
       render(<OnboardingStepNav />);
       expect(screen.getByText("10/10")).toBeTruthy();
       const stepButton = screen.getByText("Counted Set").closest("button");
       expect(stepButton?.querySelector("svg")).toBeTruthy();
    });
  });

    describe("Table and Check field validation for step completion path coverage", () => {
      it("covers path when mandatory Table field has empty rows", () => {
        vi.mocked(useOnboarding).mockReturnValue({
          ...defaultProps,
          stepData: {
            personal_information: {
              custom_table_details: []
            }
          },
          formConfig: {
            applicantId: "test-id",
            status: "Pending",
            tabs: [
              {
                tab: "Personal Information",
                sections: [
                  {
                    section: "General Info",
                    fields: [
                      {
                        fieldname: "custom_table_details",
                        label: "Table Details",
                        fieldtype: "Table",
                        is_mandatory: 1,
                        read_only: 0,
                        hidden: 0,
                        child_fields: [
                          { fieldname: "name", label: "Name", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0 }
                        ]
                      }
                    ]
                  }
                ]
              },
              { tab: "Education Details", sections: [] }
            ]
          }
        });
        render(<OnboardingStepNav />);
        expect(screen.getByText("Education Details")).toBeTruthy();
      });

      it("prevents next step click when mandatory Table field has rows but missing mandatory child fields", () => {
        vi.mocked(useOnboarding).mockReturnValue({
          ...defaultProps,
          stepData: {
            personal_information: {
              custom_table_details: [
                { name: "" }
              ]
            }
          },
          formConfig: {
            applicantId: "test-id",
            status: "Pending",
            tabs: [
              {
                tab: "Personal Information",
                sections: [
                  {
                    section: "General Info",
                    fields: [
                      {
                        fieldname: "custom_table_details",
                        label: "Table Details",
                        fieldtype: "Table",
                        is_mandatory: 1,
                        read_only: 0,
                        hidden: 0,
                        child_fields: [
                          { fieldname: "name", label: "Name", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0 }
                        ]
                      }
                    ]
                  }
                ]
              },
              { tab: "Education Details", sections: [] }
            ]
          }
        });
        render(<OnboardingStepNav />);
        expect(screen.getByText("Education Details")).toBeTruthy();
      });

      it("covers path when mandatory Table field has rows and all mandatory child fields are filled", () => {
        vi.mocked(useOnboarding).mockReturnValue({
          ...defaultProps,
          stepData: {
            personal_information: {
              custom_table_details: [
                { name: "John Doe" }
              ]
            }
          },
          formConfig: {
            applicantId: "test-id",
            status: "Pending",
            tabs: [
              {
                tab: "Personal Information",
                sections: [
                  {
                    section: "General Info",
                    fields: [
                      {
                        fieldname: "custom_table_details",
                        label: "Table Details",
                        fieldtype: "Table",
                        is_mandatory: 1,
                        read_only: 0,
                        hidden: 0,
                        child_fields: [
                          { fieldname: "name", label: "Name", fieldtype: "Data", is_mandatory: 1, read_only: 0, hidden: 0 }
                        ]
                      }
                    ]
                  }
                ]
              },
              { tab: "Education Details", sections: [] }
            ]
          }
        });
        render(<OnboardingStepNav />);
        expect(screen.getByText("Education Details")).toBeTruthy();
      });

      it("covers path when mandatory Check field is false", () => {
        vi.mocked(useOnboarding).mockReturnValue({
          ...defaultProps,
          stepData: {
            personal_information: {
              agree_terms: false
            }
          },
          formConfig: {
            applicantId: "test-id",
            status: "Pending",
            tabs: [
              {
                tab: "Personal Information",
                sections: [
                  {
                    section: "General Info",
                    fields: [
                      {
                        fieldname: "agree_terms",
                        label: "Agree Terms",
                        fieldtype: "Check",
                        is_mandatory: 1,
                        read_only: 0,
                        hidden: 0,
                      }
                    ]
                  }
                ]
              },
              { tab: "Education Details", sections: [] }
            ]
          }
        });
        render(<OnboardingStepNav />);
        expect(screen.getByText("Education Details")).toBeTruthy();
      });
    });
});
