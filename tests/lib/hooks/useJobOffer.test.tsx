import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useJobOfferSummary,
  useJobOfferPdf,
  useJobOfferStatus,
  useRejectionReasons,
  useUpdateJobOfferStatus,
  useConsentForm,
  useSubmitConsent
} from "@/lib/hooks/useJobOffer";
import { jobOfferService } from "@/lib/services/jobOffer";
import React from "react";

// Mock jobOfferService
vi.mock("@/lib/services/jobOffer", () => ({
  jobOfferService: {
    getJobOfferSummary: vi.fn(),
    getJobOfferPdfUrl: vi.fn(),
    getJobOfferStatus: vi.fn(),
    getRejectionReasons: vi.fn(),
    updateJobOfferStatus: vi.fn(),
    getConsentForm: vi.fn(),
    submitConsent: vi.fn(),
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
    const mockData = {
      applicant_name: "Test User",
      designation: "Software Engineer",
      duration_display: "6 Months",
      expected_doj_display: "2026-05-01",
      stipend_display: "₹50,000",
      expiry_display: "2 Days"
    };
    vi.mocked(jobOfferService.getJobOfferSummary).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOfferSummary("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(jobOfferService.getJobOfferSummary).toHaveBeenCalledWith("test@example.com", undefined);
  });

  it("useJobOfferSummary hook passes token to the service", async () => {
    const mockData = {
      applicant_name: "Test User",
      designation: "Software Engineer",
      duration_display: "6 Months",
      expected_doj_display: "2026-05-01",
      stipend_display: "₹50,000",
      expiry_display: "2 Days"
    };
    vi.mocked(jobOfferService.getJobOfferSummary).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOfferSummary("test@example.com", true, "my-token"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(jobOfferService.getJobOfferSummary).toHaveBeenCalledWith("test@example.com", "my-token");
  });

  it("useJobOfferStatus fetches data correctly", async () => {
    const mockData = { status: "Awaiting Response" };
    vi.mocked(jobOfferService.getJobOfferStatus).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOfferStatus("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(jobOfferService.getJobOfferStatus).toHaveBeenCalledWith("test@example.com", undefined);
  });

  it("useJobOfferStatus hook passes token to the service", async () => {
    const mockData = { status: "Awaiting Response" };
    vi.mocked(jobOfferService.getJobOfferStatus).mockResolvedValue(mockData);

    const { result } = renderHook(() => useJobOfferStatus("test@example.com", "my-token"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(jobOfferService.getJobOfferStatus).toHaveBeenCalledWith("test@example.com", "my-token");
  });

  it("useJobOfferPdf returns a URL string when appl and enabled are set", () => {
    vi.mocked(jobOfferService.getJobOfferPdfUrl).mockReturnValue("https://frappe.example.com/api/method/recruitment.job_offer_utils.download_job_offer_pdf?appl=test%40example.com");

    const { result } = renderHook(
      () => useJobOfferPdf("test@example.com"),
      { wrapper }
    );

    expect(result.current.pdfUrl).toContain("download_job_offer_pdf");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(jobOfferService.getJobOfferPdfUrl).toHaveBeenCalledWith("test@example.com", undefined);
  });

  it("useJobOfferPdf forwards the token parameter when provided", () => {
    vi.mocked(jobOfferService.getJobOfferPdfUrl).mockReturnValue("https://frappe.example.com/api/method/recruitment.job_offer_utils.download_job_offer_pdf?appl=test%40example.com&token=my-token");

    const { result } = renderHook(
      () => useJobOfferPdf("test@example.com", true, "my-token"),
      { wrapper }
    );

    expect(result.current.pdfUrl).toContain("download_job_offer_pdf");
    expect(result.current.pdfUrl).toContain("token=my-token");
    expect(jobOfferService.getJobOfferPdfUrl).toHaveBeenCalledWith("test@example.com", "my-token");
  });

  it("useJobOfferPdf returns null when disabled", () => {
    const { result } = renderHook(
      () => useJobOfferPdf("test@example.com", false),
      { wrapper }
    );

    expect(result.current.pdfUrl).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("useRejectionReasons fetches data correctly", async () => {
    const mockData = [{ name: "Salary", reason: "Salary" }];
    vi.mocked(jobOfferService.getRejectionReasons).mockResolvedValue(mockData);

    const { result } = renderHook(() => useRejectionReasons(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it("useUpdateJobOfferStatus calls service and updates cache directly", async () => {
    vi.mocked(jobOfferService.updateJobOfferStatus).mockResolvedValue({ jo_id: "test-id", webform: "" });
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
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
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ["jobOfferStatus", "test@example.com", undefined],
      { status: "Accepted" }
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("useConsentForm fetches data correctly", async () => {
    const mockData = { html: "<div>Consent Form</div>" } as any;
    vi.mocked(jobOfferService.getConsentForm).mockResolvedValue(mockData);

    const { result } = renderHook(() => useConsentForm("test@example.com", "my-token"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(jobOfferService.getConsentForm).toHaveBeenCalledWith("test@example.com", "my-token");
  });

  it("useSubmitConsent calls service method on mutateAsync", async () => {
    const mockRes = { success: true };
    vi.mocked(jobOfferService.submitConsent).mockResolvedValue(mockRes);

    const { result } = renderHook(() => useSubmitConsent(), { wrapper });

    const payload = { appl: "test@example.com", token: "my-token", consented: true };
    const response = await result.current.mutateAsync(payload);

    expect(response).toEqual(mockRes);
    expect(jobOfferService.submitConsent).toHaveBeenCalledWith(payload, expect.anything());
  });
});
