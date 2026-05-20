 
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { TaskStatusBadge } from "@/components/action-center/task-status-badge"

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className, variant }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

describe("TaskStatusBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Label rendering ───────────────────────────────────────────────

  it('renders "Pending" label for pending status', () => {
    render(<TaskStatusBadge status="pending" />)
    expect(screen.getByText("Pending")).toBeTruthy()
  })

  it('renders "In Progress" label for in_progress status', () => {
    render(<TaskStatusBadge status="in_progress" />)
    expect(screen.getByText("In Progress")).toBeTruthy()
  })

  it('renders "Completed" label for completed status', () => {
    render(<TaskStatusBadge status="completed" />)
    expect(screen.getByText("Completed")).toBeTruthy()
  })

  it('renders "Overdue" label for overdue status', () => {
    render(<TaskStatusBadge status="overdue" />)
    expect(screen.getByText("Overdue")).toBeTruthy()
  })

  // ─── CSS class application ─────────────────────────────────────────

  it("applies yellow classes for pending status", () => {
    render(<TaskStatusBadge status="pending" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("bg-yellow-100")
    expect(badge.className).toContain("text-yellow-800")
  })

  it("applies blue classes for in_progress status", () => {
    render(<TaskStatusBadge status="in_progress" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("bg-blue-100")
    expect(badge.className).toContain("text-blue-800")
  })

  it("applies green classes for completed status", () => {
    render(<TaskStatusBadge status="completed" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("bg-green-100")
    expect(badge.className).toContain("text-green-800")
  })

  it("applies red classes for overdue status", () => {
    render(<TaskStatusBadge status="overdue" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("bg-red-100")
    expect(badge.className).toContain("text-red-800")
  })

  it("always includes border-transparent class regardless of status", () => {
    const statuses = ["pending", "in_progress", "completed", "overdue"] as const
    statuses.forEach((status) => {
      const { unmount } = render(<TaskStatusBadge status={status} />)
      expect(screen.getByTestId("badge").className).toContain("border-transparent")
      unmount()
    })
  })

  it("applies dark mode classes for pending status", () => {
    render(<TaskStatusBadge status="pending" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("dark:bg-yellow-900/30")
    expect(badge.className).toContain("dark:text-yellow-400")
  })

  it("applies dark mode classes for in_progress status", () => {
    render(<TaskStatusBadge status="in_progress" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("dark:bg-blue-900/30")
    expect(badge.className).toContain("dark:text-blue-400")
  })

  it("applies dark mode classes for completed status", () => {
    render(<TaskStatusBadge status="completed" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("dark:bg-green-900/30")
    expect(badge.className).toContain("dark:text-green-400")
  })

  it("applies dark mode classes for overdue status", () => {
    render(<TaskStatusBadge status="overdue" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("dark:bg-red-900/30")
    expect(badge.className).toContain("dark:text-red-400")
  })

  // ─── Custom className prop ─────────────────────────────────────────

  it("merges additional className with default status classes", () => {
    render(<TaskStatusBadge status="pending" className="my-custom-class" />)
    const badge = screen.getByTestId("badge")
    expect(badge.className).toContain("my-custom-class")
    expect(badge.className).toContain("bg-yellow-100")
  })

  it("renders correctly without optional className prop", () => {
    expect(() => render(<TaskStatusBadge status="completed" />)).not.toThrow()
  })

  // ─── Badge variant ─────────────────────────────────────────────────

  it('passes variant="secondary" to Badge for all statuses', () => {
    const statuses = ["pending", "in_progress", "completed", "overdue"] as const
    statuses.forEach((status) => {
      const { unmount } = render(<TaskStatusBadge status={status} />)
      expect(screen.getByTestId("badge")).toHaveAttribute("data-variant", "secondary")
      unmount()
    })
  })
})