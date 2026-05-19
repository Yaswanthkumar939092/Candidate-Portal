import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetSavedJobs, useToggleSavedJob, useGetSavedJobDetails } from "@/lib/hooks/useSavedJobs";
import { SavedJobsService } from "@/lib/services/savedJobsService";
import React from "react";

// Mock services
vi.mock("@/lib/services/savedJobsService", () => ({
  SavedJobsService: {
    getSavedJobs: vi.fn(),
    toggleSavedJob: vi.fn(),
    getJobOpeningsByNames: vi.fn(),
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

describe("useSavedJobs Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("useGetSavedJobs queries and returns saved jobs list", async () => {
    const mockData = { status: "success", saved_job_openings: ["HR-OPN-1"] };
    (SavedJobsService.getSavedJobs as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetSavedJobs("candidate@test.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(SavedJobsService.getSavedJobs).toHaveBeenCalledWith("candidate@test.com");
  });

  it("useToggleSavedJob mutation triggers API call and invalidates query", async () => {
    const mockRes = { action: "saved", is_saved: true };
    (SavedJobsService.toggleSavedJob as any).mockResolvedValue(mockRes);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useToggleSavedJob(), { wrapper });

    result.current.mutate({ email: "candidate@test.com", jobId: "HR-OPN-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(SavedJobsService.toggleSavedJob).toHaveBeenCalledWith("candidate@test.com", "HR-OPN-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["saved-jobs", "candidate@test.com"] });
  });

  it("useGetSavedJobDetails queries detailed job openings by names", async () => {
    const mockDetails = { data: [{ name: "HR-OPN-1", job_title: "Developer" }] };
    (SavedJobsService.getJobOpeningsByNames as any).mockResolvedValue(mockDetails);

    const { result } = renderHook(() => useGetSavedJobDetails(["HR-OPN-1"]), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDetails);
    expect(SavedJobsService.getJobOpeningsByNames).toHaveBeenCalledWith(["HR-OPN-1"]);
  });
});
