import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const h = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock("@/lib/frappe-api", () => ({ FrappeAPI: { get: h.get } }))

import { useDashboard } from "@/lib/hooks/useDashboard"
import { useApplicantStatus, useJobApplicantDetails } from "@/lib/hooks/useApplicantStatus"
import { dashboardService } from "@/lib/services/dashboard"
import { ApplicantStatusResponse } from "@/lib/services/applicantStatusService"

function setup() {
  const client = new QueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("dashboard service and hooks (characterization)", () => {
  // Spec: CAND-04-A6.1D (docs/spec/clauses/04-dashboard.md#cand-04-a6-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("uses the default failure text when the backend says unsuccessful without a message, and returns data untouched on success", async () => {
    h.get.mockResolvedValueOnce({ success: false })
    await expect(dashboardService.getDashboardData("cand@example.invalid")).rejects.toThrow("Failed to fetch dashboard")
    h.get.mockResolvedValueOnce({ success: false, message: "" })
    await expect(dashboardService.getDashboardData("cand@example.invalid")).rejects.toThrow("Failed to fetch dashboard")

    const data = { name: "n" }
    h.get.mockResolvedValueOnce({ success: true, message: "ignored", data })
    await expect(dashboardService.getDashboardData("cand@example.invalid")).resolves.toBe(data)
    expect(h.get).toHaveBeenLastCalledWith("recruitment.api.onboarding_dashboard.get_dashboard", { email: "cand@example.invalid" })
    expect(h.get).toHaveBeenCalledTimes(3)
  })

  // Spec: CAND-04-A6.2C (docs/spec/clauses/04-dashboard.md#cand-04-a6-2c)
  // Characterization: pins current behaviour, not endorsed.
  it("keys the dashboard query by e-mail, holds it for five minutes and sends no request without an e-mail", async () => {
    const { client, wrapper } = setup()
    h.get.mockResolvedValue({ success: true, data: { name: "n" } })
    const { result } = renderHook(() => useDashboard("cand@example.invalid"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const query = client.getQueryCache().find({ queryKey: ["dashboard", { email: "cand@example.invalid" }] })
    expect(query).toBeTruthy()
    expect(query!.observers[0].options.staleTime).toBe(5 * 60 * 1000)
    expect(h.get).toHaveBeenCalledTimes(1)

    const idle = setup()
    const off = renderHook(() => useDashboard(""), { wrapper: idle.wrapper })
    expect(off.result.current.fetchStatus).toBe("idle")
    expect(h.get).toHaveBeenCalledTimes(1)
  })

  // Spec: CAND-04-A6.3C (docs/spec/clauses/04-dashboard.md#cand-04-a6-3c)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the backend reply unchanged from both applicant-status service methods and lets a rejection through", async () => {
    const list = { success: true, data: { applications: [] } }
    const detail = { name: "APP-TEST-0001" }
    h.get.mockResolvedValueOnce(list)
    await expect(ApplicantStatusResponse.getApplicantStatusResponse("cand@example.invalid")).resolves.toBe(list)
    h.get.mockResolvedValueOnce(detail)
    await expect(ApplicantStatusResponse.getJobApplicant("APP-TEST-0001")).resolves.toBe(detail)
    h.get.mockRejectedValueOnce(new Error("backend down"))
    await expect(ApplicantStatusResponse.getApplicantStatusResponse("cand@example.invalid")).rejects.toThrow("backend down")
  })

  // Spec: CAND-04-A6.4E (docs/spec/clauses/04-dashboard.md#cand-04-a6-4e)
  // Characterization: pins current behaviour, not endorsed.
  it("keys the applicant queries by e-mail and applicant name and does not retry a failed request", async () => {
    const a = setup()
    h.get.mockRejectedValue(new Error("backend down"))
    const status = renderHook(() => useApplicantStatus("cand@example.invalid"), { wrapper: a.wrapper })
    await waitFor(() => expect(status.result.current.isError).toBe(true))
    expect(h.get).toHaveBeenCalledTimes(1)
    expect(a.client.getQueryCache().find({ queryKey: ["application-status", "cand@example.invalid"] })).toBeTruthy()

    const b = setup()
    h.get.mockClear()
    const detail = renderHook(() => useJobApplicantDetails("APP-TEST-0001"), { wrapper: b.wrapper })
    await waitFor(() => expect(detail.result.current.isError).toBe(true))
    expect(h.get).toHaveBeenCalledTimes(1)
    expect(b.client.getQueryCache().find({ queryKey: ["job-applicant-details", "APP-TEST-0001"] })).toBeTruthy()
  })

  // Spec: CAND-04-A6.2E (docs/spec/clauses/04-dashboard.md#cand-04-a6-2e)
  // Characterization: pins current behaviour, not endorsed.
  it("runs the service with an undefined e-mail when refetch is called on the disabled query, which ends in the Email is required error", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useDashboard(undefined), { wrapper })
    expect(result.current.fetchStatus).toBe("idle")
    const outcome = await result.current.refetch()
    expect(outcome.isError).toBe(true)
    expect((outcome.error as Error).message).toBe("Email is required")
    expect(h.get).not.toHaveBeenCalled()
  })
})
