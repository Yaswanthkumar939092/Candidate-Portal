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

const supabaseUser = {
  ...frappeUser,
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "550e8400-e29b-41d4-a716-446655440000",
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

  it("hydrates the stored candidate profile for UUID users before computing onboarding completion", async () => {
    mockGetSession.mockResolvedValue({ user: supabaseUser })
    mockGetProfile.mockResolvedValue({
      id: supabaseUser.id,
      email: supabaseUser.email,
      lifecycle_stage: "onboarded",
    })

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockGetProfile).toHaveBeenCalledWith(supabaseUser.id)
    expect(screen.getByTestId("stage").textContent).toBe("onboarded")
    expect(screen.getByTestId("complete").textContent).toBe("true")
  })

  it("falls back to the Frappe session profile when no stored UUID profile exists", async () => {
    mockGetSession.mockResolvedValue({ user: supabaseUser })
    mockGetProfile.mockResolvedValue(null)

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockProfileFromFrappeUser).toHaveBeenCalledWith(supabaseUser)
    expect(screen.getByTestId("stage").textContent).toBe("candidate")
    expect(screen.getByTestId("complete").textContent).toBe("false")
  })

  it("does not query Supabase profiles with Frappe email identifiers", async () => {
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

    expect(mockGetProfile).not.toHaveBeenCalled()
    expect(mockProfileFromFrappeUser).toHaveBeenCalledWith(frappeUser)
    expect(screen.getByTestId("stage").textContent).toBe("candidate")
  })

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
