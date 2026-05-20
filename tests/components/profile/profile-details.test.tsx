import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProfileDetails } from "@/components/profile/profile-details"
import type { Profile } from "@/types/database"

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
}

// =====================================================================
//  PROFILE DETAILS – SECTION HEADINGS
// =====================================================================
describe("ProfileDetails – Section Headings", () => {
  it("renders 'Professional Preferences' heading", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("Professional Preferences")).toBeTruthy()
  })

  it("renders 'Account Info' heading", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("Account Info")).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE DETAILS – PROFESSIONAL PREFERENCES
// =====================================================================
describe("ProfileDetails – Professional Preferences", () => {
  it("shows 'No preferences set yet' when all preference fields are null", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText(/No preferences set yet/i)).toBeTruthy()
  })

  it("shows experience level when set", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, experience_level: "mid" }} />)
    expect(screen.getByText("Mid Level")).toBeTruthy()
  })

  it("shows 'Senior' label for senior experience level", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, experience_level: "senior" }} />)
    expect(screen.getByText("Senior")).toBeTruthy()
  })

  it("renders skill badges when skills are provided", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, skills: ["React", "Node.js"] }} />)
    expect(screen.getByText("React")).toBeTruthy()
    expect(screen.getByText("Node.js")).toBeTruthy()
  })

  it("renders job type badges when preferred_job_types are provided", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, preferred_job_types: ["full-time", "contract"] }} />)
    expect(screen.getByText("Full Time")).toBeTruthy()
    expect(screen.getByText("Contract")).toBeTruthy()
  })

  it("hides 'No preferences' message when at least one preference is set", () => {
    render(<ProfileDetails profile={{ ...BASE_PROFILE, experience_level: "entry" }} />)
    expect(screen.queryByText(/No preferences set yet/i)).toBeNull()
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

  it("renders formatted 'Member Since' date", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("Jan 15, 2025")).toBeTruthy()
  })

  it("renders formatted 'Last Updated' date", () => {
    render(<ProfileDetails profile={BASE_PROFILE} />)
    expect(screen.getByText("Jun 20, 2025")).toBeTruthy()
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
