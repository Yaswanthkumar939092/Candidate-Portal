import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobApplicationReviewStep } from "@/components/jobs/job-applicant/job-application-review-step";
import { useJobApp } from "@/lib/contexts/job-application-context";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  useCreateJobApplicant,
  useDeleteDraftJobApplicant,
} from "@/lib/hooks/useJobOpening";
import { toast } from "sonner";

vi.mock("@/lib/contexts/job-application-context", () => ({
  useJobApp: vi.fn(),
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/hooks/useJobOpening", () => ({
  useCreateJobApplicant: vi.fn(),
  useDeleteDraftJobApplicant: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("JobApplicationReviewStep", () => {
  const user = userEvent.setup();
  const mockGoToStep = vi.fn();
  const mockOnPrev = vi.fn();
  const mockCreateApplicantMutate = vi.fn();
  const mockDeleteDraftMutate = vi.fn();

  const mockTabs = [
    {
      tab: "Personal Info",
      sections: [
        {
          section: "Basic Information",
          fields: [
            {
              fieldname: "full_name",
              label: "Full Name",
              fieldtype: "Data",
              hidden: 0,
            },
            {
              fieldname: "email",
              label: "Email Address",
              fieldtype: "Data",
              hidden: 0,
            },
            {
              fieldname: "hidden_field",
              label: "Hidden",
              fieldtype: "Data",
              hidden: 1,
            },
          ],
        },
      ],
    },
    {
      tab: "Work History",
      sections: [
        {
          section: "Employment details",
          fields: [
            {
              fieldname: "experience_table",
              label: "Experience",
              fieldtype: "Table",
              child_fields: [
                { fieldname: "company", label: "Company", hidden: 0 },
                { fieldname: "role", label: "Role", hidden: 0 },
                { fieldname: "secret", label: "Secret", hidden: 1 },
              ],
            },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "applicant@example.com" },
    } as any);
    vi.mocked(useCreateJobApplicant).mockReturnValue({
      mutate: mockCreateApplicantMutate,
      isPending: false,
    } as any);
    vi.mocked(useDeleteDraftJobApplicant).mockReturnValue({
      mutate: mockDeleteDraftMutate,
      isPending: false,
    } as any);
  });

  it("renders correctly with incomplete steps warning", () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {
        personal_info: { full_name: "John Doe", email: "john@example.com" },
        work_history: {},
      },
    } as any);

    // Only 'personal_info' is completed, 'work_history' is incomplete
    const completedSteps = new Set(["personal_info"]);

    render(
      <JobApplicationReviewStep
        completedSteps={completedSteps}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName="draft-456"
      />,
    );

    expect(
      screen.getByText("Please complete all steps before submitting."),
    ).toBeTruthy();
    const workHistoryBtn = screen.getByRole("button", { name: "Work History" });
    expect(workHistoryBtn).toBeTruthy();

    // Clicking incomplete step button navigates to it
    fireEvent.click(workHistoryBtn);
    expect(mockGoToStep).toHaveBeenCalledWith(1);
  });

  it("renders step tabs, toggle collapse/expand, and displays dynamic summaries", () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {
        personal_info: { full_name: "Jane Doe", email: "jane@example.com" },
        work_history: {
          experience_table: [
            { company: "Google", role: "SWE" },
            { company: "Apple", role: "Designer" },
          ],
        },
      },
    } as any);

    const completedSteps = new Set(["personal_info", "work_history"]);

    render(
      <JobApplicationReviewStep
        completedSteps={completedSteps}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    // No warning shown
    expect(
      screen.queryByText("Please complete all steps before submitting."),
    ).toBeNull();

    // Verify summaries
    expect(screen.getByText("Jane Doe jane@example.com")).toBeTruthy();
    expect(screen.getByText("2 Experience Added")).toBeTruthy();

    // Expand Personal Info tab
    const personalInfoTabHeader = screen.getByRole("button", {
      name: /Personal Info/,
    });
    fireEvent.click(personalInfoTabHeader);

    // Expanded details visible
    expect(screen.getByText("Basic Information")).toBeTruthy();
    expect(screen.getByText("Full Name:")).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("Email Address:")).toBeTruthy();
    expect(screen.getByText("jane@example.com")).toBeTruthy();
    // Hidden fields not visible
    expect(screen.queryByText("Hidden:")).toBeNull();

    // Click "Edit this section"
    const editBtn = screen.getByRole("button", { name: "Edit this section" });
    fireEvent.click(editBtn);
    expect(mockGoToStep).toHaveBeenCalledWith(0);
  });

  it("displays correct summary when table field has no items added", () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {
        personal_info: {},
        work_history: {
          experience_table: [],
        },
      },
    } as any);

    render(
      <JobApplicationReviewStep
        completedSteps={new Set(["personal_info", "work_history"])}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    expect(screen.getByText("No Experience Added")).toBeTruthy();

    // Expand Work History tab
    const workHistoryTabHeader = screen.getByRole("button", {
      name: /Work History/,
    });
    fireEvent.click(workHistoryTabHeader);
    expect(screen.getByText("No Experience added")).toBeTruthy();
  });

  it("navigates back when Back button is clicked", () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {},
    } as any);

    render(
      <JobApplicationReviewStep
        completedSteps={new Set()}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    const backBtn = screen.getByRole("button", { name: /Back/ });
    fireEvent.click(backBtn);
    expect(mockOnPrev).toHaveBeenCalled();
  });

  it("performs successful submission flow and calls deleteDraft when draftName is provided", async () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {
        personal_info: { full_name: "John Doe", email: "john@example.com" },
        work_history: { experience_table: [] },
      },
    } as any);

    mockCreateApplicantMutate.mockImplementation((payload, { onSuccess }) => {
      onSuccess();
    });

    const completedSteps = new Set(["personal_info", "work_history"]);

    render(
      <JobApplicationReviewStep
        completedSteps={completedSteps}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName="draft-456"
      />,
    );

    // Submit button is disabled without declaration checkbox checked
    const submitBtn = screen.getByRole("button", {
      name: "Submit Application",
    });
    expect(submitBtn).toBeTruthy();

    // Check the declaration checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Submit form
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateApplicantMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          opening: "job-123",
          data: expect.objectContaining({
            full_name: "John Doe",
            email: "john@example.com",
            email_id: "applicant@example.com",
          }),
        }),
        expect.any(Object),
      );
      expect(mockDeleteDraftMutate).toHaveBeenCalledWith({
        email: "applicant@example.com",
        jobId: "job-123",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Application submitted successfully!",
      );
      expect(mockPush).toHaveBeenCalledWith(
        "/open-jobs/job-123/apply-job/thank-you",
      );
    });
  });

  it("displays submission error message on mutation failure", async () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {
        personal_info: { full_name: "John Doe" },
        work_history: {},
      },
    } as any);

    mockCreateApplicantMutate.mockImplementation((payload, { onError }) => {
      onError();
    });

    render(
      <JobApplicationReviewStep
        completedSteps={new Set(["personal_info", "work_history"])}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    // Accept declaration and submit
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", {
      name: "Submit Application",
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Submission failed. Please try again."),
      ).toBeTruthy();
    });
  });

  it("displays custom error message when submission catches a real Error", async () => {
    const badTabs = [...mockTabs];
    badTabs.forEach = () => {
      throw new Error("custom error");
    };

    vi.mocked(useJobApp).mockReturnValue({
      tabs: badTabs,
      stepData: {},
    } as any);

    render(
      <JobApplicationReviewStep
        completedSteps={new Set(["personal_info", "work_history"])}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", {
      name: "Submit Application",
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("custom error")).toBeTruthy();
    });
  });

  it("displays fallback error message on non-Error submit failure", async () => {
    const badTabs = [...mockTabs];
    badTabs.forEach = () => {
      throw "string error";
    };

    vi.mocked(useJobApp).mockReturnValue({
      tabs: badTabs,
      stepData: {},
    } as any);

    render(
      <JobApplicationReviewStep
        completedSteps={new Set(["personal_info", "work_history"])}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", {
      name: "Submit Application",
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to submit. Please try again."),
      ).toBeTruthy();
    });
  });

  it("renders expanded work history child table items correctly", () => {
    vi.mocked(useJobApp).mockReturnValue({
      tabs: mockTabs,
      stepData: {
        personal_info: {},
        work_history: {
          experience_table: [
            { company: "Google", role: "SWE", secret: "classified" },
          ],
        },
      },
    } as any);

    render(
      <JobApplicationReviewStep
        completedSteps={new Set(["personal_info", "work_history"])}
        goToStep={mockGoToStep}
        onPrev={mockOnPrev}
        jobID="job-123"
        draftName={null}
      />,
    );

    const workHistoryTabHeader = screen.getByRole("button", {
      name: /Work History/,
    });
    fireEvent.click(workHistoryTabHeader);

    expect(screen.getByText("Company:")).toBeTruthy();
    expect(screen.getByText("Google")).toBeTruthy();
    expect(screen.getByText("Role:")).toBeTruthy();
    expect(screen.getByText("SWE")).toBeTruthy();
    expect(screen.queryByText("Secret:")).toBeNull();
  });
});
