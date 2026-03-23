import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssignedTasksList, type Task } from "./assigned-tasks-list";

// ─── Mock Data ──────────────────────────────────────────────────────
const mockTasks: Task[] = [
  {
    id: "t1",
    title: "PF Form",
    category: "Onboarding",
    status: "action_required",
    dueDate: "15 May 2025",
  },
  {
    id: "t2",
    title: "Offer Letter Released",
    category: "Recruitment",
    status: "completed",
    completedDate: "04-09-2025",
    icon: "FileText",
    iconColor: "bg-[#12B76A]",
  },
  {
    id: "t3",
    title: "Pre-Offer Submission",
    category: "Recruitment",
    status: "approved",
    completedDate: "03-09-2025",
    icon: "Check",
    iconColor: "bg-[#12B76A]",
  },
  {
    id: "t4",
    title: "Onboarding Journey",
    category: "Onboarding",
    status: "completed",
    completedDate: "10-09-2025",
    icon: "Clock",
    iconColor: "bg-[#7A5AF8]",
  },
  {
    id: "t5",
    title: "Gratuity Form",
    category: "Onboarding",
    status: "pending",
    dueDate: "20 May 2025",
  },
];

// =====================================================================
//  RENDERING
// =====================================================================
describe("AssignedTasksList – Rendering", () => {
  it("renders without crashing with empty tasks", () => {
    const { container } = render(<AssignedTasksList tasks={[]} />);
    expect(container).toBeTruthy();
  });

  it("renders task titles", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    expect(screen.getByText("PF Form")).toBeTruthy();
    expect(screen.getByText("Offer Letter Released")).toBeTruthy();
    expect(screen.getByText("Pre-Offer Submission")).toBeTruthy();
    expect(screen.getByText("Onboarding Journey")).toBeTruthy();
    expect(screen.getByText("Gratuity Form")).toBeTruthy();
  });

  it("groups tasks by category", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    expect(screen.getByText("Onboarding")).toBeTruthy();
    expect(screen.getByText("Recruitment")).toBeTruthy();
  });

  it("renders status badges for each task", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    expect(screen.getByText("Action Required")).toBeTruthy();
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Approved")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("renders due dates for tasks with dueDate", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    expect(screen.getByText(/Due by 15 May 2025/)).toBeTruthy();
    expect(screen.getByText(/Due by 20 May 2025/)).toBeTruthy();
  });

  it("renders completed dates for tasks with completedDate", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    expect(screen.getByText(/Completed on 04-09-2025/)).toBeTruthy();
    expect(screen.getByText(/Completed on 03-09-2025/)).toBeTruthy();
    expect(screen.getByText(/Completed on 10-09-2025/)).toBeTruthy();
  });

  it("shows 'No due date' for tasks without any date", () => {
    const taskNoDate: Task[] = [
      { id: "nd1", title: "No Date Task", category: "Other", status: "completed" },
    ];
    render(<AssignedTasksList tasks={taskNoDate} />);
    expect(screen.getByText("No due date")).toBeTruthy();
  });

  it("shows 'Documentation' subtitle for each task card", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    const docTexts = screen.getAllByText("Documentation");
    expect(docTexts.length).toBe(mockTasks.length);
  });
});

