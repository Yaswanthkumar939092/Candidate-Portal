import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"

const { mockGetSession, mockProfileFromFrappeUser } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockProfileFromFrappeUser: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    getSession: mockGetSession,
  },
  profileFromFrappeUser: mockProfileFromFrappeUser,
}))

const mockToastSuccess = vi.fn()

vi.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}))

const frappeUser = {
  id: "candidate@example.com",
  name: "candidate@example.com",
  email: "candidate@example.com",
  user_metadata: {
    full_name: "Candidate User",
    email: "candidate@example.com",
  },
}

function AuthStateProbe() {
  const { isLoading, isOnboardingComplete, profile } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="complete">{String(isOnboardingComplete)}</span>
      <span data-testid="stage">{profile?.lifecycle_stage || "none"}</span>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ user: frappeUser })
    mockProfileFromFrappeUser.mockReturnValue({
      id: frappeUser.id,
      email: frappeUser.email,
      lifecycle_stage: "candidate",
    })
  })

  // Spec: CAND-01-A2.5A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a2-5a)
  it("hydrates profile state directly from the Frappe session user", async () => {
    mockProfileFromFrappeUser.mockReturnValue({
      id: frappeUser.id,
      email: frappeUser.email,
      lifecycle_stage: "onboarded",
    })

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockProfileFromFrappeUser).toHaveBeenCalledWith(frappeUser)
    expect(screen.getByTestId("stage").textContent).toBe("onboarded")
    expect(screen.getByTestId("complete").textContent).toBe("true")
  })

  it("uses the Frappe session profile for candidate-stage users", async () => {
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockProfileFromFrappeUser).toHaveBeenCalledWith(frappeUser)
    expect(screen.getByTestId("stage").textContent).toBe("candidate")
  })

  // Spec: CAND-01-A2.4A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a2-4a)
  it("displays success toast and clears sessionStorage when showLoginToast is set to true", async () => {
    const sessionStorageSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue("true")
    const sessionStorageRemoveSpy = vi.spyOn(Storage.prototype, 'removeItem')

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockToastSuccess).toHaveBeenCalledWith("Successfully logged in!")
    expect(sessionStorageRemoveSpy).toHaveBeenCalledWith("showLoginToast")

    sessionStorageSpy.mockRestore()
    sessionStorageRemoveSpy.mockRestore()
  })
})
