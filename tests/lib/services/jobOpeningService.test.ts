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
    const v1List = (rows: any[], extra: Record<string, unknown> = {}) => ({
      openings: rows, page: 1, page_length: 10, total: rows.length, ...extra,
    });

    // Spec: CAND-07-A9.3A (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3a)
    it("getJobOpening calls v1 list_openings with page_length and no email", async () => {
      (FrappeAPI.get as any).mockImplementation(async (method: string) =>
        method.endsWith("my_applications") ? [] : v1List([{ name: "HR-OPN-1", job_title: "Dev" }]),
      );
      await JobOpeningService.getJobOpening(1, 10, undefined, "someone@example.com");
      const call = (FrappeAPI.get as any).mock.calls.find((c: any[]) => c[0].endsWith("list_openings"));
      expect(call[0]).toBe("recruitment.api.v1.candidate.list_openings");
      expect(call[1]).toEqual({ page: "1", page_length: "10" });
      expect(JSON.stringify(call)).not.toContain("someone@example.com");
      expect((FrappeAPI.get as any).mock.calls.some((c: any[]) => String(c[0]).includes("channels.careers"))).toBe(false);
    });

    // Spec: CAND-07-A9.3B (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3b)
    it("getJobOpening maps search_term to search and caps page_length at 50", async () => {
      (FrappeAPI.get as any).mockImplementation(async (method: string) =>
        method.endsWith("my_applications") ? [] : v1List([]),
      );
      await JobOpeningService.getJobOpening(2, 200, "engineering");
      const call = (FrappeAPI.get as any).mock.calls.find((c: any[]) => c[0].endsWith("list_openings"));
      expect(call[1]).toEqual({ page: "2", page_length: "50", search: "engineering" });
    });

    it("getJobOpening builds pagination from page, page_length and total, with empty columns", async () => {
      (FrappeAPI.get as any).mockImplementation(async (method: string) =>
        method.endsWith("my_applications") ? [] : v1List([{ name: "A" }], { page: 2, page_length: 10, total: 25 }),
      );
      const r = await JobOpeningService.getJobOpening(2, 10);
      expect(r.pagination).toEqual({ total: 25, page: 2, limit: 10, total_pages: 3, has_more: true });
      expect(r.columns).toEqual([]);
      expect(r.search_filters).toEqual([]);
      const last = await (async () => {
        (FrappeAPI.get as any).mockImplementation(async (m: string) =>
          m.endsWith("my_applications") ? [] : v1List([{ name: "A" }], { page: 3, page_length: 10, total: 25 }));
        return JobOpeningService.getJobOpening(3, 10);
      })();
      expect(last.pagination.has_more).toBe(false);
    });

    it("getJobOpening marks applied openings from my_applications and never marks saved", async () => {
      (FrappeAPI.get as any).mockImplementation(async (method: string) =>
        method.endsWith("my_applications")
          ? [{ receipt: "APP-1", job_opening: "HR-OPN-2", status: "Received" }]
          : v1List([{ name: "HR-OPN-1" }, { name: "HR-OPN-2" }]),
      );
      const r = await JobOpeningService.getJobOpening(1, 10, undefined, "x@y.z");
      expect(r.openings.map((o: any) => [o.name, o.applied, o.saved])).toEqual([
        ["HR-OPN-1", false, false],
        ["HR-OPN-2", true, false],
      ]);
    });

    it("getJobOpening still lists openings when my_applications is not available (guest or error)", async () => {
      (FrappeAPI.get as any).mockImplementation(async (method: string) => {
        if (method.endsWith("my_applications")) throw new Error("Authentication required.");
        return v1List([{ name: "HR-OPN-1", job_title: "Dev", company: "Hybrow Labs" }]);
      });
      const r = await JobOpeningService.getJobOpening(1, 10);
      expect(r.openings).toHaveLength(1);
      expect(r.openings[0]).toMatchObject({ name: "HR-OPN-1", job_title: "Dev", company: "Hybrow Labs", applied: false });
    });

    // Spec: CAND-07-A9.3C (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3c)
    it("getCampusInviteOpenings calls FrappeAPI.get with campus_invite", async () => {
      const mockRes = { campus_invite: "CINV-2026-0001", openings: [] };
      (FrappeAPI.get as any).mockResolvedValue(mockRes);

      const result = await JobOpeningService.getCampusInviteOpenings("CINV-2026-0001", "test@example.com");
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.channels.campus.get_invite_openings", {
        campus_invite: "CINV-2026-0001",
        email: "test@example.com",
      });
    });
  });

  describe("jobApplicationService", () => {
    // Spec: CAND-07-A9.3D (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3d)
    it("submitApplication sends only job_opening and form_data to the v1 method and adapts the receipt", async () => {
      (FrappeAPI.post as any).mockResolvedValue({ receipt: "APP-ABC123", status: "received" });
      const payload = {
        job_applicant_email: "aarav@example.com",
        job_opening: "HR-OPN-2026-0006",
        status: "Open",
        form_data: { applicant_name: "Aarav Sharma", phone_number: "+91-9000000000" },
      };
      const result = await jobApplicationService.submitApplication(payload as any);
      expect(FrappeAPI.post).toHaveBeenCalledWith("recruitment.api.v1.candidate.submit_application", {
        job_opening: "HR-OPN-2026-0006",
        form_data: { applicant_name: "Aarav Sharma", phone_number: "+91-9000000000" },
      });
      expect(result).toEqual({ status: "received", name: "APP-ABC123", source: "careers" });
    });

    it("submitApplication never sends an email or status to v1 (identity comes from the session)", async () => {
      (FrappeAPI.post as any).mockResolvedValue({ receipt: "APP-1", status: "received" });
      await jobApplicationService.submitApplication({ job_applicant_email: "x@y.z", job_opening: "J", form_data: {}, status: "Draft" } as any);
      const body = (FrappeAPI.post as any).mock.calls[0][1];
      expect(Object.keys(body).sort()).toEqual(["form_data", "job_opening"]);
    });

    // Spec: CAND-07-A9.3E (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3e)
    it("submitApplication calls submit_invite_application when isCampus is true", async () => {
      const mockRes = {
        status: "ok",
        name: "HR-APP-2026-00123",
        source: "Campus Invite"
      };
      (FrappeAPI.post as any).mockResolvedValue(mockRes);

      const payload = {
        job_applicant_email: "test@example.com",
        job_opening: "HR-OPN-2026-0006",
        form_data: {
          applicant_name: "Aarav Sharma",
        },
        isCampus: true,
        campus_invite: "CINV-2026-0001",
      };
      const result = await jobApplicationService.submitApplication(payload);
      expect(result).toEqual(mockRes);
      expect(FrappeAPI.post).toHaveBeenCalledWith("recruitment.api.channels.campus.submit_invite_application", {
        campus_invite: "CINV-2026-0001",
        job_opening: "HR-OPN-2026-0006",
        email: "test@example.com",
        form_data: {
          applicant_name: "Aarav Sharma",
        },
      });
    });
  });

  describe("draftJobApplicantService", () => {
    // Spec: CAND-07-A9.3F (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3f)
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
    // Spec: CAND-07-A9.3G (docs/spec/clauses/07-services-and-hooks.md#cand-07-a9-3g)
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
      const result = await jobApplicationService.getJobApplicationForm("job1");
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
      expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.v1.candidate.get_application_fields", {
        opening: "job1"
      });

      // Test with isCampus = true
      (FrappeAPI.get as any).mockResolvedValue(mockRawFields);
      await jobApplicationService.getJobApplicationForm("job1", true);
      expect(FrappeAPI.get).toHaveBeenCalledWith("recruitment.api.channels.campus.get_application_fields", {
        opening: "job1"
      });

      (FrappeAPI.get as any).mockResolvedValue([
        { reference_name: "edu", display_name: "Education", fieldtype: "Table", options: "Education", reqd: 0, section: "S",
          columns: [{ fieldname: "school", label: "School", fieldtype: "Data" }] },
        { reference_name: "old", display_name: "Old", fieldtype: "Table", options: "Old", reqd: 0, section: "S",
          table_fields: [{ fieldname: "x", label: "X", fieldtype: "Data" }] },
        { reference_name: "plain", display_name: "Plain", fieldtype: "Data", options: "", reqd: 0, section: "S" },
      ]);
      const tables = await jobApplicationService.getJobApplicationForm("job1");
      expect(tables.fields[0].child_fields).toEqual([{ fieldname: "school", label: "School", fieldtype: "Data" }]);
      expect(tables.fields[1].child_fields).toEqual([{ fieldname: "x", label: "X", fieldtype: "Data" }]);
      expect(tables.fields[2].child_fields).toBeUndefined();

      (FrappeAPI.get as any).mockResolvedValue(null);
      const result2 = await jobApplicationService.getJobApplicationForm();
      expect(result2.fields).toEqual([]);
    });


  });
});
