import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicantStatusResponse } from "@/lib/services/applicantStatusService";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("ApplicantStatusResponse Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Spec: CAND-04-A6.3A (docs/spec/clauses/04-dashboard.md#cand-04-a6-3a)
  it("getApplicantStatusResponse calls FrappeAPI.get with correct arguments", async () => {
    const mockResponse = { success: true, data: {} };
    (FrappeAPI.get as any).mockResolvedValue(mockResponse);

    const result = await ApplicantStatusResponse.getApplicantStatusResponse("test@example.com");

    expect(result).toEqual(mockResponse);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.channels.careers.get_applied_jobs",
      { email: "test@example.com" }
    );
  });

  // Spec: CAND-04-A6.3B (docs/spec/clauses/04-dashboard.md#cand-04-a6-3b)
  it("getJobApplicant calls FrappeAPI.get with correct arguments", async () => {
    const mockResponse = { name: "APP-001" };
    (FrappeAPI.get as any).mockResolvedValue(mockResponse);

    const result = await ApplicantStatusResponse.getJobApplicant("APP-001");

    expect(result).toEqual(mockResponse);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.draft_application.get_job_applicant",
      { job_applicant: "APP-001" }
    );
  });
});
