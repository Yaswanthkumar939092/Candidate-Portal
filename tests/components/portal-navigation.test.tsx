import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockSignOut = vi.fn()

vi.mock("@/lib/auth", () => ({
  auth: {
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}))

vi.mock("@/lib/contexts/auth-context")
vi.mock("@/lib/contexts/feature-flags")
vi.mock("@/lib/contexts/theme-context")
vi.mock("@/lib/hooks/useCandidateBranding")
vi.mock("@/lib/hooks/useApplicantStatus")

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}))

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react")
  return {
    ...actual,
    Home: () => <div data-testid="icon-home" />,
    Briefcase: () => <div data-testid="icon-briefcase" />,
    ClipboardList: () => <div data-testid="icon-clipboard" />,
    Globe: () => <div data-testid="icon-globe" />,
    ChevronDown: () => <div data-testid="icon-chevron" />,
    LogOut: () => <div data-testid="icon-logout" />,
    User: () => <div data-testid="icon-user" />,
    Settings: () => <div data-testid="icon-settings" />,
    Menu: () => <div data-testid="icon-menu" />,
    Sun: () => <div data-testid="icon-sun" />,
    Moon: () => <div data-testid="icon-moon" />,
  }
})

vi.mock("next/image", () => ({
  __esModule: true,
   
  default: (props: Record<string, unknown>) => <img {...(props as any)} />,
}))

import { PortalNavigation } from "@/components/portal/portal-navigation"
import * as authContext from "@/lib/contexts/auth-context"
import * as featureFlagsContext from "@/lib/contexts/feature-flags"
import * as themeContext from "@/lib/contexts/theme-context"
import * as candidateBrandingHook from "@/lib/hooks/useCandidateBranding"
import * as applicantStatusHook from "@/lib/hooks/useApplicantStatus"

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  user_metadata: {
    full_name: "John Doe",
    avatar_url: "https://example.com/avatar.jpg",
  },
}

const mockProfile = {
  full_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg",
  role: "candidate",
  lifecycle_stage: "onboarded",
}

const mockBranding = {
  title_prefix: "Physics Wallah",
  app_logo: "/brand2.png",
}

