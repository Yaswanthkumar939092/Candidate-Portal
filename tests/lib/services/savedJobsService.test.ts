import { describe, it, expect, vi, beforeEach } from "vitest";
import { SavedJobsService } from "@/lib/services/savedJobsService";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    post: vi.fn(),
    getresourceDocumentData: vi.fn(),
  },
}));

describe("SavedJobsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSavedJobs calls FrappeAPI.get", async () => {
    const mockRes = { status: "success", saved_job_openings: ["HR-OPN-1"] };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await SavedJobsService.getSavedJobs("candidate@test.com");
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.saved_jobs.get_saved_job_openings",
      { candidate_email: "candidate@test.com" }
    );
  });

  it("toggleSavedJob calls FrappeAPI.post", async () => {
    const mockRes = { action: "saved", is_saved: true };
    (FrappeAPI.post as any).mockResolvedValue(mockRes);

    const result = await SavedJobsService.toggleSavedJob("candidate@test.com", "HR-OPN-1");
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.post).toHaveBeenCalledWith(
      "recruitment.api.saved_jobs.toggle_saved_job_opening",
      {
        candidate_email: "candidate@test.com",
        job_opening: "HR-OPN-1",
      }
    );
  });

  it("getJobOpeningsByNames returns empty data if list is empty", async () => {
    const result = await SavedJobsService.getJobOpeningsByNames([]);
    expect(result).toEqual({ data: [] });
    expect(FrappeAPI.getresourceDocumentData).not.toHaveBeenCalled();
  });

  it("getJobOpeningsByNames calls FrappeAPI.getresourceDocumentData with filters", async () => {
    const mockRes = { data: [{ name: "HR-OPN-1", job_title: "Developer" }] };
    (FrappeAPI.getresourceDocumentData as any).mockResolvedValue(mockRes);

    const result = await SavedJobsService.getJobOpeningsByNames(["HR-OPN-1"]);
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.getresourceDocumentData).toHaveBeenCalledWith("Job Opening", {
      method: "GET",
      limit: 1,
      fields: ["*"],
      filters: [["name", "in", ["HR-OPN-1"]]],
    });
  });
});
