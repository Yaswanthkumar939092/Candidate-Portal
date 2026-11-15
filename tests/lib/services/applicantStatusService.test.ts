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
  it("getApplicantStatusResponse reads my_applications (no email sent) and adapts rows to the timeline shape", async () => {
    (FrappeAPI.get as any).mockResolvedValue([
      { receipt: "APP-AAA111", job_opening: "HR-OPN-1", job_title: "Payroll Analyst", status: "In review", submitted_on: "2026-10-21" },
      { receipt: "APP-BBB222", job_opening: "HR-OPN-2", job_title: null, status: "Closed", submitted_on: null },
    ]);

    const result = await ApplicantStatusResponse.getApplicantStatusResponse("ignored@example.com");

    expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.v1.candidate.my_applications", {});
    expect(result.success).toBe(true);
    expect(result.data.applications).toHaveLength(2);
    expect(result.data.applications[0]).toMatchObject({
      id: "APP-AAA111",
      applied_on: "2026-10-21",
      status: "In review",
      job: { designation: "Payroll Analyst", company: null, location: null, experience_range: null, employment_type: null },
    });
    expect(result.data.applications[0].flags).toEqual([
      { status: "Open", flag: true, date: "2026-10-21" },
      { status: "Replied", flag: true, date: null },
      { status: "Accepted", flag: false, date: null },
      { status: "Rejected", flag: false, date: null },
    ]);
    expect(result.data.applications[1].job.designation).toBe("HR-OPN-2");
    expect(result.data.applications[1].flags.find((f: any) => f.status === "Rejected").flag).toBe(true);
  });

  it("returns an empty application list when the candidate has none", async () => {
    (FrappeAPI.get as any).mockResolvedValue([]);
    const result = await ApplicantStatusResponse.getApplicantStatusResponse("a@b.c");
    expect(result.success).toBe(true);
    expect(result.data.applications).toEqual([]);
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
