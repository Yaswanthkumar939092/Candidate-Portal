import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  useJobOfferSummary, 
  useJobOfferStatus, 
  useRejectionReasons,
  useUpdateJobOfferStatus,
  useJobOfferPdf
} from "@/lib/hooks/useJobOffer";
import { jobOfferService } from "@/lib/services/jobOffer";
import React from "react";

// Mock jobOfferService
vi.mock("@/lib/services/jobOffer", () => ({
  jobOfferService: {
    getJobOfferSummary: vi.fn(),
    getJobOfferStatus: vi.fn(),
    getRejectionReasons: vi.fn(),
    updateJobOfferStatus: vi.fn(),
    downloadJobOfferPdf: vi.fn(),
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

describe("useJobOffer Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("useJobOfferSummary fetches data correctly", async () => {
    const mockData = { applicant_name: "Test User" };
    (jobOfferService.getJobOfferSummary as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOfferSummary("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(jobOfferService.getJobOfferSummary).toHaveBeenCalledWith("test@example.com");
  });

  it("useJobOfferStatus fetches data correctly", async () => {
    const mockData = { status: "Awaiting Response" };
    (jobOfferService.getJobOfferStatus as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOfferStatus("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it("useRejectionReasons fetches data correctly", async () => {
    const mockData = [{ reason: "Salary" }];
    (jobOfferService.getRejectionReasons as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useRejectionReasons(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it("useUpdateJobOfferStatus calls service and invalidates queries", async () => {
    (jobOfferService.updateJobOfferStatus as any).mockResolvedValue({});
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateJobOfferStatus(), { wrapper });

    await result.current.mutateAsync({ appl: "test@example.com", status: "Accepted" });

    expect(jobOfferService.updateJobOfferStatus).toHaveBeenCalledWith(
      expect.objectContaining({ 
        appl: "test@example.com", 
        status: "Accepted" 
      }),
      expect.anything()
    );
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it("useJobOfferPdf fetches PDF and handles cleanup", async () => {
    const mockPdfUrl = "blob:http://localhost:3000/test-blob";
    (jobOfferService.downloadJobOfferPdf as any).mockResolvedValue(mockPdfUrl);
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useJobOfferPdf("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.pdfUrl).toBe(mockPdfUrl));
    expect(jobOfferService.downloadJobOfferPdf).toHaveBeenCalledWith("test@example.com");

    unmount();
    expect(revokeSpy).toHaveBeenCalledWith(mockPdfUrl);
    revokeSpy.mockRestore();
  });
});
