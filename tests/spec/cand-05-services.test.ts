import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: { get: vi.fn(), post: vi.fn() },
}))

import { candidateOnboardingService, transformOnboardingForm } from "@/lib/services/candidate-onboarding"
import { linkFieldService } from "@/lib/services/link-field"
import { FrappeAPI } from "@/lib/frappe-api"

const get = vi.mocked(FrappeAPI.get)
const post = vi.mocked(FrappeAPI.post)

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("candidateOnboardingService.getOnboardingForm", () => {
  // Spec: CAND-05-A8.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends the signed-in e-mail as job_applicant_id to the candidate-portal form method and renames the backend fields", async () => {
    get.mockResolvedValue({
      status: "success",
      job_applicant: "CAND-TEST-0001",
      boarding_status: "Pending",
      tabs: [],
      field_status_counts: { total: 3, approved: 1, rejected: 0, pending: 2, filled: 1 },
      branding: { company_name: "Test Company" },
      joining: { date_of_joining: "2026-01-05" },
      key_contacts: [{ name: "Test Buddy" }],
      onboarding_journey: { title: "Journey", steps: [] },
      form_source: "Employee Onboarding",
      onboarding_name: "ONB-TEST-0001",
      pre_release_name: null,
    } as never)

    const form = await candidateOnboardingService.getOnboardingForm("cand@example.invalid")

    expect(get).toHaveBeenCalledWith("recruitment.api.candidate_portal.get_candidate_portal_form", {
      job_applicant_id: "cand@example.invalid",
    })
    expect(form.applicantId).toBe("CAND-TEST-0001")
    expect(form.status).toBe("Pending")
    expect(form.form_source).toBe("Employee Onboarding")
    // onboarding_name, pre_release_name and the response status are dropped by the transform.
    expect(Object.keys(form).sort()).toEqual([
      "applicantId",
      "branding",
      "field_status_counts",
      "form_source",
      "joining",
      "key_contacts",
      "onboarding_journey",
      "status",
      "tabs",
    ])
  })

  // Spec: CAND-05-A8.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("throws the same fixed text for a null reply and for any status other than success", async () => {
    get.mockResolvedValueOnce(null as never)
    await expect(candidateOnboardingService.getOnboardingForm("cand@example.invalid")).rejects.toThrow(
      "Failed to fetch onboarding form",
    )

    get.mockResolvedValueOnce({ status: "error", message: "Applicant not found" } as never)
    await expect(candidateOnboardingService.getOnboardingForm("cand@example.invalid")).rejects.toThrow(
      "Failed to fetch onboarding form",
    )
  })
})

describe("candidateOnboardingService.submitOnboarding", () => {
  // Spec: CAND-05-A8.2A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("flattens every step into one document, fixes boarding_status to Pending and fills today's date for the begin and joining dates", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-04T10:00:00.000Z"))
    post.mockResolvedValue({ status: "success", message: "Saved" } as never)

    const result = await candidateOnboardingService.submitOnboarding(
      { personal_info: { first_name: "Test", skipped: undefined }, bank: { custom_ifsc_code: "SBIN0123456" } },
      "cand@example.invalid",
      "save",
    )

    expect(result).toEqual({ success: true, message: "Saved" })
    expect(post).toHaveBeenCalledWith("recruitment.api.employee_onboarding.update_onboarding_details", {
      email: "cand@example.invalid",
      data: {
        boarding_status: "Pending",
        custom_email: "cand@example.invalid",
        boarding_begins_on: "2026-03-04",
        notify_users_by_email: 1,
        first_name: "Test",
        custom_ifsc_code: "SBIN0123456",
        date_of_joining: "2026-03-04",
      },
      action: "save",
    })
  })

  // Spec: CAND-05-A8.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("prefers custom_date_of_joining over today and lets a later step overwrite an earlier step's field of the same name", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-04T10:00:00.000Z"))
    post.mockResolvedValue({ status: "success", message: "Saved" } as never)

    await candidateOnboardingService.submitOnboarding(
      {
        a_step: { custom_date_of_joining: "2026-06-01", first_name: "First" },
        b_step: { first_name: "Second" },
      },
      "cand@example.invalid",
      "submit",
    )

    const payload = post.mock.calls[0][1] as { data: Record<string, unknown> }
    expect(payload.data.date_of_joining).toBe("2026-06-01")
    expect(payload.data.first_name).toBe("Second")
  })

  // Spec: CAND-05-A8.2C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("refuses an empty e-mail before any request and reports Submission failed when the reply has no message", async () => {
    await expect(candidateOnboardingService.submitOnboarding({}, "", "save")).rejects.toThrow("User email is required")
    expect(post).not.toHaveBeenCalled()

    post.mockResolvedValueOnce({ status: "error" } as never)
    await expect(candidateOnboardingService.submitOnboarding({}, "cand@example.invalid", "save")).rejects.toThrow(
      "Submission failed",
    )

    post.mockResolvedValueOnce(null as never)
    await expect(candidateOnboardingService.submitOnboarding({}, "cand@example.invalid", "save")).rejects.toThrow(
      "Submission failed",
    )
  })
})

describe("transformOnboardingForm", () => {
  // Spec: CAND-05-A8.1C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a8-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("copies the nine fields it knows and leaves the rest undefined without reading the backend status", () => {
    const form = transformOnboardingForm({ job_applicant: "CAND-TEST-0001", boarding_status: "Draft", tabs: [] } as never)
    expect(form.applicantId).toBe("CAND-TEST-0001")
    expect(form.status).toBe("Draft")
    expect(form.branding).toBeUndefined()
    expect(form.joining).toBeUndefined()
    expect(form.key_contacts).toBeUndefined()
    expect(form.onboarding_journey).toBeUndefined()
    expect(form.field_status_counts).toBeUndefined()
    expect(form.form_source).toBeUndefined()
  })
})

describe("linkFieldService.getLinkFieldOptions", () => {
  // Spec: CAND-05-A9.1A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a9-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("encodes filters as JSON, drops an empty search text and returns the whole reply unchanged", async () => {
    const reply = { status: "success", doctype: "Designation", title_field: "name", total: 0, results: [] }
    get.mockResolvedValue(reply as never)

    const result = await linkFieldService.getLinkFieldOptions("Designation", "", { company: "Test Company" })

    expect(result).toBe(reply)
    expect(get).toHaveBeenCalledWith("recruitment.api.candidate_portal.get_link_field_options", {
      doctype: "Designation",
      filters: '{"company":"Test Company"}',
    })
  })
})
