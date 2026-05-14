import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AssignedTasksList, Task } from "@/components/action-center/assigned-tasks-list"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe("AssignedTasksList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTasks: Task[] = [
    {
      id: "t1",
      title: "Upload Resume",
      category: "HR Tasks",
      status: "action_required",
      description: "Need basic CV",
      redirectUrl: "/forms/resume",
      attachment: "/files/resume_tmpl.pdf",
    },
    {
      id: "t2",
      title: "Compliance Check",
      category: "Legal",
      status: "completed",
      description: "Approved by legal",
      redirectUrl: "compliance_id",
      attachment: "", // No attachment
    },
  ]

  it("renders group category containers and child task data properly", () => {
    render(<AssignedTasksList tasks={mockTasks} />)
    expect(screen.getByText("HR Tasks")).toBeTruthy()
    expect(screen.getByText("Legal")).toBeTruthy()
    expect(screen.getByText("Upload Resume")).toBeTruthy()
    expect(screen.getByText("Compliance Check")).toBeTruthy()
  })

  it("exercises the filter fallback boundary yielding absolute passthrough visibility (Line 86)", () => {
    // Supply an unrecognizable filter string to trigger Line 86 `return true` branch
    render(<AssignedTasksList tasks={mockTasks} filter="unrecognized_key" />)
    
    // Verify that it doesn't collapse, maintaining general render state
    expect(screen.getByText("Upload Resume")).toBeTruthy()
    expect(screen.getByText("Compliance Check")).toBeTruthy()
  })

  it("detects total coverage on zero record state triggering localized empty warning (Line 102)", () => {
    // Inject explicitly vacant array to trigger Line 102 empty conditional branch
    render(<AssignedTasksList tasks={[]} />)
    expect(screen.getByText("No tasks found for the selected filter.")).toBeTruthy()
  })

  it("triggers complex inline attachment container lifecycle spanning modal ignition through termination (Lines 144-145, 202)", () => {
    render(<AssignedTasksList tasks={mockTasks} />)
    
    // Locate single item containing attachment defined in index 0
    const viewBtn = screen.getByRole("button", { name: "View" })
    
    // Ignition: Line 144-145 logic triggering active modal dispatch
    fireEvent.click(viewBtn)
    
    // Confirm element presence confirming Line 197 expansion logic successfully applied
    const closeBtn = screen.getByRole("button", { name: "✕" })
    expect(closeBtn).toBeTruthy()
    
    // Termination: Verify Line 202 callback cleanses active viewport containment
    fireEvent.click(closeBtn)
    expect(screen.queryByRole("button", { name: "✕" })).toBeNull()
  })

  it("synchronizes correct dynamic traversal during state specific redirection routing (Lines 169, 178)", () => {
    render(<AssignedTasksList tasks={mockTasks} />)

    // Trigger direct redirect routing executed within action_required block (Line 169-172)
    const actionBtn = screen.getByRole("button", { name: /Complete now/i })
    fireEvent.click(actionBtn)
    expect(mockPush).toHaveBeenCalledWith("/forms/resume")

    // Reset tracker
    mockPush.mockClear()

    // Trigger composite resource routing executed inside completed block (Line 178-182)
    const detailBtn = screen.getByRole("button", { name: /View Details/i })
    fireEvent.click(detailBtn)
    expect(mockPush).toHaveBeenCalledWith("/action-center/tasks/compliance_id")
  })
})
