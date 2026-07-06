import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  JobOpeningService, 
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
    it("getJobOpening calls FrappeAPI.get", async () => {
      const mockRes = [{ name: "HR-OPN-2026-0006" }];
      (FrappeAPI.get as any).mockResolvedValue(mockRes);

      const result = await JobOpeningService.getJobOpening(1, 10);
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.channels.careers.list_openings", {
        page: "1",
        limit: "10"
      });
    });

    it("getJobOpening calls FrappeAPI.get with search_term parameter", async () => {
      const mockRes = [{ name: "HR-OPN-2026-0006" }];
      (FrappeAPI.get as any).mockResolvedValue(mockRes);

      const result = await JobOpeningService.getJobOpening(1, 10, "engineering");
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.channels.careers.list_openings", {
        page: "1",
        limit: "10",
        search_term: "engineering"
      });
    });
  });

  describe("jobApplicationService", () => {
    it("submitApplication calls FrappeAPI.post with submit_application", async () => {
      const mockRes = {
        status: "ok",
        name: "HR-APP-2026-00123",
        source: "Careers Page"
      };
      (FrappeAPI.post as any).mockResolvedValue(mockRes);

      const payload = {
        opening: "HR-OPN-2026-0006",
        data: {
          applicant_name: "Aarav Sharma",
          email_id: "aarav@example.com",
          phone_number: "+91-9000000000",
        }
      };
      const result = await jobApplicationService.submitApplication(payload);
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.post).toHaveBeenCalledWith("recruitment.api.channels.careers.submit_application", payload);
    });
  });

  describe("draftJobApplicantService", () => {
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
      const mockRawFields = [
        {
          reference_name: "f1",
          display_name: "Field 1",
          fieldtype: "Data",
          options: "",
          reqd: 1,
          section: "Sec 1",
          ctq: 0,
          visibility: "All",
          editability: "Editable"
        }
      ];
      (FrappeAPI.get as any).mockResolvedValue(mockRawFields);
      const result = await jobApplicationService.getJobApplicationForm("job1", "test");
      expect(result.fields).toEqual([
        {
          fieldname: "f1",
          label: "Field 1",
          fieldtype: "Data",
          options: "",
          reqd: 1,
          is_mandatory: 1,
          tab_label: "Sec 1",
          section_label: "Details"
        }
      ]);
      expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.channels.careers.get_application_fields", {
        opening: "job1"
      });

      (FrappeAPI.get as any).mockResolvedValue(null);
      const result2 = await jobApplicationService.getJobApplicationForm();
      expect(result2.fields).toEqual([]);
    });


  });
});
