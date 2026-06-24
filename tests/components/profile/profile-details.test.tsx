import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProfileDetails } from "@/components/profile/profile-details"
import type { Profile } from "@/types/database"

vi.mock("@/lib/hooks/useChangePassword", () => ({
  useChangePassword: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}))

vi.mock("@/lib/hooks/useUpdateProfile", () => ({
  useUpdateProfile: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  }),
}))

// ─── Shared mock data ────────────────────────────────────────────────
const BASE_PROFILE: Profile = {
  id: "1",
  email: "test@example.com",
  full_name: "Test User",
  avatar_url: null,
  phone: null,
  location: null,
  bio: null,
  skills: null,
  experience_level: null,
  preferred_salary_min: null,
  preferred_salary_max: null,
  preferred_job_types: null,
  role: "candidate",
  provider: "email",
  lifecycle_stage: "candidate",
  frappe_employee_id: null,
  is_internal_employee: false,
  email_domain: null,
  created_at: "2025-01-15T10:00:00.000Z",
  updated_at: "2025-06-20T08:00:00.000Z",
  last_login_at: "2025-06-20T08:00:00.000Z",
}

// =====================================================================
//  PROFILE DETAILS – SECTION HEADINGS
// =====================================================================
describe("ProfileDetails – Section Headings", () => {
  it("renders 'Account Security' heading", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("Account Security")).toBeTruthy()
  })

  it("renders 'Account Info' heading", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("Account Info")).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE DETAILS – ACCOUNT SECURITY
// =====================================================================
describe("ProfileDetails – Account Security", () => {
  it("renders password fields", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByLabelText(/Current Password/i)).toBeTruthy()
    expect(screen.getByLabelText(/^New Password/i)).toBeTruthy()
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeTruthy()
  })

  it("renders update button", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByRole("button", { name: /Update Password/i })).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE DETAILS – ACCOUNT INFO
// =====================================================================
describe("ProfileDetails – Account Info", () => {
  it("renders the user role", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("candidate")).toBeTruthy()
  })

  it("renders 'admin' role when profile role is admin", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, role: "admin" }} />)
    expect(screen.getByText("admin")).toBeTruthy()
  })


  it("renders formatted 'Last Logged In' date and time", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText(/Jun 20, 2025/)).toBeTruthy()
  })

  it("renders sign-in provider when provided", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, provider: "google" }} />)
    expect(screen.getByText("google")).toBeTruthy()
  })

  it("renders employee ID when frappe_employee_id is set", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, frappe_employee_id: "EMP-0042" }} />)
    expect(screen.getByText("EMP-0042")).toBeTruthy()
  })

  it("does not render employee ID row when frappe_employee_id is null", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.queryByText("EMP-0042")).toBeNull()
  })
})
