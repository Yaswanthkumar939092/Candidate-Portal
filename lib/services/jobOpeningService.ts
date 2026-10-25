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
    _email?: string,
  ): Promise<ListOpeningsResponse> => {
    const pageLength = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const params: Record<string, string> = {
      page: String(page),
      page_length: String(pageLength),
    };
    if (searchTerm) {
      params.search = searchTerm;
    }
    const [list, applied] = await Promise.all([
      FrappeAPI.get("recruitment.api.v1.candidate.list_openings", params) as Promise<{
        openings?: Record<string, unknown>[];
        page?: number;
        page_length?: number;
        total?: number;
      }>,
      (
        FrappeAPI.get("recruitment.api.v1.candidate.my_applications", {}) as Promise<
          { job_opening: string }[]
        >
      ).catch(() => [] as { job_opening: string }[]),
    ]);
    const appliedTo = new Set((applied ?? []).map((a) => a.job_opening));
    const openings = (list?.openings ?? []).map((o) => ({
      ...o,
      applied: appliedTo.has(String(o.name)),
      saved: false,
    })) as unknown as ListOpeningsResponse["openings"];
    const total = list?.total ?? openings.length;
    const size = list?.page_length || pageLength;
    const current = list?.page || page;
    const totalPages = Math.max(Math.ceil(total / size), 1);
    return {
      columns: [],
      search_filters: [],
      openings,
      pagination: {
        total,
        page: current,
        limit: size,
        total_pages: totalPages,
        has_more: current < totalPages,
      },
    };
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

    const response = (await FrappeAPI.post("recruitment.api.v1.candidate.submit_application", {
      job_opening: payload.job_opening,
      form_data: payload.form_data,
    })) as { receipt: string; status: string };
    return { status: response.status, name: response.receipt, source: "careers" };
  },

  getJobApplicationForm: async (
    job_opening?: string,
    isCampus?: boolean,
    email?: string,
    campus_invite?: string,
  ): Promise<any> => {
    try {
      const params: Record<string, string> = {};
      if (job_opening) params.opening = job_opening;
      if (isCampus && email) params.email = email;
      if (isCampus && campus_invite) params.campus_invite = campus_invite;

      const endpoint = isCampus
        ? "recruitment.api.channels.campus.get_application_fields"
        : "recruitment.api.v1.candidate.get_application_fields";

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
        child_fields: field.columns ?? field.table_fields,
        value: field.value,
        stage_requirement: field.stage_requirement,
      }));

      return { fields };
    } catch (error) {
      console.error("API ERROR:", error);
      return { fields: [] };
    }
  },
};
