import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AdminStats } from "@/components/admin-stats"

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Users: () => <div data-testid="icon-users" />,
    Briefcase: () => <div data-testid="icon-jobs" />,
    FileText: () => <div data-testid="icon-applications" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    TrendingUp: () => <div data-testid="icon-trending-up" />,
    TrendingDown: () => <div data-testid="icon-trending-down" />,
    Minus: () => <div data-testid="icon-minus" />,
  }
})

describe("AdminStats", () => {
  const mockStats = {
    totalUsers: 1500,
    activeJobs: 45,
    totalApplications: 850,
    pendingApplications: 120,
    statusDistribution: {
      pending: 120,
      reviewing: 200,
      interviewing: 50,
      offered: 30,
      rejected: 400,
      withdrawn: 50
    }
  }

  it("renders loading state when stats is null", () => {
    const { container } = render(<AdminStats stats={null} />)
    expect(container.querySelectorAll(".animate-pulse").length).toBe(4)
  })

  it("renders main stat cards correctly", () => {
    render(<AdminStats stats={mockStats} />)
    
    expect(screen.getByText("Total Users")).toBeTruthy()
    expect(screen.getByText(/1,500|1500/)).toBeTruthy()
    
    expect(screen.getByText("Active Jobs")).toBeTruthy()
    expect(screen.getByText("45")).toBeTruthy()
    
    expect(screen.getByText("Total Applications")).toBeTruthy()
    expect(screen.getByText("850")).toBeTruthy()
    
    expect(screen.getByText("Pending Reviews")).toBeTruthy()
    expect(screen.getAllByText("120").length).toBeGreaterThan(0)
  })

  it("renders status distribution breakdown", () => {
    render(<AdminStats stats={mockStats} />)
    
    expect(screen.getByText("Application Status")).toBeTruthy()
    expect(screen.getByText("Application Status")).toBeTruthy()
    expect(screen.getAllByText("pending").length).toBeGreaterThan(0)
    expect(screen.getAllByText("reviewing").length).toBeGreaterThan(0)
    expect(screen.getAllByText("interviewing").length).toBeGreaterThan(0)
    
    // Check percentages
    // offered: 30 / 850 * 100 = 3.5%
    // Using getAllByText as it appears in both breakdown and metrics
    expect(screen.getAllByText("3.5%").length).toBeGreaterThan(0)
  })

  it("renders key metrics correctly", () => {
    render(<AdminStats stats={mockStats} />)
    
    expect(screen.getByText("Key Metrics")).toBeTruthy()
    expect(screen.getByText("Conversion Rate")).toBeTruthy()
    // offered 30 / 850 = 3.5%
    // Using getAllByText as it appears in both breakdown and metrics
    expect(screen.getAllByText("3.5%").length).toBeGreaterThan(0)
  })

  it("shows trend indicators on main cards", () => {
    render(<AdminStats stats={mockStats} />)
    // The component has hardcoded growth rates for demo: userGrowth=12, jobGrowth=8, appGrowth=24
    expect(screen.getByText("+12%")).toBeTruthy()
    expect(screen.getByText("+8%")).toBeTruthy()
    expect(screen.getByText("+24%")).toBeTruthy()
    // Pending reviews has hardcoded -5%
    expect(screen.getByText("-5%")).toBeTruthy()
  })
})