describe("PortalNavigation", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      isLoading: false,
      isOnboardingComplete: true,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof authContext.useAuth>)

    vi.mocked(featureFlagsContext.useFeatureFlags).mockReturnValue({
      isEnabled: vi.fn(() => true),
      flags: {},
      isLoading: false,
      error: null,
      refreshFlags: vi.fn(),
      getFlag: vi.fn(() => true),
    })

    vi.mocked(themeContext.useTheme).mockReturnValue({
      isDark: false,
      toggleTheme: vi.fn(),
      mode: "light",
    })

    vi.mocked(candidateBrandingHook.useCandidateBranding).mockReturnValue({
      data: mockBranding,
    } as ReturnType<typeof candidateBrandingHook.useCandidateBranding>)

    vi.mocked(applicantStatusHook.useApplicantStatus).mockReturnValue({
      data: {
        success: true,
        data: {
          id: "test@example.com",
          name: "John Doe",
          status: "Accepted",
          flags: [],
          applications: [{ id: "APP-1" }, { id: "APP-2" }],
        },
      },
    } as ReturnType<typeof applicantStatusHook.useApplicantStatus>)

    mockSignOut.mockResolvedValue(undefined)
  })

  it("renders navigation header", () => {
    render(<PortalNavigation />)
    expect(screen.getByRole("banner")).toBeTruthy()
  })

  it("displays branding logo and title", () => {
    render(<PortalNavigation />)
    expect(screen.getByText("Physics Wallah")).toBeTruthy()
  })

  it("renders navigation items on desktop", () => {
    render(<PortalNavigation />)
    expect(screen.getByText("Home")).toBeTruthy()
    expect(screen.getByText("Open Jobs")).toBeTruthy()
    expect(screen.getByText("My Jobs")).toBeTruthy()
  })

  it("renders user avatar with initials", () => {
    render(<PortalNavigation />)
    const avatar = screen.getByText("JD")
    expect(avatar).toBeTruthy()
  })

  it("displays user display name", () => {
    render(<PortalNavigation />)
    expect(screen.getByText("John Doe")).toBeTruthy()
  })

  it("displays user email", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(document.body.querySelector('[role="menu"]')).toBeTruthy()
      const email = document.body.querySelector('[role="menu"] p.text-xs')
      expect(email?.textContent).toContain("test@example.com")
    }
  })

  it("displays language selector", () => {
    render(<PortalNavigation />)
    expect(screen.getByText("EN")).toBeTruthy()
    expect(screen.getByTestId("icon-globe")).toBeTruthy()
  })

  it("renders user dropdown trigger", () => {
    render(<PortalNavigation />)
    expect(screen.getByText("John Doe")).toBeTruthy()
  })

  it("opens user dropdown menu when clicked", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Profile")).toBeTruthy()
      expect(screen.getByText("Settings")).toBeTruthy()
      expect(screen.getByText("Sign Out")).toBeTruthy()
    }
  })

  it("displays user role in dropdown", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Onboarded")).toBeTruthy()
    }
  })

  it("renders theme toggle button in dropdown", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Dark mode")).toBeTruthy()
    }
  })

  it("calls toggleTheme when theme button clicked", async () => {
    const mockToggleTheme = vi.fn()
    vi.mocked(themeContext.useTheme).mockReturnValue({
      isDark: false,
      toggleTheme: mockToggleTheme,
      mode: "light",
    })

    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      await user.click(screen.getByText("Dark mode"))
      expect(mockToggleTheme).toHaveBeenCalled()
    }
  })

  it("renders profile link in dropdown", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Profile")).toBeTruthy()
    }
  })

  it("renders settings link in dropdown", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Settings")).toBeTruthy()
    }
  })

  it("renders sign out button in dropdown", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Sign Out")).toBeTruthy()
    }
  })

  it("calls signOut when Sign Out clicked", async () => {
    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      await user.click(screen.getByText("Sign Out"))
      expect(mockSignOut).toHaveBeenCalled()
    }
  })

  it("displays live badge count for My Jobs", () => {
    render(<PortalNavigation />)
    const badges = screen.getAllByText("2")
    expect(badges.length).toBeGreaterThan(0)
  })

  it("hides My Jobs badge when there are no applications", () => {
    vi.mocked(applicantStatusHook.useApplicantStatus).mockReturnValue({
      data: {
        success: true,
        data: {
          id: "test@example.com",
          name: "John Doe",
          status: "Open",
          flags: [],
          applications: [],
        },
      },
    } as ReturnType<typeof applicantStatusHook.useApplicantStatus>)

    render(<PortalNavigation />)
    expect(screen.queryByText("2")).toBeNull()
  })

  it("filters nav items by feature flags", () => {
    vi.mocked(featureFlagsContext.useFeatureFlags).mockReturnValue({
      isEnabled: vi.fn((flag: string) => flag !== "action_center"),
      flags: {},
      isLoading: false,
      error: null,
      refreshFlags: vi.fn(),
      getFlag: vi.fn(() => false),
    })

    render(<PortalNavigation />)
    expect(screen.getByText("Open Jobs")).toBeTruthy()
    expect(screen.queryByText("Action Center")).toBeNull()
  })

  it("handles missing profile gracefully", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      profile: null,
    } as unknown as ReturnType<typeof authContext.useAuth>)

    render(<PortalNavigation />)
    expect(screen.getByText("John Doe")).toBeTruthy()
  })

  it("displays email as fallback for display name", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: { ...mockUser, user_metadata: {} },
      profile: null,
    } as unknown as ReturnType<typeof authContext.useAuth>)

    render(<PortalNavigation />)
    const namePrefix = mockUser.email.split("@")[0]
    expect(screen.getByText(namePrefix)).toBeTruthy()
  })

  it("renders mobile menu button on small screens", () => {
    render(<PortalNavigation />)
    const menuButton = screen.getByRole("button", { name: /Toggle menu/i })
    expect(menuButton).toBeTruthy()
  })

  it("applies custom className prop", () => {
    const { container } = render(<PortalNavigation className="custom-nav" />)
    expect(container.querySelector(".custom-nav")).toBeTruthy()
  })

  it("displays dark mode toggle when in dark theme", async () => {
    vi.mocked(themeContext.useTheme).mockReturnValue({
      isDark: true,
      toggleTheme: vi.fn(),
      mode: "dark",
    })

    render(<PortalNavigation />)
    const trigger = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("John Doe")
    )
    expect(trigger).toBeTruthy()
    if (trigger) {
      await user.click(trigger)
      expect(screen.getByText("Light mode")).toBeTruthy()
    }
  })

  it("displays avatar initials when image loads", () => {
    // Radix Avatar shows fallback (initials) in jsdom since images don't load
    render(<PortalNavigation />)
    expect(screen.getByText("JD")).toBeTruthy()
  })

  it("renders navigation icons in mobile menu", async () => {
    render(<PortalNavigation />)
    const menuBtn = screen.getByRole("button", { name: /Toggle menu/i })
    await user.click(menuBtn)
    // Icons render inside the Sheet portal
    expect(document.body.querySelector('[data-testid="icon-home"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="icon-briefcase"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="icon-clipboard"]')).toBeTruthy()
  })

  it("handles user with single name", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      profile: { ...mockProfile, full_name: "Madonna" },
    } as unknown as ReturnType<typeof authContext.useAuth>)

    render(<PortalNavigation />)
    expect(screen.getByText("M")).toBeTruthy()
  })

  it("hides navigation links and mobile menu when hideNavLinks is true", () => {
    render(<PortalNavigation hideNavLinks={true} />)
    expect(screen.queryByText("Home")).toBeNull()
    expect(screen.queryByText("Open Jobs")).toBeNull()
    expect(screen.queryByText("My Jobs")).toBeNull()
    expect(screen.queryByRole("button", { name: /Toggle menu/i })).toBeNull()
  })
})
