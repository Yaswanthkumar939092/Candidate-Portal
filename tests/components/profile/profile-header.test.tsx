import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProfileHeader } from "@/components/profile/profile-header"
import type { Profile } from "@/types/database"

// ─── Shared mock data ────────────────────────────────────────────────
const BASE_PROFILE: Profile = {
  id: "1",
  email: "test@example.com",
  full_name: "Alex Smith",
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
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-06-01T00:00:00.000Z",
}

// =====================================================================
//  PROFILE HEADER – NAME & INITIALS
// =====================================================================
describe("ProfileHeader – Name & Initials", () => {
  it("renders the user's full name", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.getByText("Alex Smith")).toBeTruthy()
  })

  it("shows initials when avatar_url is empty", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.getByText("AS")).toBeTruthy()
  })

  it("shows '?' initials when full_name is null", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, full_name: null }} />)
    expect(screen.getByText("?")).toBeTruthy()
  })

  it("shows initials from single-word name", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, full_name: "Madonna" }} />)
    expect(screen.getByText("M")).toBeTruthy()
  })

  it("shows at most 2 characters as initials", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, full_name: "John Michael Doe" }} />)
    expect(screen.getByText("JM")).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE HEADER – LIFECYCLE BADGE
// =====================================================================
describe("ProfileHeader – Lifecycle Badge", () => {
  it("shows 'Candidate' badge for candidate stage", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, lifecycle_stage: "candidate" }} />)
    expect(screen.getByText("Candidate")).toBeTruthy()
  })

  it("shows 'Onboarding' badge for onboarding stage", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, lifecycle_stage: "onboarding" }} />)
    expect(screen.getByText("Onboarding")).toBeTruthy()
  })

  it("shows 'Employee' badge for employee stage", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, lifecycle_stage: "employee" }} />)
    expect(screen.getByText("Employee")).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE HEADER – CONTACT DETAILS
// =====================================================================
describe("ProfileHeader – Contact Details", () => {
  it("always renders the email pill", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.getByText("test@example.com")).toBeTruthy()
  })

  it("renders phone pill when phone is provided", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, phone: "+91-9876543210" }} />)
    expect(screen.getByText("+91-9876543210")).toBeTruthy()
  })

  it("does not render phone pill when phone is null", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.queryByText(/\+91/)).toBeNull()
  })

  it("renders location pill when location is provided", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, location: "Bengaluru, KA" }} />)
    expect(screen.getByText("Bengaluru, KA")).toBeTruthy()
  })

  it("does not render location pill when location is null", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.queryByText("Bengaluru, KA")).toBeNull()
  })
})

// =====================================================================
//  PROFILE HEADER – BIO
// =====================================================================
describe("ProfileHeader – Bio", () => {
  it("renders bio text when provided", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, bio: "Passionate developer." }} />)
    expect(screen.getByText("Passionate developer.")).toBeTruthy()
  })

  it("does not render bio section when bio is null", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.queryByText("Passionate developer.")).toBeNull()
  })
})
