import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

const h = vi.hoisted(() => ({ push: vi.fn(), auth: { value: { user: null as unknown, isLoading: false } }, query: { value: "campus_invite=CINV-TEST-1&email=a%40example.invalid" } }))

vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: () => h.auth.value }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push }),
  useSearchParams: () => new URLSearchParams(h.query.value),
}))
vi.mock("@/lib/hooks/useJobOpening", () => ({ useJobOpening: () => ({ data: undefined, isLoading: true }) }))
vi.mock("@/components/portal/portal-navigation", () => ({ PortalNavigation: () => <div data-testid="nav" /> }))
vi.mock("@/lib/contexts/job-application-context", () => ({ JobAppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>, useJobApp: () => ({}) }))
vi.mock("@/lib/contexts/feature-flags", () => ({ FeatureFlagProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock("@/lib/auth", () => ({ auth: { signOut: vi.fn() } }))

import CampusApplyPage from "@/app/campus-apply/page"

beforeEach(() => {
  vi.clearAllMocks()
  h.query.value = "campus_invite=CINV-TEST-1&email=a%40example.invalid"
})

describe("campus-apply route guard", () => {
  // Spec: CAND-01-A1.4A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends a signed-out visitor to /login with the whole campus-apply URL, query included, encoded in redirect and renders nothing", async () => {
    h.auth.value = { user: null, isLoading: false }
    const { container } = render(<CampusApplyPage />)
    await waitFor(() => expect(h.push).toHaveBeenCalledTimes(1))
    expect(h.push).toHaveBeenCalledWith("/login?redirect=" + encodeURIComponent("/campus-apply?campus_invite=CINV-TEST-1&email=a%40example.invalid"))
    expect(container.innerHTML).toBe("")
  })

  // Spec: CAND-01-A1.4B (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a1-4b)
  // Characterization: pins current behaviour, not endorsed.
  it("shows a verifying message and does not redirect while auth is loading, and does not redirect a signed-in visitor", async () => {
    h.auth.value = { user: null, isLoading: true }
    const first = render(<CampusApplyPage />)
    expect(screen.getByText("Verifying authorization status...")).toBeTruthy()
    expect(h.push).not.toHaveBeenCalled()
    first.unmount()

    h.auth.value = { user: { email: "a@example.invalid" }, isLoading: false }
    render(<CampusApplyPage />)
    expect(screen.getByTestId("nav")).toBeTruthy()
    expect(h.push).not.toHaveBeenCalled()
  })
})
