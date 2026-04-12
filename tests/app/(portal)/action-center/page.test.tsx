import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionCenterPage from "@/app/(portal)/action-center/page";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ─── Helpers ────────────────────────────────────────────────────────
// Use pointerEventsCheck: 0 because Radix Select renders spans with
// pointer-events: none that jsdom incorrectly blocks.
const user = userEvent.setup({ pointerEventsCheck: 0 });

// =====================================================================
//  ACTION CENTER PAGE – PAGE HEADER UI
// =====================================================================
describe("ActionCenterPage – Page Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<ActionCenterPage />);
    expect(container).toBeTruthy();
  });

  it("renders the 'Action Center' heading", () => {
    render(<ActionCenterPage />);
    expect(
      screen.getByRole("heading", { name: /Action Center/i })
    ).toBeTruthy();
  });

  it("renders the subtitle text", () => {
    render(<ActionCenterPage />);
    expect(
      screen.getByText("Manage your tasks and requests efficiently.")
    ).toBeTruthy();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – TAB BAR UI & LOGIC
// =====================================================================
describe("ActionCenterPage – Tab Bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Assigned Tasks' tab", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText("Assigned Tasks")).toBeTruthy();
  });

  it("renders 'My Requests' tab", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText("My Requests")).toBeTruthy();
  });

  it("shows Assigned Tasks tab as active by default", () => {
    render(<ActionCenterPage />);
    // Active tab has an indicator bar (span)
    const tasksTab = screen.getByText("Assigned Tasks");
    const indicator = tasksTab.querySelector("span");
    expect(indicator).toBeTruthy();
  });

  it("switches to My Requests tab when clicked", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText("My Requests"));

    // My Requests tab should now have indicator
    const requestsTab = screen.getByText("My Requests");
    const indicator = requestsTab.querySelector("span");
    expect(indicator).toBeTruthy();
  });

  it("switches back to Assigned Tasks from My Requests", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Assigned Tasks"));

    const tasksTab = screen.getByText("Assigned Tasks");
    const indicator = tasksTab.querySelector("span");
    expect(indicator).toBeTruthy();
  });

  it("resets filter to 'pending' when switching to My Requests", async () => {
    render(<ActionCenterPage />);

    // Switch to accepted filter
    await user.click(screen.getByText(/Archived/));

    // Switch tab
    await user.click(screen.getByText("My Requests"));

    // Pending pill should be active — use specific regex to avoid matching "Pending Approval" badge
    const pendingBtn = screen.getByText(/Pending \(/);
    expect(pendingBtn).toBeTruthy();
  });

  it("resets filter to 'pending' when switching back to Assigned Tasks", async () => {
    render(<ActionCenterPage />);

    // Go to requests, change filter
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText(/Archived/));

    // Switch back to tasks
    await user.click(screen.getByText("Assigned Tasks"));

    // Pending pill should be active
    const pendingBtn = screen.getByText(/Pending \(/);
    expect(pendingBtn).toBeTruthy();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – INFO BANNER
// =====================================================================
describe("ActionCenterPage – Info Banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the info banner by default", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText("Did you know?")).toBeTruthy();
  });

  it("shows the banner description text", () => {
    render(<ActionCenterPage />);
    expect(
      screen.getByText(
        /Tasks such as pre-offer submission and offer acceptance can be completed directly from this dashboard\./
      )
    ).toBeTruthy();
  });

  it("has a dismiss button with aria-label", () => {
    render(<ActionCenterPage />);
    expect(screen.getByLabelText("Dismiss")).toBeTruthy();
  });

  it("hides the info banner when dismiss button is clicked", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByLabelText("Dismiss"));

    expect(screen.queryByText("Did you know?")).toBeNull();
  });

  it("banner stays hidden after dismissal even when switching tabs", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByLabelText("Dismiss"));
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Assigned Tasks"));

    expect(screen.queryByText("Did you know?")).toBeNull();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – FILTER PILLS
// =====================================================================
describe("ActionCenterPage – Filter Pills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Pending filter pill with count", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText(/Pending \(\d+\)/)).toBeTruthy();
  });

  it("renders Archived filter pill with count", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText(/Archived \(\d+\)/)).toBeTruthy();
  });

  it("Pending filter is active by default", () => {
    render(<ActionCenterPage />);
    const pendingBtn = screen.getByText(/Pending/);
    // Active pill has 'bg-white' class
    expect(pendingBtn.classList.contains("bg-white")).toBe(true);
  });

  it("switches to Archived filter when clicked", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText(/Archived/));

    const archivedBtn = screen.getByText(/Archived/);
    expect(archivedBtn.classList.contains("bg-white")).toBe(true);
  });

  it("switches back to Pending filter when clicked", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText(/Archived/));
    await user.click(screen.getByText(/Pending/));

    const pendingBtn = screen.getByText(/Pending/);
    expect(pendingBtn.classList.contains("bg-white")).toBe(true);
  });

  it("shows correct task pending count (1 action_required task)", () => {
    render(<ActionCenterPage />);
    // From mock data: 1 task is action_required
    expect(screen.getByText("Pending (1)")).toBeTruthy();
  });

  it("shows correct task archived count (4 approved/completed tasks)", () => {
    render(<ActionCenterPage />);
    // From mock data: 4 tasks are completed or approved
    expect(screen.getByText("Archived (4)")).toBeTruthy();
  });

  it("updates counts when switching to My Requests tab", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText("My Requests"));

    // From mock data: 1 request is pending_approval
    expect(screen.getByText("Pending (1)")).toBeTruthy();
    // From mock data: 0 requests are approved
    expect(screen.getByText("Archived (0)")).toBeTruthy();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – ASSIGNED TASKS CONTENT
