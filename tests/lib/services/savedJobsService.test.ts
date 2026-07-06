import { describe, it, expect, vi, beforeEach } from "vitest";
import { SavedJobsService } from "@/lib/services/savedJobsService";
import { FrappeAPI } from "@/lib/frappe-api";

vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    post: vi.fn(),
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
      "recruitment.api.channels.careers.get_saved_job_openings",
      { candidate_email: "candidate@test.com" }
    );
  });

  it("toggleSavedJob calls FrappeAPI.post", async () => {
    const mockRes = { action: "saved", is_saved: true };
    (FrappeAPI.post as any).mockResolvedValue(mockRes);

    const result = await SavedJobsService.toggleSavedJob("candidate@test.com", "HR-OPN-1");
    expect(result).toEqual(mockRes);
    expect(FrappeAPI.post).toHaveBeenCalledWith(
      "recruitment.api.channels.careers.toggle_saved_job_opening",
      {
        candidate_email: "candidate@test.com",
        job_opening: "HR-OPN-1",
      }
    );
  });


});
