import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyRequestsList, type Request } from "@/components/action-center/my-requests-list";

// ─── Mock Data ──────────────────────────────────────────────────────
const mockRequests: Request[] = [
  {
    id: "r1",
    title: "Extension of Joining Date",
    category: "Request",
    status: "pending_approval",
    requestType: "Date Change",
    submittedDate: "12-Sep-2025",
    icon: "Clock",
    iconColor: "bg-[#F79009]",
  },
  {
    id: "r2",
    title: "Salary Revision",
    category: "Finance",
    status: "approved",
    requestType: "Salary Related",
    responseDate: "15-Sep-2025",
    icon: "CalendarClock",
    iconColor: "bg-[#12B76A]",
  },
  {
    id: "r3",
    title: "Document Request",
    category: "Request",
    status: "rejected",
    requestType: "Document",
    responseDate: "10-Sep-2025",
  },
  {
    id: "r4",
    title: "Leave Application",
    category: "HR",
    status: "in_review",
    requestType: "Leave",
    submittedDate: "08-Sep-2025",
  },
];

// =====================================================================
//  RENDERING
// =====================================================================
describe("MyRequestsList – Rendering", () => {
  it("renders without crashing with empty requests", () => {
    const { container } = render(<MyRequestsList requests={[]} />);
    expect(container).toBeTruthy();
  });

  it("renders request titles", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
    expect(screen.getByText("Salary Revision")).toBeTruthy();
    expect(screen.getByText("Document Request")).toBeTruthy();
    expect(screen.getByText("Leave Application")).toBeTruthy();
  });

  it("groups requests by category", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText("Request")).toBeTruthy();
    expect(screen.getByText("Finance")).toBeTruthy();
    expect(screen.getByText("HR")).toBeTruthy();
  });

  it("renders status badges for each request", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText("Pending Approval")).toBeTruthy();
    expect(screen.getByText("Approved")).toBeTruthy();
    expect(screen.getByText("Rejected")).toBeTruthy();
    expect(screen.getByText("In Review")).toBeTruthy();
  });

  it("renders request type info", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText(/Request Type: Date Change/)).toBeTruthy();
    expect(screen.getByText(/Request Type: Salary Related/)).toBeTruthy();
    expect(screen.getByText(/Request Type: Document/)).toBeTruthy();
    expect(screen.getByText(/Request Type: Leave/)).toBeTruthy();
  });

  it("renders submitted date for requests with submittedDate", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText(/Requested on 12-Sep-2025/)).toBeTruthy();
    expect(screen.getByText(/Requested on 08-Sep-2025/)).toBeTruthy();
  });

  it("renders response date for requests with responseDate", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText(/Response on 15-Sep-2025/)).toBeTruthy();
    expect(screen.getByText(/Response on 10-Sep-2025/)).toBeTruthy();
  });

  it("shows 'No date available' for requests without any date", () => {
    const noDateRequests: Request[] = [
      { id: "nd1", title: "No Date Req", category: "Other", status: "pending_approval" },
    ];
    render(<MyRequestsList requests={noDateRequests} />);
    expect(screen.getByText("No date available")).toBeTruthy();
  });

  it("shows default request type 'General' when requestType is undefined", () => {
    const noTypeRequests: Request[] = [
      { id: "nt1", title: "No Type Req", category: "Other", status: "pending_approval" },
    ];
    render(<MyRequestsList requests={noTypeRequests} />);
    expect(screen.getByText(/Request Type: General/)).toBeTruthy();
  });

  it("shows 'View Status' button for every request", () => {
    render(<MyRequestsList requests={mockRequests} />);
    const viewStatBtns = screen.getAllByText(/View Status/);
    expect(viewStatBtns.length).toBe(mockRequests.length);
  });
});

