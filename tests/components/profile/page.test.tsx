import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfilePage from "@/app/(portal)/profile/page"
import type { Profile } from "@/types/database"

// ─── Shared mock data ────────────────────────────────────────────────
const MOCK_PROFILE: Profile = {
  id: "test-user-id",
  email: "jane.doe@example.com",
  full_name: "Jane Doe",
  avatar_url: null,
  phone: "+91-9876543210",
  location: "Noida, UP",
  bio: null,
  skills: ["React", "TypeScript"],
  experience_level: "mid",
  preferred_salary_min: null,
  preferred_salary_max: null,
  preferred_job_types: ["full-time"],
  role: "candidate",
  provider: "email",
  lifecycle_stage: "onboarding",
  frappe_employee_id: null,
  is_internal_employee: false,
  email_domain: null,
  created_at: "2025-01-15T10:00:00.000Z",
  updated_at: "2025-06-01T08:00:00.000Z",
}

// ─── Mocks ──────────────────────────────────────────────────────────
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

const mockUseAuth = vi.fn()
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}))

const user = userEvent.setup()

// =====================================================================
//  PROFILE PAGE – LOADING STATE
// =====================================================================
describe("ProfilePage – Loading State", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows a loading spinner while auth is resolving", () => {
    mockUseAuth.mockReturnValue({ profile: null, isLoading: true })
    render(<ProfilePage />)
    expect(screen.getByText(/Loading profile/i)).toBeTruthy()
  })

  it("does not render profile content while loading", () => {
    mockUseAuth.mockReturnValue({ profile: null, isLoading: true })
    render(<ProfilePage />)
    expect(screen.queryByText("My Profile")).toBeNull()
  })
})

// =====================================================================
//  PROFILE PAGE – NO PROFILE STATE
// =====================================================================
describe("ProfilePage – No Profile State", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows fallback message when profile is null", () => {
    mockUseAuth.mockReturnValue({ profile: null, isLoading: false })
    render(<ProfilePage />)
    expect(screen.getByText(/No profile found/i)).toBeTruthy()
  })

  it("does not render the page heading when profile is null", () => {
    mockUseAuth.mockReturnValue({ profile: null, isLoading: false })
    render(<ProfilePage />)
    expect(screen.queryByText("My Profile")).toBeNull()
  })
})

// =====================================================================
//  PROFILE PAGE – CONTENT
// =====================================================================
describe("ProfilePage – Content", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ profile: MOCK_PROFILE, isLoading: false })
  })

  it("renders the 'My Profile' heading", () => {
    render(<ProfilePage />)
    expect(screen.getByRole("heading", { level: 1, name: /My Profile/i })).toBeTruthy()
  })

  it("renders the subtitle", () => {
    render(<ProfilePage />)
    expect(screen.getByText(/personal information and preferences/i)).toBeTruthy()
  })

  it("renders the user's full name", () => {
    render(<ProfilePage />)
    expect(screen.getByText("Jane Doe")).toBeTruthy()
  })

  it("renders the user's email", () => {
    render(<ProfilePage />)
    expect(screen.getByText("jane.doe@example.com")).toBeTruthy()
  })

  it("renders the lifecycle stage badge", () => {
    render(<ProfilePage />)
    expect(screen.getByText("Onboarding")).toBeTruthy()
  })

  it("renders the Sign Out button", () => {
    render(<ProfilePage />)
    expect(screen.getByRole("button", { name: /Sign Out/i })).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE PAGE – SIGN OUT
// =====================================================================
describe("ProfilePage – Sign Out", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ profile: MOCK_PROFILE, isLoading: false })
  })

  it("calls supabase.auth.signOut when Sign Out is clicked", async () => {
    const { supabase } = await import("@/lib/supabase")
    render(<ProfilePage />)
    await user.click(screen.getByRole("button", { name: /Sign Out/i }))
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    })
  })

  it("redirects to '/' after signing out", async () => {
    render(<ProfilePage />)
    await user.click(screen.getByRole("button", { name: /Sign Out/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })
})