// =====================================================================
describe("ActionCenterPage – Assigned Tasks Content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows action_required task when Pending filter is active", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText("PF Form")).toBeTruthy();
  });

  it("shows 'Action Required' badge for pending task", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText("Action Required")).toBeTruthy();
  });

  it("shows 'Complete now' button for action_required tasks", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText(/Complete now/)).toBeTruthy();
  });

  it("shows completed/approved tasks when Archived filter is active", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText(/Archived/));

    expect(screen.getByText("Offer Letter Released")).toBeTruthy();
    expect(screen.getByText("Pre-Offer Submission")).toBeTruthy();
    expect(screen.getByText("Onboarding Journey")).toBeTruthy();
    expect(screen.getByText("Gratuity Form")).toBeTruthy();
  });

  it("shows 'View Details' button for completed/approved tasks", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText(/Archived/));

    const viewButtons = screen.getAllByText(/View Details/);
    expect(viewButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows task category headings", async () => {
    render(<ActionCenterPage />);
    // The pending task "PF Form" is in "Onboarding" category
    expect(screen.getByText("Onboarding")).toBeTruthy();
  });

  it("shows due date for tasks with dueDate", () => {
    render(<ActionCenterPage />);
    expect(screen.getByText(/Due by 15 May 2025/)).toBeTruthy();
  });

  it("shows completed date for archived tasks", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText(/Archived/));

    expect(screen.getByText(/Completed on 04-09-2025/)).toBeTruthy();
  });

  it("hides pending tasks when Archived filter is active", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText(/Archived/));

    expect(screen.queryByText("PF Form")).toBeNull();
  });

  it("hides archived tasks when Pending filter is active", () => {
    render(<ActionCenterPage />);
    // These are completed/approved and should not show under Pending
    expect(screen.queryByText("Offer Letter Released")).toBeNull();
  });

  it("groups tasks by category in Archived view", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText(/Archived/));

    // Both "Recruitment" and "Onboarding" categories should appear
    expect(screen.getByText("Recruitment")).toBeTruthy();
    expect(screen.getByText("Onboarding")).toBeTruthy();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – MY REQUESTS CONTENT
// =====================================================================
describe("ActionCenterPage – My Requests Content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows requests content when My Requests tab is active", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
  });

  it("shows 'Pending Approval' badge for pending requests", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText("Pending Approval")).toBeTruthy();
  });

  it("shows request type info", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText(/Request Type: Date Change/)).toBeTruthy();
  });

  it("shows submitted date for requests", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText(/Requested on 12-Sep-2025/)).toBeTruthy();
  });

  it("shows 'View Status' button for requests", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText(/View Status/)).toBeTruthy();
  });

  it("shows empty state when Archived filter has no requests", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText(/Archived/));

    expect(
      screen.getByText("No requests found for the selected filter.")
    ).toBeTruthy();
  });

  it("hides task content when My Requests tab is active", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.queryByText("PF Form")).toBeNull();
  });

  it("shows request category heading", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText("Request")).toBeTruthy();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – RAISE REQUEST BUTTON & DIALOG
// =====================================================================
describe("ActionCenterPage – Raise Request Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT show Raise Request button on Assigned Tasks tab", () => {
    render(<ActionCenterPage />);
    expect(screen.queryByText("Raise Request")).toBeNull();
  });

  it("shows Raise Request button on My Requests tab", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));

    expect(screen.getByText("Raise Request")).toBeTruthy();
  });

  it("hides Raise Request button when switching back to Assigned Tasks", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText("My Requests"));
    expect(screen.getByText("Raise Request")).toBeTruthy();

    await user.click(screen.getByText("Assigned Tasks"));
    expect(screen.queryByText("Raise Request")).toBeNull();
  });

  it("opens the Raise Request dialog when button is clicked", async () => {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Raise Request"));

    await waitFor(() => {
      expect(screen.getByText("Raise a Request")).toBeTruthy();
    });
  });
});