// =====================================================================
//  FILTERING
// =====================================================================
describe("MyRequestsList – Filtering", () => {
  it("shows only pending_approval/in_review requests with 'pending' filter", () => {
    render(<MyRequestsList requests={mockRequests} filter="pending" />);
    expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
    expect(screen.getByText("Leave Application")).toBeTruthy();
    expect(screen.queryByText("Salary Revision")).toBeNull();
    expect(screen.queryByText("Document Request")).toBeNull();
  });

  it("shows only approved/rejected requests with 'accepted' filter", () => {
    render(<MyRequestsList requests={mockRequests} filter="accepted" />);
    expect(screen.getByText("Salary Revision")).toBeTruthy();
    expect(screen.getByText("Document Request")).toBeTruthy();
    expect(screen.queryByText("Extension of Joining Date")).toBeNull();
    expect(screen.queryByText("Leave Application")).toBeNull();
  });

  it("shows all requests with 'all' filter", () => {
    render(<MyRequestsList requests={mockRequests} filter="all" />);
    expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
    expect(screen.getByText("Salary Revision")).toBeTruthy();
    expect(screen.getByText("Document Request")).toBeTruthy();
    expect(screen.getByText("Leave Application")).toBeTruthy();
  });

  it("shows all requests when no filter is provided", () => {
    render(<MyRequestsList requests={mockRequests} />);
    expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
    expect(screen.getByText("Salary Revision")).toBeTruthy();
  });

  it("shows empty state when filter matches no requests", () => {
    const onlyApproved: Request[] = [
      { id: "a1", title: "Approved Req", category: "Cat", status: "approved" },
    ];
    render(<MyRequestsList requests={onlyApproved} filter="pending" />);
    expect(screen.getByText("No requests found for the selected filter.")).toBeTruthy();
  });

  it("shows empty state when requests array is empty", () => {
    render(<MyRequestsList requests={[]} filter="pending" />);
    expect(screen.getByText("No requests found for the selected filter.")).toBeTruthy();
  });
});

// =====================================================================
//  ICON HANDLING
// =====================================================================
describe("MyRequestsList – Icon Handling", () => {
  it("renders without crashing with custom icon", () => {
    const requests: Request[] = [
      { id: "i1", title: "Custom Icon", category: "Cat", status: "pending_approval", icon: "Clock", iconColor: "bg-yellow-500" },
    ];
    const { container } = render(<MyRequestsList requests={requests} />);
    expect(container).toBeTruthy();
  });

  it("renders without crashing without icon prop", () => {
    const requests: Request[] = [
      { id: "ni1", title: "No Icon", category: "Cat", status: "approved" },
    ];
    const { container } = render(<MyRequestsList requests={requests} />);
    expect(container).toBeTruthy();
  });

  it("renders without crashing with unknown icon name", () => {
    const requests: Request[] = [
      { id: "ui1", title: "Unknown Icon", category: "Cat", status: "rejected", icon: "UnknownIcon" },
    ];
    const { container } = render(<MyRequestsList requests={requests} />);
    expect(container).toBeTruthy();
  });
});

// =====================================================================
//  STATUS STYLE MAPPING
// =====================================================================
describe("MyRequestsList – Status Styles", () => {
  it("renders pending_approval with 'Pending Approval' label", () => {
    const requests: Request[] = [
      { id: "pa1", title: "PA Req", category: "Cat", status: "pending_approval" },
    ];
    render(<MyRequestsList requests={requests} />);
    expect(screen.getByText("Pending Approval")).toBeTruthy();
  });

  it("renders approved with 'Approved' label", () => {
    const requests: Request[] = [
      { id: "a1", title: "A Req", category: "Cat", status: "approved" },
    ];
    render(<MyRequestsList requests={requests} />);
    expect(screen.getByText("Approved")).toBeTruthy();
  });

  it("renders rejected with 'Rejected' label", () => {
    const requests: Request[] = [
      { id: "rj1", title: "RJ Req", category: "Cat", status: "rejected" },
    ];
    render(<MyRequestsList requests={requests} />);
    expect(screen.getByText("Rejected")).toBeTruthy();
  });

  it("renders in_review with 'In Review' label", () => {
    const requests: Request[] = [
      { id: "ir1", title: "IR Req", category: "Cat", status: "in_review" },
    ];
    render(<MyRequestsList requests={requests} />);
    expect(screen.getByText("In Review")).toBeTruthy();
  });
});

// =====================================================================
//  CLASSNAME PROP
// =====================================================================
describe("MyRequestsList – className prop", () => {
  it("applies custom className to the wrapper", () => {
    const { container } = render(
      <MyRequestsList requests={mockRequests} className="custom-class" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains("custom-class")).toBe(true);
  });
});

// =====================================================================
//  GROUPING LOGIC
// =====================================================================
describe("MyRequestsList – Grouping", () => {
  it("assigns 'Other' category for requests without a category", () => {
    const requests: Request[] = [
      { id: "nc1", title: "No Cat Req", category: "", status: "pending_approval" },
    ];
    render(<MyRequestsList requests={requests} />);
    expect(screen.getByText("Other")).toBeTruthy();
  });

  it("groups multiple requests under the same category", () => {
    render(<MyRequestsList requests={mockRequests} />);
    // "Request" category has 2 requests
    // Check both titles are rendered
    expect(screen.getByText("Extension of Joining Date")).toBeTruthy();
    expect(screen.getByText("Document Request")).toBeTruthy();
  });
});
