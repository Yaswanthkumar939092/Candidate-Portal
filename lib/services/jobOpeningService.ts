 
import { CustomJobOpening } from "../../types/job";
import { FrappeAPI } from "../frappe-api";

export const JobOpeningService = {
  getJobOpening: async (page: number, limit: number): Promise<CustomJobOpening[]> => {
    const response = await FrappeAPI.get("recruitment.api.channels.careers.list_openings", {
      page: String(page),
      limit: String(limit),
    });
    return response as CustomJobOpening[];
  },
};


//will discard this. we are not using this. 
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

  // ✅ SAVE APPLICATION — POST draft or final application
  saveApplication: async (payload: any): Promise<any> => {
    let formData = payload.form_data;
    if (typeof formData === "string") {
      try {
        formData = JSON.parse(formData);
      } catch (e) {
        console.error("Failed to parse form_data:", e);
      }
    }

    const postData: Record<string, any> = {
      job_applicant_email: payload.job_applicant_email,
      job_opening: payload.job_opening,
      form_data: formData,
    };

    if (payload.status) {
      postData.status = payload.status;
    }

    const response = await FrappeAPI.post("recruitment.api.draft_application.save_application", postData);
    return response;
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
