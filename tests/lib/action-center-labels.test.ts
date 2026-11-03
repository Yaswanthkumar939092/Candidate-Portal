import { describe, it, expect } from "vitest"
import { actionTypeLabel, resolveTaskTitle } from "@/lib/action-center-labels"

describe("actionTypeLabel", () => {
  it.each([
    ["Job Applicant Pre Offer Form", "Pre-Offer Form"],
    ["Job Offer", "Offer Letter"],
    ["Employee Onboarding", "Onboarding"],
    ["Job Applicant", "Pre-Onboarding Form"],
    ["Direct Applicant Form Request", "Applicant Form"],
    ["CTC Proposal", "CTC Proposal"],
  ])("maps the known doctype %s to %s", (doctype, expected) => {
    expect(actionTypeLabel(doctype)).toBe(expected)
  })

  it("falls back to the doctype name for an unmapped doctype", () => {
    expect(actionTypeLabel("Salary Structure Assignment")).toBe(
      "Salary Structure Assignment"
    )
  })

  it("turns underscores into spaces and title-cases an unmapped doctype", () => {
    expect(actionTypeLabel("custom_background_check")).toBe(
      "Custom Background Check"
    )
  })

  it("returns an empty string for a blank, missing or whitespace doctype", () => {
    expect(actionTypeLabel("")).toBe("")
    expect(actionTypeLabel("   ")).toBe("")
    expect(actionTypeLabel(undefined)).toBe("")
    expect(actionTypeLabel(null)).toBe("")
  })
})

describe("resolveTaskTitle", () => {
  it("prefers a configured title over the derived action type", () => {
    expect(resolveTaskTitle("Sign your offer", "Job Offer")).toBe(
      "Sign your offer"
    )
  })

  it("derives the action type when the configured title is blank", () => {
    expect(resolveTaskTitle("", "Job Applicant Pre Offer Form")).toBe(
      "Pre-Offer Form"
    )
    expect(resolveTaskTitle("   ", "Employee Onboarding")).toBe("Onboarding")
    expect(resolveTaskTitle(undefined, "CTC Proposal")).toBe("CTC Proposal")
  })

  it("only falls back to 'Task' when the doctype is blank too", () => {
    expect(resolveTaskTitle("", "")).toBe("Task")
    expect(resolveTaskTitle(undefined, undefined)).toBe("Task")
  })
})
