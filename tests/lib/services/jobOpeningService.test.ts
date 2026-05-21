import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  JobOpeningService, 
  JobApplicantService, 
  draftJobApplicantService, 
  jobApplicationService 
} from "@/lib/services/jobOpeningService";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    post: vi.fn(),
    getresourceDocumentData: vi.fn(),
  },
}));

describe("JobOpening Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("JobOpeningService", () => {
    it("getJobOpening calls FrappeAPI.getresourceDocumentData", async () => {
      const mockRes = { data: [{ id: 1 }] };
      (FrappeAPI.getresourceDocumentData as any).mockResolvedValue(mockRes);

      const result = await JobOpeningService.getJobOpening(1, 10);
      expect(result).toEqual(mockRes.data);
      expect(FrappeAPI.getresourceDocumentData).toHaveBeenCalledWith("Job Opening", expect.objectContaining({
        method: "GET",
        page: 1,
        limit: 10
      }));
    });
  });

  describe("JobApplicantService", () => {
    it("createJobApplicant calls FrappeAPI.getresourceDocumentData", async () => {
      const mockRes = { data: { name: "APP1" } };
      (FrappeAPI.getresourceDocumentData as any).mockResolvedValue(mockRes);

      const payload = { first_name: "John" };
      const result = await JobApplicantService.createJobApplicant(payload);
      expect(result).toEqual(mockRes.data);
      expect(FrappeAPI.getresourceDocumentData).toHaveBeenCalledWith("Job Applicant", expect.objectContaining({
        method: "POST",
        data: payload
      }));
    });
  });

  describe("draftJobApplicantService", () => {
    it("getDraftJobApplicant calls FrappeAPI.get", async () => {
      const mockRes = { id: "D1" };
      (FrappeAPI.get as any).mockResolvedValue(mockRes);

      const result = await draftJobApplicantService.getDraftJobApplicant("test@test.com", "JO1");
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.get).toHaveBeenCalledWith(expect.stringContaining("get_draft"), {
        job_applicant_email: "test@test.com",
        job_opening: "JO1"
      });
    });

    it("saveApplication calls FrappeAPI.post with save_application", async () => {
      const mockRes = { name: "D1", success: true };
      (FrappeAPI.post as any).mockResolvedValue(mockRes);

      const payload = {
        job_applicant_email: "test@test.com",
        job_opening: "JO1",
        form_data: JSON.stringify({ age: 30 })
      };

      const result = await draftJobApplicantService.saveApplication(payload);
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.post).toHaveBeenCalledWith("recruitment.api.draft_application.save_application", {
        job_applicant_email: "test@test.com",
        job_opening: "JO1",
        form_data: { age: 30 }
      });
    });

    it("saveApplication includes status parameter when provided", async () => {
      const mockRes = { name: "D1", success: true };
      (FrappeAPI.post as any).mockResolvedValue(mockRes);

      const payload = {
        job_applicant_email: "test@test.com",
        job_opening: "JO1",
        form_data: { age: 30 },
        status: "Open"
      };

      const result = await draftJobApplicantService.saveApplication(payload);
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.post).toHaveBeenCalledWith("recruitment.api.draft_application.save_application", {
        job_applicant_email: "test@test.com",
        job_opening: "JO1",
        form_data: { age: 30 },
        status: "Open"
      });
    });

    it("updateDraftJobApplicant calls FrappeAPI.getresourceDocumentData with PUT", async () => {
      const mockRes = { data: { success: true } };
      (FrappeAPI.getresourceDocumentData as any).mockResolvedValue(mockRes);

      const result = await draftJobApplicantService.updateDraftJobApplicant({ name: "D1", payload: { age: 30 } });
      expect(result).toEqual(mockRes.data);
      expect(FrappeAPI.getresourceDocumentData).toHaveBeenCalledWith("Draft Application/D1", expect.objectContaining({
        method: "PUT",
        data: { age: 30 }
      }));
    });

    it("deleteDraftJobApplicant calls FrappeAPI.post", async () => {
      (FrappeAPI.post as any).mockResolvedValue({ success: true });
      await draftJobApplicantService.deleteDraftJobApplicant({ email: "test@test.com", jobId: "JO1" });
      expect(FrappeAPI.post).toHaveBeenCalledWith(expect.stringContaining("delete_draft"), {
        job_applicant_email: "test@test.com",
        job_opening: "JO1"
      });
    });
  });

  describe("jobApplicationService", () => {
    it("getJobApplicationForm returns data or fallback", async () => {
      (FrappeAPI.get as any).mockResolvedValue({ fields: [1] });
      const result = await jobApplicationService.getJobApplicationForm("job1", "test");
      expect(result.fields).toEqual([1]);
      expect(FrappeAPI.get).toHaveBeenCalledWith(expect.any(String), {
        job_opening: "job1",
        form_name: "test"
      });

      (FrappeAPI.get as any).mockResolvedValue(null);
      const result2 = await jobApplicationService.getJobApplicationForm();
      expect(result2.fields).toEqual([]);
    });

    it("submitJobApplication calls FrappeAPI.post", async () => {
      (FrappeAPI.post as any).mockResolvedValue({ success: true });
      const data = { name: "John" };
      await jobApplicationService.submitJobApplication(data);
      expect(FrappeAPI.post).toHaveBeenCalledWith(expect.stringContaining("create_job_applicant"), data);
    });
  });
});
