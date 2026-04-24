/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MyRequestsList, type Request } from "@/components/action-center/my-requests-list"

// ─── Mock next/navigation (useRouter) ─────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// ─── Mock lucide-react icons ───────────────────────────────────────
vi.mock("lucide-react", () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  FileText: () => <span data-testid="icon-file-text" />,
  CalendarClock: () => <span data-testid="icon-calendar-clock" />,
  Clock: () => <span data-testid="icon-clock" />,
}))

// ─── Mock UI components ────────────────────────────────────────────
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

// ─── Fixtures ──────────────────────────────────────────────────────
const makeRequest = (overrides: Partial<Request> = {}): Request => ({
  id: "req-1",
  title: "Test Request",
  category: "General",
  status: "pending_approval",
  requestType: "general",
  description: "Test description",
  submittedDate: "15 Jan 2024",
  attachment: "",
  redirectUrl: "req-url",
  ...overrides,
})

// ─── Tests ─────────────────────────────────────────────────────────

describe("MyRequestsList – Rendering", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders without crashing with empty requests", () => {
    render(<MyRequestsList requests={[]} />)
    expect(screen.getByText("No requests found for the selected filter.")).toBeTruthy()
  })

  it("renders request titles", () => {
    render(<MyRequestsList requests={[makeRequest({ title: "Leave Request" })]} />)
    expect(screen.getByText("Leave Request")).toBeTruthy()
  })

  it("groups requests by category", () => {
    const requests = [
      makeRequest({ id: "1", category: "HR", title: "Request A" }),
      makeRequest({ id: "2", category: "Finance", title: "Request B" }),
    ]
    render(<MyRequestsList requests={requests} />)
    expect(screen.getByText("HR")).toBeTruthy()
    expect(screen.getByText("Finance")).toBeTruthy()
  })

  it("renders status badges for each request", () => {
    render(<MyRequestsList requests={[makeRequest()]} />)
    expect(screen.getByTestId("badge")).toBeTruthy()
  })

  it("renders request type info", () => {
    render(<MyRequestsList requests={[makeRequest({ requestType: "document" })]} />)
    expect(screen.getByText(/document/i)).toBeTruthy()
  })

  it("renders submitted date for requests with submittedDate", () => {
    render(<MyRequestsList requests={[makeRequest({ submittedDate: "10 Feb 2024" })]} />)
    expect(screen.getByText(/10 Feb 2024/)).toBeTruthy()
  })

  it("renders response date for requests with responseDate", () => {
    render(
      <MyRequestsList
        requests={[makeRequest({ submittedDate: undefined, responseDate: "20 Mar 2024" })]}
      />
    )
    expect(screen.getByText(/20 Mar 2024/)).toBeTruthy()
  })

  it("shows 'No date available' for requests without any date", () => {
    render(
      <MyRequestsList
        requests={[makeRequest({ submittedDate: undefined, responseDate: undefined })]}
      />
    )
    expect(screen.getByText("No date available")).toBeTruthy()
  })

  it("shows default request type 'General' when requestType is undefined", () => {
    render(<MyRequestsList requests={[makeRequest({ requestType: undefined })]} />)
    expect(screen.getByText(/Request Type: General/)).toBeTruthy()
  })

  it("shows 'View Status' button for every request", () => {
    render(
      <MyRequestsList
        requests={[makeRequest({ id: "1" }), makeRequest({ id: "2" })]}
      />
    )
    expect(screen.getAllByText("View Status")).toHaveLength(2)
  })
})

