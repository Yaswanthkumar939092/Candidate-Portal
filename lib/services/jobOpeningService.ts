 
import { FrappeAPI } from "../frappe-api";

export const JobOpeningService = {
  getJobOpening: async (page: number, limit: number): Promise<any> => {
    const response = await FrappeAPI.getresourceDocumentData("Job Opening", {
      method: "GET",
      page,
      limit,
      fields: ["*"],
    });
    return response.data;
  },
};

export const JobApplicantService = {
  createJobApplicant: async (payload: any): Promise<any> => {
    const response = await FrappeAPI.getresourceDocumentData("Job Applicant", {
      method: "POST",
      data: payload,
    });
    return response.data;
  },
};

export const draftJobApplicantService = {
  // ✅ GET — fetch existing draft by email
  getDraftJobApplicant: async (email: string, jobId: string): Promise<any> => {
    const response = await FrappeAPI.get(
      "recruitment.api.draft_application.get_draft",
      {
        job_applicant_email: email,
        job_opening: jobId
        }
    );
    return response;
  },

  // ✅ GET — fetch ALL drafts by email
  getAllDrafts: async (email: string): Promise<any> => {
    const response = await FrappeAPI.get(
      "recruitment.api.draft_application.get_draft",
      {
        job_applicant_email: email,
      }
    );
    return response;
  },

  // ✅ CREATE — POST new draft
  createDraftJobApplicant: async (payload: any): Promise<any> => {
    const response = await FrappeAPI.getresourceDocumentData("Draft Application", {
      method: "POST",
      data: payload,
    });
    return response.data;
  },

  // ✅ UPDATE — PUT existing draft by name
  updateDraftJobApplicant: async ({
    name,
    payload,
  }: {
    name: string;
    payload: any;
  }): Promise<any> => {
    const response = await FrappeAPI.getresourceDocumentData(
      `Draft Application/${name}`,
      {
        method: "PUT",
        data: payload,
      }
    );
    return response.data;
  },

  // ✅ DELETE — delete draft
  deleteDraftJobApplicant: async ({
    email,
    jobId,
  }: {
    email: string;
    jobId: string;
  }): Promise<any> => {
    return FrappeAPI.post("recruitment.api.draft_application.delete_draft", {
      job_applicant_email: email,
      job_opening: jobId,
    });
  },
};

export const jobApplicationService = {
  // ✅ Fetch dynamic job application fields
  getJobApplicationForm: async (job_opening?: string, form_name?: string) => {
    try {
      const params: Record<string, string> = {};
      if (job_opening) params.job_opening = job_opening;
      if (form_name) params.form_name = form_name;

      const res = await FrappeAPI.get(
        "recruitment.api.candidate_portal.get_all_job_applicant_fields",
        params
      );
      return res ?? { fields: [] };
    } catch (error) {
      console.error("API ERROR:", error);
      return { fields: [] };
    }
  },

  // ✅ Submit final job application
  submitJobApplication: async (data: Record<string, unknown>) => {
    return FrappeAPI.post(
      "recruitment.api.candidate_portal.create_job_applicant",
      data
    );
  },
};
