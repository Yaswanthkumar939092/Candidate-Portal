import {
  ApplicationField,
  SubmitApplicationPayload,
  SubmitApplicationResponse,
  ListOpeningsResponse,
} from "../../types/job";
import { FrappeAPI } from "../frappe-api";

export const JobOpeningService = {
  getJobOpening: async (
    page: number,
    limit: number,
    searchTerm?: string,
    email?: string,
  ): Promise<ListOpeningsResponse> => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (searchTerm) {
      params.search_term = searchTerm;
    }
    if (email) {
      params.email = email;
    }
    const response = await FrappeAPI.get(
      "recruitment.api.channels.careers.list_openings",
      params,
    );
    return response as ListOpeningsResponse;
  },

  getCampusInviteOpenings: async (
    campusInvite: string,
    email?: string,
  ): Promise<any> => {
    const params: Record<string, string> = {
      campus_invite: campusInvite,
    };
    if (email) {
      params.email = email;
    }
    return FrappeAPI.get(
      "recruitment.api.channels.campus.get_invite_openings",
      params,
    );
  },
};

export const draftJobApplicantService = {
  // ✅ GET — fetch ALL drafts by email
  getAllDrafts: async (email: string): Promise<any> => {
    const response = await FrappeAPI.get(
      "recruitment.api.channels.careers.get_draft",
      {
        job_applicant_email: email,
      },
    );
    return response;
  },

  // ✅ DELETE — delete draft
  deleteDraftJobApplicant: async ({
    email,
    jobId,
  }: {
    email: string;
    jobId: string;
  }): Promise<any> => {
    return FrappeAPI.post("recruitment.api.channels.careers.delete_draft", {
      job_applicant_email: email,
      job_opening: jobId,
    });
  },
};

export const jobApplicationService = {
  // ✅ Submit job application (status: "Draft" or "Open")
  submitApplication: async (
    payload: SubmitApplicationPayload,
  ): Promise<SubmitApplicationResponse> => {
    if (payload.isCampus && payload.campus_invite) {
      const response = await FrappeAPI.post(
        "recruitment.api.channels.campus.submit_invite_application",
        {
          campus_invite: payload.campus_invite,
          job_opening: payload.job_opening,
          email: payload.job_applicant_email,
          form_data: payload.form_data,
        },
      );
      return response as SubmitApplicationResponse;
    }

    const response = await FrappeAPI.post(
      "recruitment.api.channels.careers.submit_application",
      payload as unknown as Record<string, unknown>,
    );
    return response as SubmitApplicationResponse;
  },

  getJobApplicationForm: async (
    job_opening?: string,
    isCampus?: boolean,
  ): Promise<any> => {
    try {
      const params: Record<string, string> = {};
      if (job_opening) params.opening = job_opening;

      const endpoint = isCampus
        ? "recruitment.api.channels.campus.get_application_fields"
        : "recruitment.api.channels.careers.get_application_fields";

      const res = await FrappeAPI.get(endpoint, params);

      const fields = (res || []).map((field: ApplicationField) => ({
        fieldname: field.reference_name,
        label: field.display_name,
        fieldtype: field.fieldtype,
        options: field.options,
        reqd: field.reqd,
        is_mandatory: field.reqd,
        tab_label: field.section,
        section_label: "Details",
        child_fields: field.table_fields,
        value: field.value,
      }));

      return { fields };
    } catch (error) {
      console.error("API ERROR:", error);
      return { fields: [] };
    }
  },
};