// =====================================================================
//  FILTERING
// =====================================================================
describe("AssignedTasksList – Filtering", () => {
  it("shows only pending/action_required tasks with 'pending' filter", () => {
    render(<AssignedTasksList tasks={mockTasks} filter="pending" />);
    expect(screen.getByText("PF Form")).toBeTruthy();
    expect(screen.getByText("Gratuity Form")).toBeTruthy();
    expect(screen.queryByText("Offer Letter Released")).toBeNull();
    expect(screen.queryByText("Pre-Offer Submission")).toBeNull();
    expect(screen.queryByText("Onboarding Journey")).toBeNull();
  });

  it("shows only approved/completed tasks with 'accepted' filter", () => {
    render(<AssignedTasksList tasks={mockTasks} filter="accepted" />);
    expect(screen.getByText("Offer Letter Released")).toBeTruthy();
    expect(screen.getByText("Pre-Offer Submission")).toBeTruthy();
    expect(screen.getByText("Onboarding Journey")).toBeTruthy();
    expect(screen.queryByText("PF Form")).toBeNull();
    expect(screen.queryByText("Gratuity Form")).toBeNull();
  });

  it("shows all tasks with 'all' filter", () => {
    render(<AssignedTasksList tasks={mockTasks} filter="all" />);
    expect(screen.getByText("PF Form")).toBeTruthy();
    expect(screen.getByText("Offer Letter Released")).toBeTruthy();
    expect(screen.getByText("Pre-Offer Submission")).toBeTruthy();
  });

  it("shows all tasks when no filter is provided", () => {
    render(<AssignedTasksList tasks={mockTasks} />);
    expect(screen.getByText("PF Form")).toBeTruthy();
    expect(screen.getByText("Offer Letter Released")).toBeTruthy();
  });

  it("shows empty state when filter matches no tasks", () => {
    const onlyCompletedTasks: Task[] = [
      { id: "c1", title: "Done Task", category: "Cat", status: "completed" },
    ];
    render(<AssignedTasksList tasks={onlyCompletedTasks} filter="pending" />);
    expect(screen.getByText("No tasks found for the selected filter.")).toBeTruthy();
  });

  it("shows empty state when tasks array is empty", () => {
    render(<AssignedTasksList tasks={[]} filter="pending" />);
    expect(screen.getByText("No tasks found for the selected filter.")).toBeTruthy();
  });
});

// =====================================================================
//  ACTION BUTTONS
// =====================================================================
describe("AssignedTasksList – Action Buttons", () => {
  it("shows 'Complete now' for action_required tasks", () => {
    const tasks: Task[] = [
      { id: "ar1", title: "AR Task", category: "Cat", status: "action_required", dueDate: "01 Jan 2025" },
    ];
    render(<AssignedTasksList tasks={tasks} />);
    expect(screen.getByText(/Complete now/)).toBeTruthy();
  });

  it("shows 'Complete now' for pending tasks", () => {
    const tasks: Task[] = [
      { id: "p1", title: "P Task", category: "Cat", status: "pending", dueDate: "01 Jan 2025" },
    ];
    render(<AssignedTasksList tasks={tasks} />);
    expect(screen.getByText(/Complete now/)).toBeTruthy();
  });

  it("shows 'View Details' for completed tasks", () => {
    const tasks: Task[] = [
      { id: "c1", title: "C Task", category: "Cat", status: "completed", completedDate: "01-01-2025" },
    ];
    render(<AssignedTasksList tasks={tasks} />);
    expect(screen.getByText(/View Details/)).toBeTruthy();
  });

  it("shows 'View Details' for approved tasks", () => {
    const tasks: Task[] = [
      { id: "a1", title: "A Task", category: "Cat", status: "approved", completedDate: "01-01-2025" },
    ];
    render(<AssignedTasksList tasks={tasks} />);
    expect(screen.getByText(/View Details/)).toBeTruthy();
  });
});

// =====================================================================
//  ICON HANDLING
// =====================================================================
describe("AssignedTasksList – Icon Handling", () => {
  it("uses custom icon when icon prop is provided", () => {
    const tasks: Task[] = [
      { id: "i1", title: "Icon Task", category: "Cat", status: "completed", icon: "FileText", iconColor: "bg-green-500" },
    ];
    // Should not crash
    const { container } = render(<AssignedTasksList tasks={tasks} />);
    expect(container).toBeTruthy();
  });

  it("uses default icon when no icon prop is provided", () => {
    const tasks: Task[] = [
      { id: "d1", title: "Default Icon", category: "Cat", status: "action_required" },
    ];
    const { container } = render(<AssignedTasksList tasks={tasks} />);
    expect(container).toBeTruthy();
  });

  it("uses default icon when icon name is not in ICON_MAP", () => {
    const tasks: Task[] = [
      { id: "u1", title: "Unknown Icon", category: "Cat", status: "completed", icon: "UnknownIcon" },
    ];
    const { container } = render(<AssignedTasksList tasks={tasks} />);
    expect(container).toBeTruthy();
  });
});

// =====================================================================
//  CLASSNAME PROP
// =====================================================================
describe("AssignedTasksList – className prop", () => {
  it("applies custom className to the wrapper", () => {
    const { container } = render(
      <AssignedTasksList tasks={mockTasks} className="custom-class" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains("custom-class")).toBe(true);
  });
});
