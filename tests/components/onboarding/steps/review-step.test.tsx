import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewStep } from "@/components/onboarding/steps/review-step";
import { useOnboarding, OnboardingContextType } from "@/lib/contexts/onboarding-context";

vi.mock("@/lib/contexts/onboarding-context", () => ({
  useOnboarding: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("ReviewStep", () => {
  const mockSubmitAll = vi.fn();
  const mockPrevStep = vi.fn();
  const mockGoToStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const getMockContext = (overrides = {}): OnboardingContextType => ({
    currentStep: 0,
    stepData: {
      personal_info: {
        first_name: "John",
      },
    },
    completedSteps: new Set(["personal_info"]),
    isDirty: false,
    isLoading: false,
    isError: false,
    isSaving: false,
    status: "draft",
    setStepData: vi.fn(),
    goToStep: mockGoToStep,
    nextStep: vi.fn(),
    prevStep: mockPrevStep,
    markStepComplete: vi.fn(),
    submitAll: mockSubmitAll,
    getFieldValue: vi.fn(),
    formConfig: {
      applicantId: "test-id",
      status: "Pending",
      tabs: [
        {
          tab: "Personal Info",
          sections: [
            {
              section: "Basic Details",
              fields: [{ fieldname: "first_name", label: "First Name", fieldtype: "Data", hidden: 0, is_mandatory: 0, read_only: 0 }],
            },
          ],
        },
      ],
    },
    ...overrides,
  });

  it("renders success state when submitted", () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext({ status: "submitted" }));
    render(<ReviewStep />);

    expect(screen.getByText("Onboarding Submitted!")).toBeTruthy();
    expect(screen.getByText(/Your onboarding information has been submitted successfully/)).toBeTruthy();
  });

  it("renders incomplete steps warning and disables submit", () => {
    vi.mocked(useOnboarding).mockReturnValue(
      getMockContext({ completedSteps: new Set() }) // Personal Info is incomplete
    );
    render(<ReviewStep />);

    expect(screen.getByText("Please complete all steps before submitting.")).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    expect(submitBtn).toBeDisabled();

    // Clicking the incomplete step link should call goToStep.
    // There are two buttons with Personal Info text: Accordion and the Missing Step link.
    const buttons = screen.getAllByRole("button", { name: "Personal Info" });
    const stepLink = buttons.find(b => b.className.includes("underline"));
    fireEvent.click(stepLink!);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("renders step tabs and allows expanding sections to see summary data", () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const accordionBtn = screen.getByRole("button", { name: /Personal Info/i });
    expect(accordionBtn).toBeTruthy();

    // Expanded data shouldn't be visible initially in the details block
    expect(screen.queryByText("Edit this section")).toBeNull();

    // Click to expand
    fireEvent.click(accordionBtn);

    // After expanding, we should see the values
    expect(screen.getByText("First Name:")).toBeTruthy();
    expect(screen.getAllByText("John")[0]).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit this section" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Edit this section" }));
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("calls prevStep when Back button is clicked", () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);
    expect(mockPrevStep).toHaveBeenCalled();
  });

  it("handles standard successful submission flow after declaration acceptance", async () => {
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    expect(submitBtn).not.toBeDisabled();

    // Check the declaration checkbox (required)
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitAll).toHaveBeenCalled();
    });
  });

  it("displays server error message on submit failure", async () => {
    mockSubmitAll.mockRejectedValueOnce(new Error("Network Error occurred"));
    vi.mocked(useOnboarding).mockReturnValue(getMockContext());

    render(<ReviewStep />);

    // Check the declaration checkbox (required)
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Network Error occurred")).toBeTruthy();
    });
  });

  describe("Extended Workflow: Automations & Dynamic Summaries", () => {
    it("triggers auto-redirect timer when initial state is submitted", () => {
       // Exercise Line 61-66 timer redirect
       vi.useFakeTimers();
       vi.mocked(useOnboarding).mockReturnValue(getMockContext({ status: "submitted" }));
       
       render(<ReviewStep />);
       
       // Advance partial time to ensure it hasn't executed prematurely
       vi.advanceTimersByTime(1000);
       expect(mockPush).not.toHaveBeenCalled();
       
       // Complete 3000ms threshold
       vi.advanceTimersByTime(2000);
       expect(mockPush).toHaveBeenCalledWith("/dashboard");
       
       vi.useRealTimers();
    });

    it("navigates successfully when explicit dashboard button is clicked in success view", () => {
       // Exercise Line 117 manual click route
       vi.mocked(useOnboarding).mockReturnValue(getMockContext({ status: "submitted" }));
       render(<ReviewStep />);
       
       const dashBtn = screen.getByRole("button", { name: "Go to Dashboard" });
       fireEvent.click(dashBtn);
       
       expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("accurately renders dynamic count summaries for tabular record sets", () => {
       // Target Line 139-143: Positive and Negative Count Evaluation
       const tableContext = getMockContext({
          stepData: {
             experience: { work_history: [ { company: "A" }, { company: "B" } ] },
             references: { reference_table: [] } // Empty set
          },
          formConfig: {
             tabs: [
                {
                   tab: "Experience",
                   sections: [{
                      fields: [{ fieldname: "work_history", label: "Jobs", fieldtype: "Table" }]
                   }]
                },
                {
                   tab: "References",
                   sections: [{
                      fields: [{ fieldname: "reference_table", label: "Vouches", fieldtype: "Table" }]
                   }]
                }
             ]
          }
       });
       
       vi.mocked(useOnboarding).mockReturnValue(tableContext);
       render(<ReviewStep />);
       
       // Verifies Line 141 logic: count aggregation
       expect(screen.getByText("2 Jobs Added")).toBeTruthy();
       // Verifies Line 143 logic: fallback none added
       expect(screen.getByText("No Vouches Added")).toBeTruthy();
    });

    it("supports robust nested decomposition of child tabular field arrays in expansion", () => {
       // Target Line 236-248: Grid renders, missing value drops, hidden field filters
       const complexTableContext = getMockContext({
          completedSteps: new Set(["grid_tab"]), // Suppress duplicate warning links
          stepData: {
             grid_tab: {
                details: [
                   { title: "Director", salary: "100k", ignoreMe: "skip" }
                ]
             }
          },
          formConfig: {
             tabs: [{
                tab: "Grid Tab",
                sections: [{
                   section: "Recursive Set",
                   fields: [{
                      fieldname: "details",
                      label: "Details List",
                      fieldtype: "Table",
                      child_fields: [
                         { fieldname: "title", label: "Position", hidden: 0 },
                         { fieldname: "salary", label: "Payout", hidden: 0 },
                         { fieldname: "missingVal", label: "Blank Field", hidden: 0 }, // Triggers !cVal on Line 247
                         { fieldname: "ignoreMe", label: "Ghost", hidden: 1 } // Triggers cf.hidden on Line 247
                      ]
                   }]
                }]
             }]
          }
       });

       vi.mocked(useOnboarding).mockReturnValue(complexTableContext);
       render(<ReviewStep />);

       // Expand accordion
       fireEvent.click(screen.getByRole("button", { name: /Grid Tab/i }));

       // Validates Line 244 and 250 render loop
       expect(screen.getByText("Item #1")).toBeTruthy();
       expect(screen.getByText("Position:")).toBeTruthy();
       expect(screen.getByText("Director")).toBeTruthy();
       
       // Verify Line 247 exclusions operated correctly
       expect(screen.queryByText("Blank Field:")).toBeNull();
       expect(screen.queryByText("Ghost:")).toBeNull();
    });

    it("displays definitive void state when expansion uncovers an empty target table", () => {
       // Target Line 238 edge case: Table renders but is explicitly vacant or non-array
       const vacantContext = getMockContext({
          completedSteps: new Set(["empty_container"]), // Suppress duplicate warning links
          stepData: { empty_container: { missing_list: null } },
          formConfig: {
             tabs: [{
                tab: "Empty Container",
                sections: [{
                   fields: [{ fieldname: "missing_list", label: "Sub List", fieldtype: "Table" }]
                }]
             }]
          }
       });
       
       vi.mocked(useOnboarding).mockReturnValue(vacantContext);
       render(<ReviewStep />);
       
       fireEvent.click(screen.getByRole("button", { name: /Empty Container/i }));
       
       // Line 238 text assertion
       expect(screen.getByText("No Sub List added")).toBeTruthy();
    });
  });
});
