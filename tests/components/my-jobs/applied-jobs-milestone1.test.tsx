import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppliedJobsTimeline } from "@/components/my-jobs/applied-jobs-timeline"
import React from "react"

const detailHook = vi.fn()
vi.mock("@/lib/hooks/useApplicantStatus", () => ({
  useJobApplicantDetails: (...a: unknown[]) => detailHook(...a),
}))

const app = {
  id: "APP-AAA111",
  applied_on: "2026-10-21",
  status: "In review",
  job: { designation: "Payroll Analyst", company: null, location: null, experience_range: null, employment_type: null },
  flags: [{ status: "Open", flag: true, date: "2026-10-21" }],
}

describe("AppliedJobsTimeline in milestone 1", () => {
  it("shows the application but no View Application button, because the detail method is denied", () => {
    render(<AppliedJobsTimeline applicantName="C" applications={[app] as never} />)
    expect(screen.getByText("Payroll Analyst")).toBeTruthy()
    expect(screen.queryByText("View Application")).toBeNull()
  })

  it("never queries the applicant detail endpoint", () => {
    render(<AppliedJobsTimeline applicantName="C" applications={[app] as never} />)
    const names = detailHook.mock.calls.map((c) => c[0]).filter(Boolean)
    expect(names).toEqual([])
  })
})
