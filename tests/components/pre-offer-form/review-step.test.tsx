import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewStep } from "@/components/pre-offer-form/review-step";
import { usePreOffer, PreOfferContextType } from "@/lib/contexts/pre-offer-context";

vi.mock("@/lib/contexts/pre-offer-context", () => ({
  usePreOffer: vi.fn(),
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

  const getMockContext = (overrides = {}): PreOfferContextType => ({
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
    status: "Draft",
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

  it("renders incomplete steps warning and disables submit", () => {
    vi.mocked(usePreOffer).mockReturnValue(
      getMockContext({ completedSteps: new Set() })
    );
    render(<ReviewStep />);

    expect(screen.getByText("Please complete all steps before submitting.")).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    expect(submitBtn).toBeDisabled();

    const buttons = screen.getAllByRole("button", { name: "Personal Info" });
    const stepLink = buttons.find(b => b.className.includes("underline"));
    fireEvent.click(stepLink!);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("renders step tabs and allows expanding sections to see summary data", () => {
    vi.mocked(usePreOffer).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const accordionBtn = screen.getByRole("button", { name: /Personal Info/i });
    expect(accordionBtn).toBeTruthy();

    expect(screen.queryByText("Edit this section")).toBeNull();

    fireEvent.click(accordionBtn);

    expect(screen.getByText("First Name:")).toBeTruthy();
    expect(screen.getAllByText("John")[0]).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit this section" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Edit this section" }));
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("calls prevStep when Back button is clicked", () => {
    vi.mocked(usePreOffer).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);
    expect(mockPrevStep).toHaveBeenCalled();
  });

  it("handles standard successful submission flow after declaration acceptance", async () => {
    vi.mocked(usePreOffer).mockReturnValue(getMockContext());
    render(<ReviewStep />);

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    expect(submitBtn).not.toBeDisabled();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitAll).toHaveBeenCalled();
    });
  });

  it("displays server error message on submit failure", async () => {
    mockSubmitAll.mockRejectedValueOnce(new Error("Network Error occurred"));
    vi.mocked(usePreOffer).mockReturnValue(getMockContext());

    render(<ReviewStep />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /Submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Network Error occurred")).toBeTruthy();
    });
  });

  describe("Extended Workflow: Automations & Dynamic Summaries", () => {
    it("accurately renders dynamic count summaries for tabular record sets", () => {
       const tableContext = getMockContext({
          stepData: {
             experience: { work_history: [ { company: "A" }, { company: "B" } ] },
             references: { reference_table: [] }
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
       
       vi.mocked(usePreOffer).mockReturnValue(tableContext);
       render(<ReviewStep />);
       
       expect(screen.getByText("2 Jobs Added")).toBeTruthy();
       expect(screen.getByText("No Vouches Added")).toBeTruthy();
    });

    it("supports robust nested decomposition of child tabular field arrays in expansion", () => {
       const complexTableContext = getMockContext({
          completedSteps: new Set(["grid_tab"]),
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
                         { fieldname: "missingVal", label: "Blank Field", hidden: 0 },
                         { fieldname: "ignoreMe", label: "Ghost", hidden: 1 }
                      ]
                   }]
                }]
             }]
          }
       });

       vi.mocked(usePreOffer).mockReturnValue(complexTableContext);
       render(<ReviewStep />);

       fireEvent.click(screen.getByRole("button", { name: /Grid Tab/i }));

       expect(screen.getByText("Position:")).toBeTruthy();
       expect(screen.getByText("Director")).toBeTruthy();
       
       expect(screen.queryByText("Blank Field:")).toBeNull();
       expect(screen.queryByText("Ghost:")).toBeNull();
    });

    it("displays definitive void state when expansion uncovers an empty target table", () => {
       const vacantContext = getMockContext({
          completedSteps: new Set(["empty_container"]),
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
       
       vi.mocked(usePreOffer).mockReturnValue(vacantContext);
       render(<ReviewStep />);
       
       fireEvent.click(screen.getByRole("button", { name: /Empty Container/i }));
       
       expect(screen.getByText("No Sub List added")).toBeTruthy();
    });
  });
});
