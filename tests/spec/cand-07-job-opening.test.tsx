import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

const { get, post, resource } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), resource: vi.fn() }))
vi.mock("@/lib/frappe-api", () => ({ FrappeAPI: { get, post, getresourceDocumentData: resource } }))

import { JobOpeningService, jobApplicationService } from "@/lib/services/jobOpeningService"
import { ActionCenterMyRequestService } from "@/lib/services/action-center"
import { useJobOpening } from "@/lib/hooks/useJobOpening"
import { useGetSavedJobs } from "@/lib/hooks/useSavedJobs"

let client: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
})

describe("job application form loading", () => {
  // Spec: CAND-07-A9.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("swallows a failed field lookup, logs it and hands back an empty field list", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    get.mockRejectedValue(new Error("Permission denied"))

    await expect(jobApplicationService.getJobApplicationForm("CAND-TEST-OPN-0001")).resolves.toEqual({ fields: [] })
    expect(consoleError).toHaveBeenCalledWith("API ERROR:", expect.any(Error))
    consoleError.mockRestore()
  })

  // Spec: CAND-07-A9.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("sends the campus e-mail and invite only on the campus endpoint and leaves them off the careers one", async () => {
    get.mockResolvedValue([])

    await jobApplicationService.getJobApplicationForm("CAND-TEST-OPN-0001", false, "CAND-TEST-0001@example.invalid", "CAND-TEST-CINV-0001")
    expect(get).toHaveBeenNthCalledWith(1, "recruitment.api.channels.careers.get_application_fields", {
      opening: "CAND-TEST-OPN-0001",
    })

    await jobApplicationService.getJobApplicationForm("CAND-TEST-OPN-0001", true, "CAND-TEST-0001@example.invalid", "CAND-TEST-CINV-0001")
    expect(get).toHaveBeenNthCalledWith(2, "recruitment.api.channels.campus.get_application_fields", {
      opening: "CAND-TEST-OPN-0001",
      email: "CAND-TEST-0001@example.invalid",
      campus_invite: "CAND-TEST-CINV-0001",
    })
  })

  // Spec: CAND-07-A9.1C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("uses the campus submit endpoint only when the payload carries both the campus flag and the invite", async () => {
    post.mockResolvedValue({ status: "ok", name: "CAND-TEST-APP-0001" })

    await jobApplicationService.submitApplication({
      job_opening: "CAND-TEST-OPN-0001",
      job_applicant_email: "CAND-TEST-0001@example.invalid",
      form_data: { full_name: "Test Candidate" },
      isCampus: true,
      campus_invite: "CAND-TEST-CINV-0001",
    } as never)
    expect(post).toHaveBeenNthCalledWith(1, "recruitment.api.channels.campus.submit_invite_application", {
      campus_invite: "CAND-TEST-CINV-0001",
      job_opening: "CAND-TEST-OPN-0001",
      email: "CAND-TEST-0001@example.invalid",
      form_data: { full_name: "Test Candidate" },
    })

    const careers = {
      job_opening: "CAND-TEST-OPN-0001",
      job_applicant_email: "CAND-TEST-0001@example.invalid",
      form_data: { full_name: "Test Candidate" },
      isCampus: true,
    }
    await jobApplicationService.submitApplication(careers as never)
    expect(post).toHaveBeenNthCalledWith(2, "recruitment.api.channels.careers.submit_application", careers)
  })

  // Spec: CAND-07-A9.1D (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("stringifies the page and limit of the opening list and leaves out an empty search term or e-mail", async () => {
    get.mockResolvedValue({ openings: [] })

    await JobOpeningService.getJobOpening(2, 25, "", "")
    expect(get).toHaveBeenNthCalledWith(1, "recruitment.api.channels.careers.list_openings", { page: "2", limit: "25" })

    await JobOpeningService.getJobOpening(1, 10, "engineer", "CAND-TEST-0001@example.invalid")
    expect(get).toHaveBeenNthCalledWith(2, "recruitment.api.channels.careers.list_openings", {
      page: "1",
      limit: "10",
      search_term: "engineer",
      email: "CAND-TEST-0001@example.invalid",
    })
  })
})

describe("candidate raise request listing", () => {
  // Spec: CAND-07-A9.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("asks the Candidate Raise Request resource with a percent-encoded doctype and returns only the data field", async () => {
    resource.mockResolvedValue({ data: [{ name: "CAND-TEST-REQ-0001" }] })
    const rows = await ActionCenterMyRequestService.getActionCenterMyRequestService(3, 5, "CAND-TEST-0001@example.invalid")

    expect(rows).toEqual([{ name: "CAND-TEST-REQ-0001" }])
    expect(resource).toHaveBeenCalledWith("Candidate%20Raise%20Request", {
      method: "GET",
      page: 3,
      limit: 5,
      fields: ["*"],
      filters: [["candidate_email", "=", "CAND-TEST-0001@example.invalid"]],
    })
  })
})

describe("opening list hook", () => {
  // Spec: CAND-07-A10.1A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a10-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("stays idle only when enabled is explicitly false and keys the list on every list parameter", async () => {
    get.mockResolvedValue({ openings: [] })

    const off = renderHook(() => useJobOpening({ page: 1, limit: 10, enabled: false }), { wrapper })
    expect(off.result.current.fetchStatus).toBe("idle")
    expect(get).not.toHaveBeenCalled()

    const on = renderHook(
      () => useJobOpening({ page: 2, limit: 5, searchTerm: "engineer", email: "CAND-TEST-0001@example.invalid" }),
      { wrapper },
    )
    await waitFor(() => expect(on.result.current.isSuccess).toBe(true))
    expect(client.getQueryCache().findAll().map((q) => q.queryKey)).toContainEqual([
      "job-opening",
      2,
      5,
      "engineer",
      "CAND-TEST-0001@example.invalid",
      undefined,
    ])
  })

  // Spec: CAND-07-A10.1B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a10-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("builds a single-page result from a flat campus reply and falls back to a limit of ten when the invite lists nothing", async () => {
    get.mockResolvedValue({ openings: [] })

    const { result } = renderHook(
      () => useJobOpening({ page: 3, limit: 25, campusInvite: "CAND-TEST-CINV-0001" }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      columns: [],
      search_filters: [],
      openings: [],
      pagination: { total: 0, page: 1, limit: 10, total_pages: 1, has_more: false },
    })
    expect(get).toHaveBeenCalledWith("recruitment.api.channels.campus.get_invite_openings", {
      campus_invite: "CAND-TEST-CINV-0001",
    })
  })

  // Spec: CAND-07-A10.2A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a10-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("holds the saved-jobs query back until an e-mail is known and never retries the lookup", async () => {
    get.mockRejectedValue(new Error("Permission denied"))

    const idle = renderHook(() => useGetSavedJobs(""), { wrapper })
    expect(idle.result.current.fetchStatus).toBe("idle")
    expect(get).not.toHaveBeenCalled()

    const { result } = renderHook(() => useGetSavedJobs("CAND-TEST-0001@example.invalid"), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(get).toHaveBeenCalledTimes(1)
    expect(client.getQueryCache().findAll().map((q) => q.queryKey)).toContainEqual([
      "saved-jobs",
      "CAND-TEST-0001@example.invalid",
    ])
  })
})
