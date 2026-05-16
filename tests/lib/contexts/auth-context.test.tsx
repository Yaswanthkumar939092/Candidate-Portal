import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"

const { mockGetSession, mockGetProfile, mockProfileFromFrappeUser } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetProfile: vi.fn(),
  mockProfileFromFrappeUser: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    getSession: mockGetSession,
  },
  getProfile: mockGetProfile,
  profileFromFrappeUser: mockProfileFromFrappeUser,
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

  it("hydrates the stored candidate profile before computing onboarding completion", async () => {
    mockGetProfile.mockResolvedValue({
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

    expect(mockGetProfile).toHaveBeenCalledWith(frappeUser.id)
    expect(screen.getByTestId("stage").textContent).toBe("onboarded")
    expect(screen.getByTestId("complete").textContent).toBe("true")
  })

  it("falls back to the Frappe session profile when no stored profile exists", async () => {
    mockGetProfile.mockResolvedValue(null)

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockProfileFromFrappeUser).toHaveBeenCalledWith(frappeUser)
    expect(screen.getByTestId("stage").textContent).toBe("candidate")
    expect(screen.getByTestId("complete").textContent).toBe("false")
  })
})