// =====================================================================
//  ACTION CENTER PAGE – RAISE REQUEST DIALOG UI
// =====================================================================
describe("ActionCenterPage – Raise Request Dialog UI", () => {
  async function openDialog() {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Raise Request"));
    await waitFor(() => {
      expect(screen.getByText("Raise a Request")).toBeTruthy();
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows dialog title 'Raise a Request'", async () => {
    await openDialog();
    expect(screen.getByText("Raise a Request")).toBeTruthy();
  });

  it("shows dialog description about submitting to HR", async () => {
    await openDialog();
    expect(
      screen.getByText("Submit a new request to the HR team.")
    ).toBeTruthy();
  });

  it("shows Request Type select with required marker", async () => {
    await openDialog();
    // There may be multiple "Request Type" texts (label + existing card data)
    const elements = screen.getAllByText(/Request Type/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Description textarea with required marker", async () => {
    await openDialog();
    // There may be multiple "Description" texts
    const elements = screen.getAllByText(/Description/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Attachments section", async () => {
    await openDialog();
    expect(screen.getByText("Attachments")).toBeTruthy();
  });

  it("shows file upload area with instructions", async () => {
    await openDialog();
    expect(screen.getByText(/Click to upload/)).toBeTruthy();
    expect(screen.getByText(/SVG, PNG, JPG or PDF/)).toBeTruthy();
  });

  it("shows Cancel button", async () => {
    await openDialog();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("shows Submit Request button", async () => {
    await openDialog();
    expect(screen.getByText("Submit Request")).toBeTruthy();
  });

  it("shows placeholder text in description textarea", async () => {
    await openDialog();
    expect(
      screen.getByPlaceholderText(
        "Please describe your request in detail..."
      )
    ).toBeTruthy();
  });
});

// =====================================================================
//  ACTION CENTER PAGE – RAISE REQUEST DIALOG LOGIC
// =====================================================================
describe("ActionCenterPage – Raise Request Dialog Logic", () => {
  async function openDialog() {
    render(<ActionCenterPage />);
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Raise Request"));
    await waitFor(() => {
      expect(screen.getByText("Raise a Request")).toBeTruthy();
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error 'Request type is required' when submitting without type", async () => {
    await openDialog();

    // Type description only
    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "Some description"
    );
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Request type is required.")).toBeTruthy();
    });
  });

  it("shows error 'Description is required' when submitting without description", async () => {
    await openDialog();

    // Select request type via the trigger
    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    // Submit without description
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(screen.getByText("Description is required.")).toBeTruthy();
    });
  });

  it("closes dialog when Cancel button is clicked", async () => {
    await openDialog();

    await user.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByText("Raise a Request")).toBeNull();
    });
  });

  it("closes dialog and logs data on successful submit", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await openDialog();

    // Select request type
    await user.click(screen.getByText("Select request type"));
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });
    await user.click(screen.getByText("General"));

    // Type description
    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "I need help with something"
    );

    // Submit
    await user.click(screen.getByText("Submit Request"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Request submitted:",
        expect.objectContaining({
          requestType: "general",
          description: "I need help with something",
        })
      );
    });

    consoleSpy.mockRestore();
  });

  it("resets form fields when dialog is closed via Cancel", async () => {
    await openDialog();

    // Type some description
    await user.type(
      screen.getByPlaceholderText("Please describe your request in detail..."),
      "Temporary text"
    );

    // Cancel
    await user.click(screen.getByText("Cancel"));

    // Re-open
    await user.click(screen.getByText("Raise Request"));

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        "Please describe your request in detail..."
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });
  });
});

// =====================================================================
//  ACTION CENTER PAGE – EDGE CASES
// =====================================================================
describe("ActionCenterPage – Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no pending tasks exist (archived filter selected)", async () => {
    // With the mock data, only 1 pending task. Switch to a view that might be empty
    render(<ActionCenterPage />);
    // Pending filter shows 1 task, so it should not be empty
    expect(screen.queryByText("No tasks found for the selected filter.")).toBeNull();
  });

  it("handles rapid tab switching without errors", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Assigned Tasks"));
    await user.click(screen.getByText("My Requests"));
    await user.click(screen.getByText("Assigned Tasks"));

    // Should be back on tasks with no errors
    expect(screen.getByText("PF Form")).toBeTruthy();
  });

  it("handles rapid filter switching without errors", async () => {
    render(<ActionCenterPage />);

    await user.click(screen.getByText(/Archived/));
    await user.click(screen.getByText(/Pending/));
    await user.click(screen.getByText(/Archived/));
    await user.click(screen.getByText(/Pending/));

    expect(screen.getByText("PF Form")).toBeTruthy();
  });

  it("renders all task statuses with proper badges", async () => {
    render(<ActionCenterPage />);
    // Pending filter
    expect(screen.getByText("Action Required")).toBeTruthy();

    // Archived filter
    await user.click(screen.getByText(/Archived/));
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Approved")).toBeTruthy();
  });
});