describe("MyRequestsList – Filtering", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows only pending_approval/in_review requests with 'pending' filter", () => {
    const requests = [
      makeRequest({ id: "1", title: "Pending One", status: "pending_approval" }),
      makeRequest({ id: "2", title: "In Review One", status: "in_review" }),
      makeRequest({ id: "3", title: "Approved One", status: "approved" }),
    ]
    render(<MyRequestsList requests={requests} filter="pending" />)
    expect(screen.getByText("Pending One")).toBeTruthy()
    expect(screen.getByText("In Review One")).toBeTruthy()
    expect(screen.queryByText("Approved One")).toBeNull()
  })

  it("shows only approved/rejected requests with 'accepted' filter", () => {
    const requests = [
      makeRequest({ id: "1", title: "Approved One", status: "approved" }),
      makeRequest({ id: "2", title: "Rejected One", status: "rejected" }),
      makeRequest({ id: "3", title: "Pending One", status: "pending_approval" }),
    ]
    render(<MyRequestsList requests={requests} filter="accepted" />)
    expect(screen.getByText("Approved One")).toBeTruthy()
    expect(screen.getByText("Rejected One")).toBeTruthy()
    expect(screen.queryByText("Pending One")).toBeNull()
  })

  it("shows all requests with 'all' filter", () => {
    const requests = [
      makeRequest({ id: "1", title: "Request A", status: "approved" }),
      makeRequest({ id: "2", title: "Request B", status: "pending_approval" }),
    ]
    render(<MyRequestsList requests={requests} filter="all" />)
    expect(screen.getByText("Request A")).toBeTruthy()
    expect(screen.getByText("Request B")).toBeTruthy()
  })

  it("shows all requests when no filter is provided", () => {
    const requests = [
      makeRequest({ id: "1", title: "Request A", status: "approved" }),
      makeRequest({ id: "2", title: "Request B", status: "rejected" }),
    ]
    render(<MyRequestsList requests={requests} />)
    expect(screen.getByText("Request A")).toBeTruthy()
    expect(screen.getByText("Request B")).toBeTruthy()
  })

  it("shows empty state when filter matches no requests", () => {
    render(
      <MyRequestsList
        requests={[makeRequest({ status: "approved" })]}
        filter="pending"
      />
    )
    expect(screen.getByText("No requests found for the selected filter.")).toBeTruthy()
  })

  it("shows empty state when requests array is empty", () => {
    render(<MyRequestsList requests={[]} />)
    expect(screen.getByText("No requests found for the selected filter.")).toBeTruthy()
  })
})

describe("MyRequestsList – Icon Handling", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders without crashing with custom icon", () => {
    expect(() =>
      render(<MyRequestsList requests={[makeRequest({ icon: "FileText" })]} />)
    ).not.toThrow()
  })

  it("renders without crashing without icon prop", () => {
    expect(() =>
      render(<MyRequestsList requests={[makeRequest()]} />)
    ).not.toThrow()
  })

  it("renders without crashing with unknown icon name", () => {
    expect(() =>
      render(<MyRequestsList requests={[makeRequest({ icon: "UnknownIcon" })]} />)
    ).not.toThrow()
  })
})

describe("MyRequestsList – Status Styles", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders pending_approval with 'Pending Approval' label", () => {
    render(<MyRequestsList requests={[makeRequest({ status: "pending_approval" })]} />)
    expect(screen.getByText("Pending Approval")).toBeTruthy()
  })

  it("renders approved with 'Approved' label", () => {
    render(<MyRequestsList requests={[makeRequest({ status: "approved" })]} />)
    expect(screen.getByText("Approved")).toBeTruthy()
  })

  it("renders rejected with 'Rejected' label", () => {
    render(<MyRequestsList requests={[makeRequest({ status: "rejected" })]} />)
    expect(screen.getByText("Rejected")).toBeTruthy()
  })

  it("renders in_review with 'In Review' label", () => {
    render(<MyRequestsList requests={[makeRequest({ status: "in_review" })]} />)
    expect(screen.getByText("In Review")).toBeTruthy()
  })
})

describe("MyRequestsList – className prop", () => {
  beforeEach(() => vi.clearAllMocks())

  it("applies custom className to the wrapper", () => {
    const { container } = render(
      <MyRequestsList
        requests={[makeRequest()]}
        className="custom-wrapper"
      />
    )
    expect(container.firstChild).toBeTruthy()
    expect((container.firstChild as HTMLElement).className).toContain("custom-wrapper")
  })
})

describe("MyRequestsList – Grouping", () => {
  beforeEach(() => vi.clearAllMocks())

  it("assigns 'Other' category for requests without a category", () => {
    render(
      <MyRequestsList requests={[makeRequest({ category: "" })]} />
    )
    expect(screen.getByText("Other")).toBeTruthy()
  })

  it("groups multiple requests under the same category", () => {
    const requests = [
      makeRequest({ id: "1", title: "Req A", category: "HR" }),
      makeRequest({ id: "2", title: "Req B", category: "HR" }),
    ]
    render(<MyRequestsList requests={requests} />)
    // Only one "HR" heading should exist
    expect(screen.getAllByText("HR")).toHaveLength(1)
    expect(screen.getByText("Req A")).toBeTruthy()
    expect(screen.getByText("Req B")).toBeTruthy()
  })
})