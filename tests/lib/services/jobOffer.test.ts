import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobOfferService } from "@/lib/services/jobOffer";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    post: vi.fn(),
    getBlob: vi.fn(),
  },
}));

describe("jobOfferService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getJobOfferSummary calls FrappeAPI.get", async () => {
    const mockData = { applicant_name: "John" };
    (FrappeAPI.get as any).mockResolvedValue(mockData);

    const result = await jobOfferService.getJobOfferSummary("test@test.com");
    expect(result).toEqual(mockData);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_job_offer_summary"), { appl: "test@test.com" });
  });

  it("getRejectionReasons calls FrappeAPI.get", async () => {
    const mockData = [{ name: "R1", reason: "Salary" }];
    (FrappeAPI.get as any).mockResolvedValue(mockData);

    const result = await jobOfferService.getRejectionReasons();
    expect(result).toEqual(mockData);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_rejection_reasons"));
  });

  it("getCompanyLogo calls FrappeAPI.get", async () => {
    const mockData = { logo_url: "logo.png" };
    (FrappeAPI.get as any).mockResolvedValue(mockData);

    const result = await jobOfferService.getCompanyLogo();
    expect(result).toEqual(mockData);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_company_logo"));
  });

  it("downloadJobOfferPdf calls FrappeAPI.getBlob and returns object URL", async () => {
    const mockBlob = new Blob(["test"], { type: "application/pdf" });
    (FrappeAPI.getBlob as any).mockResolvedValue(mockBlob);
    const mockUrl = "blob:url";
    const createUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl);

    const result = await jobOfferService.downloadJobOfferPdf("test@test.com");

    expect(result).toBe(mockUrl);
    expect(FrappeAPI.getBlob).toHaveBeenCalledWith(expect.stringContaining("download_job_offer_pdf"), { appl: "test@test.com" });
    
    createUrlSpy.mockRestore();
  });

  it("updateJobOfferStatus calls FrappeAPI.post", async () => {
    const mockRes = { jo_id: "JO1", webform: "WF1" };
    (FrappeAPI.post as any).mockResolvedValue(mockRes);

    const params = { status: "Accepted" as const, appl: "test@test.com" };
    const result = await jobOfferService.updateJobOfferStatus(params);

    expect(result).toEqual(mockRes);
    expect(FrappeAPI.post).toHaveBeenCalledWith(expect.stringContaining("job_offer_update"), params);
  });

  it("getJobOfferStatus calls FrappeAPI.get", async () => {
    const mockRes = { status: "Offered" };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await jobOfferService.getJobOfferStatus("test@test.com");
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_job_offer_status"), { appl: "test@test.com" });
  });

  it("handles errors by logging and rethrowing", async () => {
    const mockError = new Error("API Failure");
    (FrappeAPI.get as any).mockRejectedValue(mockError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(jobOfferService.getJobOfferSummary("test")).rejects.toThrow(mockError);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
