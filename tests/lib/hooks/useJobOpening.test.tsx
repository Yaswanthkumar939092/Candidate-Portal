import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  useJobOpening, 
  useCreateJobApplicant, 
  useGetAllDrafts,
  useDeleteDraftJobApplicant,
  useJobApplicationForm
} from "@/lib/hooks/useJobOpening";
import { 
  JobOpeningService, 
  draftJobApplicantService, 
  jobApplicationService 
} from "@/lib/services/jobOpeningService";
import React from "react";

// Mock services
vi.mock("@/lib/services/jobOpeningService", () => ({
  JobOpeningService: { 
    getJobOpening: vi.fn(),
    getCampusInviteOpenings: vi.fn(),
  },
  jobApplicationService: { submitApplication: vi.fn(), getJobApplicationForm: vi.fn() },
  draftJobApplicantService: { 
    getAllDrafts: vi.fn(),
    deleteDraftJobApplicant: vi.fn(),
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

describe("useJobOpening Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("useJobOpening fetches data correctly", async () => {
    const mockData = [] as any;
    (JobOpeningService.getJobOpening as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOpening({ page: 1, limit: 10 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(JobOpeningService.getJobOpening).toHaveBeenCalledWith(1, 10, undefined, undefined);
  });

  it("useJobOpening fetches data with search term correctly", async () => {
    const mockData = [] as any;
    (JobOpeningService.getJobOpening as any).mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useJobOpening({ page: 1, limit: 10, searchTerm: "developer" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(JobOpeningService.getJobOpening).toHaveBeenCalledWith(1, 10, "developer", undefined);
  });

  it("useJobOpening fetches campus invite openings correctly and maps job_opening to name", async () => {
    const mockRes = {
      success: true,
      data: {
        campus_invite: "CINV-2026-0001",
        openings: [
          {
            job_opening: "JOB-OPENING-0007",
            job_title: "Software Engineer",
          },
        ],
      },
    };
    (JobOpeningService.getCampusInviteOpenings as any).mockResolvedValue(mockRes);

    const { result } = renderHook(
      () => useJobOpening({ page: 1, limit: 10, campusInvite: "CINV-2026-0001", email: "test@test.com" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      columns: [],
      search_filters: [],
      openings: [
        {
          job_opening: "JOB-OPENING-0007",
          job_title: "Software Engineer",
          name: "JOB-OPENING-0007",
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 1,
        total_pages: 1,
        has_more: false,
      },
    });
    expect(JobOpeningService.getCampusInviteOpenings).toHaveBeenCalledWith("CINV-2026-0001", "test@test.com");
  });

  it("useCreateJobApplicant calls service on mutate", async () => {
    const mockResponse = {
      status: "ok",
      name: "HR-APP-2026-00123",
      source: "Careers Page"
    };
    (jobApplicationService.submitApplication as any).mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useCreateJobApplicant(), { wrapper });

    result.current.mutate({ opening: "job1", data: { name: "John" } } as any);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(vi.mocked(jobApplicationService.submitApplication).mock.calls[0][0]).toEqual({
      opening: "job1",
      data: { name: "John" }
    });
  });

  it("useGetAllDrafts fetches all drafts", async () => {
    const mockDrafts = [{ id: "draft1" }];
    (draftJobApplicantService.getAllDrafts as any).mockResolvedValue(mockDrafts);

    const { result } = renderHook(() => useGetAllDrafts("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDrafts);
  });

  it("useJobApplicationForm fetches form correctly", async () => {
    const mockForm = { fields: [{ label: "Name" }] };
    (jobApplicationService.getJobApplicationForm as any).mockResolvedValue(mockForm);

    const { result } = renderHook(() => useJobApplicationForm("job1", "test"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockForm);
    expect(jobApplicationService.getJobApplicationForm).toHaveBeenCalledWith("job1", undefined);
  });

  it("useJobApplicationForm fetches form correctly with isCampus = true", async () => {
    const mockForm = { fields: [{ label: "Name" }] };
    (jobApplicationService.getJobApplicationForm as any).mockResolvedValue(mockForm);

    const { result } = renderHook(() => useJobApplicationForm("job1", "test", true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockForm);
    expect(jobApplicationService.getJobApplicationForm).toHaveBeenCalledWith("job1", true);
  });

  describe("Mutation Callbacks", () => {
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("useCreateJobApplicant onError is called on failure", async () => {
      (jobApplicationService.submitApplication as any).mockRejectedValue(new Error("err"));
      const { result } = renderHook(() => useCreateJobApplicant(), { wrapper });
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("useDeleteDraftJobApplicant callbacks work", async () => {
      (draftJobApplicantService.deleteDraftJobApplicant as any).mockResolvedValue({});
      const { result } = renderHook(() => useDeleteDraftJobApplicant(), { wrapper });
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(consoleLogSpy).toHaveBeenCalled();

      (draftJobApplicantService.deleteDraftJobApplicant as any).mockRejectedValue(new Error("err"));
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
