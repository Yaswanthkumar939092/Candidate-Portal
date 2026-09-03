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

  it("getJobOfferSummary calls FrappeAPI.get with token if provided", async () => {
    const mockData = { applicant_name: "John" };
    (FrappeAPI.get as any).mockResolvedValue(mockData);

    const result = await jobOfferService.getJobOfferSummary("test@test.com", "db388c916142068b098ff0463eaae20d190c0cce");
    expect(result).toEqual(mockData);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_job_offer_summary"), {
      appl: "test@test.com",
      token: "db388c916142068b098ff0463eaae20d190c0cce",
    });
  });

  it("getRejectionReasons calls FrappeAPI.get", async () => {
    const mockData = [{ name: "R1", reason: "Salary" }];
    (FrappeAPI.get as any).mockResolvedValue(mockData);

    const result = await jobOfferService.getRejectionReasons();
    expect(result).toEqual(mockData);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_rejection_reasons"));
  });

  it("getJobOfferPdfUrl returns the correct API URL", () => {
    const url = jobOfferService.getJobOfferPdfUrl("test@test.com");
    expect(url).toContain("download_job_offer_pdf");
    expect(url).toContain("appl=test%40test.com");
  });

  it("getJobOfferPdfUrl returns the correct API URL with token if provided", () => {
    const url = jobOfferService.getJobOfferPdfUrl("test@test.com", "db388c916142068b098ff0463eaae20d190c0cce");
    expect(url).toContain("download_job_offer_pdf");
    expect(url).toContain("appl=test%40test.com");
    expect(url).toContain("token=db388c916142068b098ff0463eaae20d190c0cce");
  });

  it("updateJobOfferStatus calls FrappeAPI.post", async () => {
    const mockRes = { jo_id: "JO1", webform: "WF1" };
    (FrappeAPI.post as any).mockResolvedValue(mockRes);

    const params = { status: "Accepted" as const, appl: "test@test.com" };
    const result = await jobOfferService.updateJobOfferStatus(params);

    expect(result).toEqual(mockRes);
    expect(FrappeAPI.post).toHaveBeenCalledWith(expect.stringContaining("job_offer_update"), params);
  });

  it("updateJobOfferStatus calls FrappeAPI.post with token", async () => {
    const mockRes = { jo_id: "JO1", webform: "WF1" };
    (FrappeAPI.post as any).mockResolvedValue(mockRes);

    const params = { status: "Accepted" as const, appl: "test@test.com", token: "my-token" };
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

  it("getJobOfferStatus calls FrappeAPI.get with token if provided", async () => {
    const mockRes = { status: "Offered" };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await jobOfferService.getJobOfferStatus("test@test.com", "db388c916142068b098ff0463eaae20d190c0cce");
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_job_offer_status"), {
      appl: "test@test.com",
      token: "db388c916142068b098ff0463eaae20d190c0cce",
    });
  });

  it("getConsentForm calls FrappeAPI.get with correct arguments", async () => {
    const mockRes = { html: "<div>Consent Form</div>" };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await jobOfferService.getConsentForm("test@test.com", "my-token");
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form",
      {
        appl: "test@test.com",
        token: "my-token",
      }
    );
  });

  it("submitConsent calls FrappeAPI.post with correct arguments", async () => {
    const mockRes = { success: true };
    (FrappeAPI.post as any).mockResolvedValue(mockRes);

    const payload = { appl: "test@test.com", token: "my-token", consented: true };
    const result = await jobOfferService.submitConsent(payload);
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.post).toHaveBeenCalledWith(
      "recruitment.dpdp_consent.submit_dpdp_consent",
      payload
    );
  });

  it("throws error when API fails", async () => {
    const mockError = new Error("API Failure");
    (FrappeAPI.get as any).mockRejectedValue(mockError);

    await expect(jobOfferService.getJobOfferSummary("test")).rejects.toThrow(mockError);
  });
});
