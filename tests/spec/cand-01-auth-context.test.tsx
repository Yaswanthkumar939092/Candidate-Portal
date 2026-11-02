import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }))

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")
  return { ...actual, auth: { ...actual.auth, getSession: mockGetSession } }
})
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"

function Probe() {
  const { user, profile, isLoading, isOnboardingComplete, refreshProfile } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <span data-testid="stage">{profile?.lifecycle_stage ?? "none"}</span>
      <span data-testid="complete">{String(isOnboardingComplete)}</span>
      <button onClick={() => void refreshProfile()}>refresh</button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("AuthProvider", () => {
  // Spec: CAND-01-A2.1A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a2-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("starts loading, then holds the user and a candidate-stage profile built from the session, with isOnboardingComplete false", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "c1", name: "c1", email: "c1@example.invalid", full_name: "Test One", user_metadata: {} } })
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(screen.getByTestId("loading").textContent).toBe("true")
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))
    expect(screen.getByTestId("user").textContent).toBe("c1@example.invalid")
    expect(screen.getByTestId("stage").textContent).toBe("candidate")
    expect(screen.getByTestId("complete").textContent).toBe("false")
    expect(mockGetSession).toHaveBeenCalledTimes(1)
  })

  // Spec: CAND-01-A2.1B (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a2-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("ends loading with no user and no profile when the session lookup rejects, and logs the error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockGetSession.mockRejectedValue(new Error("offline"))
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))
    expect(screen.getByTestId("user").textContent).toBe("none")
    expect(screen.getByTestId("stage").textContent).toBe("none")
    expect(spy).toHaveBeenCalledWith("Unexpected error initializing auth:", expect.any(Error))
    spy.mockRestore()
  })

  // Spec: CAND-01-A2.1C (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a2-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("refreshProfile reads the session again and replaces the user", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))
    expect(screen.getByTestId("user").textContent).toBe("none")

    mockGetSession.mockResolvedValueOnce({ user: { id: "c2", name: "c2", email: "c2@example.invalid", user_metadata: {} } })
    screen.getByText("refresh").click()
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("c2@example.invalid"))
    expect(mockGetSession).toHaveBeenCalledTimes(2)
  })

  // Spec: CAND-01-A2.2A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a2-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("useAuth throws a named error outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow("useAuth must be used within an AuthProvider")
    spy.mockRestore()
  })
})
