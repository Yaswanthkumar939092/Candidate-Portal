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
  it("invalidates the dashboard query of the signed-in e-mail when the brand link or the Home link is clicked, and no query when another link is clicked", () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, "invalidateQueries")
    render(
      <QueryClientProvider client={client}>
        <PortalNavigation />
      </QueryClientProvider>,
    )
    const home = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/dashboard")
        expect(home).toHaveLength(2)
    for (const link of home) {
      spy.mockClear()
      fireEvent.click(link)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({ queryKey: ["dashboard", { email: "cand@example.invalid" }] })
    }

    spy.mockClear()
    const other = screen.getAllByRole("link").find((a) => a.getAttribute("href") === "/open-jobs")
    expect(other).toBeTruthy()
    fireEvent.click(other!)
    expect(spy).not.toHaveBeenCalled()
  })
})
