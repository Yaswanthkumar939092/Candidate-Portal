import type { ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AdminDashboard from "@/app/admin/dashboard/page"

const { mockPush, mockGetCurrentUser, mockFrom } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockFrom: vi.fn(),
}))

type QueryRow = Record<string, unknown>

interface SupabaseScenario {
  profile: QueryRow | null
  usersCount: number
  jobsCount: number
  applicationsCount: number
  recentApps: Array<{
    id: string
    status: string
    applied_at: string
    jobs: { title: string; company: string } | null
    profiles: { full_name: string | null; email: string } | null
  }>
  statusDistribution: Array<{ status: string }>
}

let scenario: SupabaseScenario

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock("@/lib/supabase", () => ({
  getCurrentUser: mockGetCurrentUser,
  supabase: {
    from: mockFrom,
  },
}))

vi.mock("@/components/admin-navigation", () => ({
  AdminNavigation: () => <div data-testid="admin-navigation">Admin Navigation</div>,
}))

vi.mock("@/components/admin-stats", () => ({
  AdminStats: ({ stats }: { stats: QueryRow | null }) => (
    <div data-testid="admin-stats">
      {stats
        ? `users:${stats.totalUsers} jobs:${stats.activeJobs} applications:${stats.totalApplications} pending:${stats.pendingApplications}`
        : "no-stats"}
    </div>
  ),
}))

vi.mock("@/components/job-sync-status", () => ({
  JobSyncStatus: () => <div data-testid="job-sync-status">Sync Status</div>,
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  CardHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  TabsContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode
    onClick?: () => void
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

function createSupabaseFromMock() {
  return vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn((columns: string, options?: { count?: string }) => {
          if (options?.count === "exact") {
            return { count: scenario.usersCount }
          }

          return {
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: scenario.profile })),
            })),
          }
        }),
      }
    }

    if (table === "jobs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ count: scenario.jobsCount })),
        })),
      }
    }

    if (table === "applications") {
      return {
        select: vi.fn((columns: string, options?: { count?: string }) => {
          if (options?.count === "exact") {
            return { count: scenario.applicationsCount }
          }

          if (columns.includes("jobs:job_id")) {
            return {
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: scenario.recentApps })),
              })),
            }
          }

          if (columns === "status") {
            return Promise.resolve({ data: scenario.statusDistribution })
          }

          return { data: [] }
        }),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })
}

function renderPage() {
  return render(<AdminDashboard />)
}

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    scenario = {
      profile: { id: "user-1", role: "admin" },
      usersCount: 12,
      jobsCount: 3,
      applicationsCount: 4,
      recentApps: [
        {
          id: "app-1",
          status: "pending",
          applied_at: "2026-04-20T12:00:00.000Z",
          jobs: { title: "Frontend Engineer", company: "Acme" },
          profiles: { full_name: "Alex Johnson", email: "alex@example.com" },
        },
        {
          id: "app-2",
          status: "offered",
          applied_at: "2026-04-19T10:30:00.000Z",
          jobs: { title: "Backend Engineer", company: "Globex" },
          profiles: null,
        },
      ],
      statusDistribution: [
        { status: "pending" },
        { status: "pending" },
        { status: "reviewing" },
        { status: "offered" },
      ],
    }

    mockGetCurrentUser.mockResolvedValue({ id: "user-1", email: "admin@example.com" })
    mockFrom.mockImplementation(createSupabaseFromMock())
  })

  it("shows the loading state while the admin check is in flight", async () => {
    let resolveUser: (value: { id: string; email: string } | null) => void = () => {}
    mockGetCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve
      })
    )

    renderPage()

    expect(screen.getByText("Loading dashboard...")).toBeTruthy()

    resolveUser?.({ id: "user-1", email: "admin@example.com" })

    await waitFor(() => {
      expect(screen.queryByText("Loading dashboard...")).toBeNull()
    })
  })

  it("redirects to login when there is no authenticated user", async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    renderPage()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login")
    })

    expect(screen.queryByText("Admin Dashboard")).toBeNull()
  })

  it("redirects to the candidate dashboard when the user has no admin profile", async () => {
    scenario.profile = null
    mockFrom.mockImplementation(createSupabaseFromMock())

    renderPage()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard")
    })
  })

  it("renders dashboard stats, recent activity, analytics, and admin actions", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeTruthy()
    })

    expect(screen.getByTestId("admin-navigation")).toHaveTextContent("Admin Navigation")
    expect(screen.getByTestId("job-sync-status")).toHaveTextContent("Sync Status")
    expect(screen.getByTestId("admin-stats")).toHaveTextContent("users:12 jobs:3 applications:4 pending:2")
    expect(screen.getByText("Alex Johnson")).toBeTruthy()
    expect(screen.getByText("Unknown")).toBeTruthy()
    expect(screen.getByText("Frontend Engineer at Acme")).toBeTruthy()
    expect(screen.getByText("Backend Engineer at Globex")).toBeTruthy()
    expect(screen.getByText("50.0%")).toBeTruthy()
    expect(screen.getAllByText("25.0%").length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole("button", { name: "Settings" }))
    await userEvent.click(screen.getByRole("button", { name: "View All" }))

    expect(mockPush).toHaveBeenCalledWith("/admin/settings")
    expect(mockPush).toHaveBeenCalledWith("/admin/applications")
  })

  it("renders empty states and zero conversion when no applications exist", async () => {
    scenario.applicationsCount = 0
    scenario.recentApps = []
    scenario.statusDistribution = []
    mockFrom.mockImplementation(createSupabaseFromMock())

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("No recent applications")).toBeTruthy()
    })

    expect(screen.getByText("No recent activity")).toBeTruthy()
    expect(screen.getByText("Activity will appear here as users interact with your portal")).toBeTruthy()
    expect(screen.getByTestId("admin-stats")).toHaveTextContent("users:12 jobs:3 applications:0 pending:0")
    expect(screen.getByText("0%")).toBeTruthy()
  })

  it("redirects to login when loading the admin dashboard throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockGetCurrentUser.mockRejectedValue(new Error("session expired"))

    renderPage()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login")
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error loading dashboard:", expect.any(Error))
    consoleErrorSpy.mockRestore()
  })
})
