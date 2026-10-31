import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

const { mockUseAuth, mockPush, mockReplace, mockPathname, mockRedirect, mockServerFlag, navProps } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockPathname: vi.fn(),
  mockRedirect: vi.fn(),
  mockServerFlag: vi.fn(),
  navProps: { last: null as null | Record<string, unknown> },
}))

vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: () => mockUseAuth() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname(),
  redirect: (to: string) => mockRedirect(to),
}))
vi.mock("@/components/portal/portal-navigation", () => ({
  PortalNavigation: (props: Record<string, unknown>) => {
    navProps.last = props
    return <div data-testid="portal-nav" />
  },
}))
vi.mock("@/components/portal/survey-offer-navigation", () => ({
  SurveyOfferNavigation: () => <div data-testid="survey-nav" />,
}))
vi.mock("@/lib/contexts/feature-flags", () => ({
  FeatureFlagProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="flag-provider">{children}</div>,
  FeatureFlagLoader: ({ children }: { children: React.ReactNode }) => <div data-testid="flag-loader">{children}</div>,
}))
vi.mock("@/lib/server/feature-flags", () => ({ isServerFeatureEnabled: (key: string) => mockServerFlag(key) }))
vi.mock("@/lib/hooks/usePublicBranding", () => ({ usePublicBranding: () => ({ data: undefined }) }))
vi.mock("@/components/brand-lockup", () => ({ BrandLockup: () => <span data-testid="brand" /> }))

import PortalLayout from "@/app/(portal)/layout"
import PublicLayout from "@/app/(public)/layout"
import { CareersShell } from "@/components/careers/careers-shell"

const candidate = { id: "CAND-TEST-0001@example.invalid", email: "CAND-TEST-0001@example.invalid" }

beforeEach(() => {
  vi.clearAllMocks()
  navProps.last = null
  mockPathname.mockReturnValue("/dashboard")
})

describe("portal layout guard", () => {
  // Spec: CAND-01-A1.1A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows a spinner while loading, nothing and a push to /login without a user, and the page with a user", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true })
    const first = render(<PortalLayout><p>page body</p></PortalLayout>)
    expect(screen.getByText("Loading...")).toBeTruthy()
    expect(screen.queryByText("page body")).toBeNull()
    expect(mockPush).not.toHaveBeenCalled()
    first.unmount()

    mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    const second = render(<PortalLayout><p>page body</p></PortalLayout>)
    expect(second.container.innerHTML).toBe("")
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"))
    second.unmount()

    mockPush.mockClear()
    mockUseAuth.mockReturnValue({ user: candidate, isLoading: false })
    render(<PortalLayout><p>page body</p></PortalLayout>)
    expect(screen.getByText("page body")).toBeTruthy()
    expect(screen.getByTestId("flag-provider")).toBeTruthy()
    expect(screen.getByTestId("portal-nav")).toBeTruthy()
    expect(mockPush).not.toHaveBeenCalled()
  })

  // Spec: CAND-01-A1.1B (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("swaps the navigation on /survey and hides the nav links on /profile", () => {
    mockUseAuth.mockReturnValue({ user: candidate, isLoading: false })

    mockPathname.mockReturnValue("/survey")
    const survey = render(<PortalLayout><p>x</p></PortalLayout>)
    expect(screen.getByTestId("survey-nav")).toBeTruthy()
    expect(screen.queryByTestId("portal-nav")).toBeNull()
    expect(survey.container.querySelector("main")?.className).toBe("flex-1 pt-16")
    survey.unmount()

    mockPathname.mockReturnValue("/profile")
    render(<PortalLayout><p>x</p></PortalLayout>)
    expect(screen.getByTestId("portal-nav")).toBeTruthy()
    expect(navProps.last).toEqual({ hideNavLinks: true })
  })
})

describe("public layout gate", () => {
  // Spec: CAND-01-A1.2A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("redirects to /login when careers_public_enabled is off and renders the careers shell when it is on", async () => {
    mockServerFlag.mockResolvedValue(false)
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT")
    })
    await expect(PublicLayout({ children: <p>careers body</p> })).rejects.toThrow("NEXT_REDIRECT")
    expect(mockServerFlag).toHaveBeenCalledWith("careers_public_enabled")
    expect(mockRedirect).toHaveBeenCalledWith("/login")

    mockRedirect.mockReset()
    mockServerFlag.mockResolvedValue(true)
    mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    const element = await PublicLayout({ children: <p>careers body</p> })
    expect(mockRedirect).not.toHaveBeenCalled()
    render(element)
    expect(screen.getByText("careers body")).toBeTruthy()
    expect(screen.getByLabelText("Careers home")).toBeTruthy()
  })
})

describe("careers shell for a signed-in visitor", () => {
  // Spec: CAND-01-A1.3A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("renders nothing and replaces the URL with the portal page that matches the careers page", async () => {
    mockUseAuth.mockReturnValue({ user: candidate, isLoading: false })
    mockPathname.mockReturnValue("/jobs")
    window.history.pushState({}, "", "/jobs?job=HR-OPN-TEST-1")
    const { container } = render(<CareersShell><p>careers body</p></CareersShell>)
    expect(container.innerHTML).toBe("")
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/open-jobs?job=HR-OPN-TEST-1"))
    window.history.pushState({}, "", "/")
  })

  // Spec: CAND-01-A1.3B (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("renders the careers header and children for a guest and does not redirect", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    mockPathname.mockReturnValue("/ai-match")
    render(<CareersShell><p>careers body</p></CareersShell>)
    expect(screen.getByText("careers body")).toBeTruthy()
    const current = screen.getAllByRole("link", { name: "AI Resume / Job Match" })
    expect(current).toHaveLength(2)
    for (const link of current) expect(link.getAttribute("aria-current")).toBe("page")
    for (const link of screen.getAllByRole("link", { name: "Home" })) expect(link.getAttribute("aria-current")).toBeNull()
    expect(screen.getByRole("link", { name: "Login" }).getAttribute("href")).toBe("/login?redirect=%2Fdashboard")
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
