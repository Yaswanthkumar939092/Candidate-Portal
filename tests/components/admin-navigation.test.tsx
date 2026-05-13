import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminNavigation } from "@/components/admin-navigation"
import { signOut } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  signOut: vi.fn(),
}))

// Mock lucide-react icons to avoid rendering issues in tests
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    LayoutDashboard: () => <div data-testid="icon-dashboard" />,
    Users: () => <div data-testid="icon-users" />,
    Briefcase: () => <div data-testid="icon-jobs" />,
    FileText: () => <div data-testid="icon-applications" />,
    BarChart3: () => <div data-testid="icon-analytics" />,
    RefreshCw: () => <div data-testid="icon-sync" />,
    ToggleLeft: () => <div data-testid="icon-feature-flags" />,
    Server: () => <div data-testid="icon-frappe" />,
    ClipboardList: () => <div data-testid="icon-onboarding" />,
    Globe: () => <div data-testid="icon-domains" />,
    Shield: () => <div data-testid="icon-sso" />,
    Settings: () => <div data-testid="icon-settings" />,
    Bell: () => <div data-testid="icon-notifications" />,
    LogOut: () => <div data-testid="icon-logout" />,
    ChevronDown: () => <div data-testid="icon-chevron" />,
    Menu: () => <div data-testid="icon-menu" />,
    X: () => <div data-testid="icon-x" />,
  }
})

describe("AdminNavigation", () => {
  const mockPush = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      push: mockPush,
    })
    ;(usePathname as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue("/admin/dashboard")
  })

  it("renders the sidebar title and logo", () => {
    render(<AdminNavigation />)
    expect(screen.getAllByText("Candidate Portal")).toBeTruthy()
    expect(screen.getAllByText("Admin Panel")).toBeTruthy()
    expect(screen.getAllByText("CP")).toBeTruthy()
  })

  it("renders all navigation items", () => {
    render(<AdminNavigation />)
    expect(screen.getAllByText("Dashboard")).toBeTruthy()
    expect(screen.getAllByText("Users")).toBeTruthy()
    expect(screen.getAllByText("Jobs")).toBeTruthy()
    expect(screen.getAllByText("Applications")).toBeTruthy()
    expect(screen.getAllByText("Analytics")).toBeTruthy()
    expect(screen.getAllByText("Feature Flags")).toBeTruthy()
    expect(screen.getAllByText("Frappe Environments")).toBeTruthy()
    expect(screen.getAllByText("Onboarding")).toBeTruthy()
    expect(screen.getAllByText("Company Domains")).toBeTruthy()
    expect(screen.getAllByText("SSO Providers")).toBeTruthy()
    expect(screen.getAllByText("Settings")).toBeTruthy()
  })

  it("highlights the active navigation item", () => {
    ;(usePathname as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue("/admin/users")
    render(<AdminNavigation />)
    
    // The active button should have the primary background class
    const usersButton = screen.getAllByRole("button").find(btn => 
      btn.textContent?.includes("Users")
    )
    expect(usersButton?.className).toContain("bg-primary")
  })

  it("navigates when a navigation item is clicked", async () => {
    render(<AdminNavigation />)
    const jobsButton = screen.getAllByRole("button").find(btn => 
      btn.textContent?.includes("Jobs")
    )
    
    if (jobsButton) {
      await user.click(jobsButton)
      expect(mockPush).toHaveBeenCalledWith("/admin/jobs")
    } else {
      throw new Error("Jobs button not found")
    }
  })

  it("renders badges for certain items", () => {
    render(<AdminNavigation />)
    expect(screen.getByText("New")).toBeTruthy()
    expect(screen.getByText("Beta")).toBeTruthy()
  })

  it("handles sign out correctly", async () => {
    ;(signOut as unknown as { mockResolvedValueOnce: (val: unknown) => void }).mockResolvedValueOnce({})
    render(<AdminNavigation />)
    
    // Open the dropdown first
    const profileButton = screen.getByRole("button", { name: /Admin User/i })
    await user.click(profileButton)
    
    // Click Sign Out
    const signOutButton = screen.getByText("Sign Out")
    await user.click(signOutButton)
    
    expect(signOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login")
    })
  })

  it("navigates to quick action links", async () => {
    render(<AdminNavigation />)
    const notificationsButton = screen.getByRole("button", { name: /Notifications/i })
    await user.click(notificationsButton)
    expect(mockPush).toHaveBeenCalledWith("/admin/notifications")
    
    const syncButton = screen.getByRole("button", { name: /RefreshCw Data/i })
    await user.click(syncButton)
    expect(mockPush).toHaveBeenCalledWith("/admin/sync")
  })

  it("renders user profile information", () => {
    render(<AdminNavigation />)
    expect(screen.getByText("Admin User")).toBeTruthy()
    expect(screen.getByText("admin@company.com")).toBeTruthy()
  })

  it("toggles mobile menu when menu button is clicked", async () => {
    // We need to simulate a small screen or just check if the button works
    // The button has "md:hidden" so it's technically always in the DOM for RTL
    render(<AdminNavigation />)
    
    // Initially sidebar is closed (only desktop one is hidden by CSS, but in JSDOM both might be "visible" unless we mock matchMedia)
    // Actually, SidebarContent is rendered in two places. 
    // One in a div with "hidden md:flex" (Desktop)
    // One in a div with "md:hidden" that only renders when isOpen is true (Mobile)
    
    // Find the button that contains the Menu icon
    const menuButtons = screen.getAllByRole("button")
    const toggleBtn = menuButtons.find(btn => btn.querySelector('[data-testid="icon-menu"]'))
    
    if (toggleBtn) {
      await user.click(toggleBtn)
      // Now the X icon should be visible
      expect(screen.getByTestId("icon-x")).toBeTruthy()
      
      // And the mobile sidebar should be rendered
      // The SidebarContent contains "Candidate Portal" text. 
      // It should now appear twice (once for desktop, once for mobile)
      expect(screen.getAllByText("Candidate Portal").length).toBe(2)
      
      // Clicking backdrop should close it
      const backdrop = document.querySelector('.bg-black.bg-opacity-50')
      if (backdrop) {
        await user.click(backdrop)
        expect(screen.queryByTestId("icon-x")).toBeNull()
        expect(screen.getAllByText("Candidate Portal").length).toBe(1)
      }
    }
  })
})
