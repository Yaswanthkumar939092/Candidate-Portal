/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import {
  useActionCenter,
  useActionCenterMyRequest,
  useCandidateRaiseRequest,
} from "@/lib/hooks/useAcationCenter"
import {
  ActionCenterDataService,
  ActionCenterMyRequestService,
  CandidateRaiseRequestService,
} from "@/lib/services/action-center"

// ✅ FIX: define userEmail
const userEmail = "user@example.com"

// ─── Mock services ─────────────────────────────────────────────────

vi.mock("@/lib/services/action-center", () => ({
  ActionCenterDataService: {
    getActionCenterData: vi.fn(),
  },
  ActionCenterMyRequestService: {
    getActionCenterMyRequestService: vi.fn(),
  },
  CandidateRaiseRequestService: {
    createCandidateRaiseRequest: vi.fn(),
  },
}))

// ─── Helpers ───────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// ─── useActionCenter ───────────────────────────────────────────────

describe("useActionCenter", () => {
  const mockData = {
    items: [
      {
        name: "TASK-001",
        status: "Action Required",
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches data", async () => {
    ; (ActionCenterDataService.getActionCenterData as any).mockResolvedValueOnce(mockData)

    const { result } = renderHook(() => useActionCenter(userEmail), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockData)
    expect(ActionCenterDataService.getActionCenterData).toHaveBeenCalledWith(userEmail)
  })


  it("handles error", async () => {
    ; (ActionCenterDataService.getActionCenterData as any).mockRejectedValueOnce(
      new Error("error")
    )

    const { result } = renderHook(() => useActionCenter(userEmail), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("query key correct", async () => {
    ; (ActionCenterDataService.getActionCenterData as any).mockResolvedValueOnce(mockData)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useActionCenter(userEmail), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cache = queryClient.getQueryCache().findAll()
    expect(cache[0].queryKey).toEqual(["action-center", userEmail])
  })
})

// ─── useActionCenterMyRequest ──────────────────────────────────────

describe("useActionCenterMyRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches data", async () => {
    const mock = [{ name: "REQ-1" }]
      ; (ActionCenterMyRequestService.getActionCenterMyRequestService as any).mockResolvedValueOnce(
        mock
      )

    const { result } = renderHook(
      () => useActionCenterMyRequest({ page: 1, limit: 10, userEmail }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mock)
    expect(
      ActionCenterMyRequestService.getActionCenterMyRequestService
    ).toHaveBeenCalledWith(1, 10, userEmail)
  })

  it("query key correct", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

      ; (ActionCenterMyRequestService.getActionCenterMyRequestService as any).mockResolvedValueOnce(
        []
      )

    const { result } = renderHook(
      () => useActionCenterMyRequest({ page: 2, limit: 5, userEmail }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cache = queryClient.getQueryCache().findAll()
    expect(cache[0].queryKey).toEqual([
      "action-center-my-request",
      2,
      5,
      userEmail,
    ])
  })

  it("handles error", async () => {
    ; (ActionCenterMyRequestService.getActionCenterMyRequestService as any).mockRejectedValueOnce(
      new Error("fail")
    )

    const { result } = renderHook(
      () => useActionCenterMyRequest({ page: 1, limit: 10, userEmail }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

})

// ─── useCandidateRaiseRequest ──────────────────────────────────────

describe("useCandidateRaiseRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates request", async () => {
    const payload = { request_type: "general" }
    const mock = { name: "REQ-1" }

      ; (CandidateRaiseRequestService.createCandidateRaiseRequest as any).mockResolvedValueOnce(
        mock
      )

    const { result } = renderHook(() => useCandidateRaiseRequest(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync(payload)

    await waitFor(() => {
      expect(result.current.data).toEqual(mock)
    })
  })

  it("handles error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

      ; (CandidateRaiseRequestService.createCandidateRaiseRequest as any).mockRejectedValueOnce(
        new Error("fail")
      )

    const { result } = renderHook(() => useCandidateRaiseRequest(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({})).rejects.toThrow()

    consoleErrorSpy.mockRestore()
  })
})