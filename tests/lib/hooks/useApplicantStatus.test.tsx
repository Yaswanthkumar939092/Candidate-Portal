import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApplicantStatus, useApplication, useJobApplicantDetails } from "@/lib/hooks/useApplicantStatus";
import { ApplicantStatusResponse } from "@/lib/services/applicantStatusService";
import React from "react";

// Mock ApplicantStatusResponse
vi.mock("@/lib/services/applicantStatusService", () => ({
  ApplicantStatusResponse: {
    getApplicantStatusResponse: vi.fn(),
    getJobApplicant: vi.fn(),
    getApplication: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useApplicantStatus Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  // Spec: CAND-04-A6.4A (docs/spec/clauses/04-dashboard.md#cand-04-a6-4a)
  it("useApplicantStatus fetches data correctly", async () => {
    const mockData = { success: true, data: { status: "Applied" } };
    (ApplicantStatusResponse.getApplicantStatusResponse as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useApplicantStatus("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(ApplicantStatusResponse.getApplicantStatusResponse).toHaveBeenCalledWith("test@example.com");
  });

  // Spec: CAND-04-A6.4B (docs/spec/clauses/04-dashboard.md#cand-04-a6-4b)
  it("useJobApplicantDetails fetches data correctly", async () => {
    const mockData = { name: "APP-001" };
    (ApplicantStatusResponse.getJobApplicant as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobApplicantDetails("APP-001"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(ApplicantStatusResponse.getJobApplicant).toHaveBeenCalledWith("APP-001");
  });

  // Spec: CAND-04-A6.4C (docs/spec/clauses/04-dashboard.md#cand-04-a6-4c)
  it("useApplicantStatus is disabled when email is empty", () => {
    const { result } = renderHook(() => useApplicantStatus(""), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
  });

  // Spec: CAND-04-A6.4D (docs/spec/clauses/04-dashboard.md#cand-04-a6-4d)
  it("useJobApplicantDetails is disabled when jobApplicantName is null", () => {
    const { result } = renderHook(() => useJobApplicantDetails(null), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
  });
  it("useApplication fetches the application by receipt and is idle without one", async () => {
    const view = { receipt: "APP-AAA111", status: "In review" };
    (ApplicantStatusResponse.getApplication as any).mockResolvedValue(view);

    const { result } = renderHook(() => useApplication("APP-AAA111"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(view);
    expect(ApplicantStatusResponse.getApplication).toHaveBeenCalledWith("APP-AAA111");

    const idle = renderHook(() => useApplication(null), { wrapper });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });
});
