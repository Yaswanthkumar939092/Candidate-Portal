import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/lib/auth", () => ({ auth: { signOut: vi.fn() } }))
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "cand@example.invalid", user_metadata: {} },
    profile: { full_name: "Test Candidate", role: "candidate" },
  }),
}))
vi.mock("@/lib/contexts/feature-flags", () => ({ useFeatureFlags: () => ({ isEnabled: () => true }) }))
vi.mock("@/lib/contexts/theme-context", () => ({ useTheme: () => ({ isDark: false, toggleTheme: vi.fn() }) }))
vi.mock("@/lib/hooks/useCandidateBranding", () => ({ useCandidateBranding: () => ({ data: { title_prefix: "Test", app_logo: "/logo.png" } }) }))
vi.mock("@/lib/hooks/useApplicantStatus", () => ({ useApplicantStatus: () => ({ data: undefined }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/open-jobs" }))
vi.mock("next/image", () => ({ __esModule: true, default: (p: Record<string, unknown>) => <img alt="" {...p} /> }))

import { PortalNavigation } from "@/components/portal/portal-navigation"

describe("portal navigation and the dashboard query (characterization)", () => {
  // Spec: CAND-04-A6.2D (docs/spec/clauses/04-dashboard.md#cand-04-a6-2d)
  // Characterization: pins current behaviour, not endorsed.
  it("invalidates the dashboard query of the signed-in e-mail when the brand link (now /open-jobs) is clicked, offers no Home link, and invalidates nothing for a nav link", () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, "invalidateQueries")
    render(
      <QueryClientProvider client={client}>
        <PortalNavigation />
      </QueryClientProvider>,
    )
    expect(screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/dashboard")).toHaveLength(0)

    const brand = screen.getAllByRole("link").find((a) => a.querySelector("img"))
    expect(brand?.getAttribute("href")).toBe("/open-jobs")
    fireEvent.click(brand!)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({ queryKey: ["dashboard", { email: "cand@example.invalid" }] })

    spy.mockClear()
    const other = screen.getAllByRole("link").find((a) => a.textContent?.includes("Open Jobs"))
    expect(other?.getAttribute("href")).toBe("/open-jobs")
    fireEvent.click(other!)
    expect(spy).not.toHaveBeenCalled()
  })
})