import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  useJobOpening, 
  useCreateJobApplicant, 
  useGetDraftJobApplicant,
  useGetAllDrafts,
  useCreateDraftJobApplicant,
  useUpdateDraftJobApplicant,
  useDeleteDraftJobApplicant,
  useJobApplicationForm
} from "@/lib/hooks/useJobOpening";
import { 
  JobOpeningService, 
  JobApplicantService, 
  draftJobApplicantService, 
  jobApplicationService 
} from "@/lib/services/jobOpeningService";
import React from "react";

// Mock services
vi.mock("@/lib/services/jobOpeningService", () => ({
  JobOpeningService: { getJobOpening: vi.fn() },
  JobApplicantService: { createJobApplicant: vi.fn() },
  draftJobApplicantService: { 
    getDraftJobApplicant: vi.fn(),
    getAllDrafts: vi.fn(),
    createDraftJobApplicant: vi.fn(),
    updateDraftJobApplicant: vi.fn(),
    deleteDraftJobApplicant: vi.fn(),
  },
  jobApplicationService: { getJobApplicationForm: vi.fn() },
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
    const mockData = { results: [] };
    (JobOpeningService.getJobOpening as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOpening({ page: 1, limit: 10 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(JobOpeningService.getJobOpening).toHaveBeenCalledWith(1, 10);
  });

  it("useCreateJobApplicant calls service on mutate", async () => {
    (JobApplicantService.createJobApplicant as any).mockResolvedValue({ id: "1" });
    const { result } = renderHook(() => useCreateJobApplicant(), { wrapper });

    result.current.mutate({ name: "John" } as any);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(JobApplicantService.createJobApplicant).toHaveBeenCalled();
  });

  it("useGetDraftJobApplicant fetches draft when enabled", async () => {
    const mockDraft = { id: "draft1" };
    (draftJobApplicantService.getDraftJobApplicant as any).mockResolvedValue(mockDraft);

    const { result } = renderHook(() => useGetDraftJobApplicant("test@example.com", "job1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDraft);
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
    expect(jobApplicationService.getJobApplicationForm).toHaveBeenCalledWith("job1", "test");
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
      (JobApplicantService.createJobApplicant as any).mockRejectedValue(new Error("err"));
      const { result } = renderHook(() => useCreateJobApplicant(), { wrapper });
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("useCreateDraftJobApplicant callbacks work", async () => {
      (draftJobApplicantService.createDraftJobApplicant as any).mockResolvedValue({ id: "1" });
      const { result } = renderHook(() => useCreateDraftJobApplicant(), { wrapper });
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(consoleLogSpy).toHaveBeenCalled();

      (draftJobApplicantService.createDraftJobApplicant as any).mockRejectedValue(new Error("err"));
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("useUpdateDraftJobApplicant callbacks work", async () => {
      (draftJobApplicantService.updateDraftJobApplicant as any).mockResolvedValue({ id: "1" });
      const { result } = renderHook(() => useUpdateDraftJobApplicant(), { wrapper });
      result.current.mutate({} as any);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(consoleLogSpy).toHaveBeenCalled();

      (draftJobApplicantService.updateDraftJobApplicant as any).mockRejectedValue(new Error("err"));
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
