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
    expect(mockPush).toHaveBeenCalledWith("compliance_id")
  })
})

// =====================================================================
//  PWHR-1902 / PWHR-1903 – JOB DETAIL LAYOUT ON THE TASK TILE
// =====================================================================
describe("AssignedTasksList – job details", () => {
  const longValues = {
    job: "Senior Principal Platform Reliability Engineer (Distributed Systems)",
    company: "Northwind Technologies International Holdings Private Limited",
    department: "Platform Engineering and Site Reliability Operations Group",
    designation: "Staff Software Engineer, Infrastructure and Developer Tooling",
    employmentType: "Full-time Permanent (Probation 6 Months)",
    location: "Magarpatta City, Hadapsar, Pune, Maharashtra, India",
  }

  const taskWithJobDetails: Task = {
    id: "t3",
    title: "Pre-Offer Form",
    category: "Recruitment",
    status: "action_required",
    description: "Please fill and submit the required details",
    redirectUrl: "/pre-offer",
    attachment: "",
    jobChips: [
      { label: "Job Opening Title", value: longValues.job, icon: "job" },
      { label: "Company", value: longValues.company, icon: "company" },
      { label: "Department", value: longValues.department, icon: "department" },
      { label: "Designation", value: longValues.designation, icon: "designation" },
      { label: "Employee Type", value: longValues.employmentType, icon: "employmentType" },
      { label: "Location", value: longValues.location, icon: "location" },
    ],
  }

  it("renders every job detail as a label/value row in the expected order", () => {
    render(<AssignedTasksList tasks={[taskWithJobDetails]} />)

    const labels = screen.getAllByRole("term").map((node) => node.textContent)
    expect(labels).toEqual([
      "Job Opening Title",
      "Company",
      "Department",
      "Designation",
      "Employee Type",
      "Location",
    ])

    const values = screen.getAllByRole("definition").map((node) => node.textContent)
    expect(values).toEqual([
      longValues.job,
      longValues.company,
      longValues.department,
      longValues.designation,
      longValues.employmentType,
      longValues.location,
    ])
  })

  it("wraps long job detail values instead of truncating them", () => {
    render(<AssignedTasksList tasks={[taskWithJobDetails]} />)

    for (const value of Object.values(longValues)) {
      const node = screen.getByText(value)
      expect(node.className).toContain("break-words")
      expect(node.className).not.toContain("truncate")
      expect(node.textContent).toBe(value)
    }
  })

  it("lays the rows out in one aligned grid so tiles line up", () => {
    render(<AssignedTasksList tasks={[taskWithJobDetails]} />)

    const list = screen.getAllByRole("term")[0].parentElement as HTMLElement
    expect(list.tagName).toBe("DL")
    expect(list.className).toContain("grid")
    expect(list.className).toContain("@min-[16rem]:grid-cols-[8rem_minmax(0,1fr)]")
  })

  it("does not truncate a long task title in the card header", () => {
    const longTitle =
      "Pre-Offer Form for the Senior Principal Platform Reliability Engineer role"
    render(
      <AssignedTasksList
        tasks={[{ ...taskWithJobDetails, title: longTitle }]}
      />
    )

    const heading = screen.getByRole("heading", { name: longTitle })
    expect(heading.className).toContain("break-words")
    expect(heading.className).not.toContain("truncate")
  })

  it("renders no job detail list when a task carries no job details", () => {
    render(
      <AssignedTasksList tasks={[{ ...taskWithJobDetails, jobChips: [] }]} />
    )
    expect(screen.queryAllByRole("term")).toHaveLength(0)
  })
})
