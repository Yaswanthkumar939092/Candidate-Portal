import { FrappeAPI } from "../frappe-api";
import { frappeApiBase } from "../frappe-base";
import { ConsentFormResponse } from "@/types/consent";

export interface JobOfferSummary {
  expiry_display: string | null;
  applicant_name: string;
  designation: string;
  duration_display: string | null;
  expected_doj_display: string | null;
  trainee_doj_display?: string | null;
  stipend_display: string | null;
  employment_type?: string | null;
  compensation_type?: string | null;
  stipend?: number | null;
  fixed?: number | null;
  variable?: number | null;
  total?: number | null;
  stipend_formatted?: string | null;
  fixed_formatted?: string | null;
  variable_formatted?: string | null;
  location_allowance?: number | null;
  location_allowance_formatted?: string | null;
  total_formatted?: string | null;
  count?: number;
}

export interface UpdateJobOfferStatusParams {
  status: "Accepted" | "Rejected";
  appl: string;
  reason?: string;
  message?: string;
  token?: string;
}

export interface UpdateJobOfferStatusResponse {
  jo_id: string;
  webform: string;
  dpdp_consent_required?: boolean;
}

export interface RejectionReason {
  name: string;
  reason: string;
}

export const jobOfferService = {
  getJobOfferSummary: async (appl: string, token?: string): Promise<JobOfferSummary> => {
    const params: Record<string, string> = { appl };
    if (token) {
      params.token = token;
    }
    return await FrappeAPI.get("recruitment.job_offer_utils.get_job_offer_summary", params);
  },

  getRejectionReasons: async (): Promise<RejectionReason[]> => {
    return await FrappeAPI.get("recruitment.job_offer_utils.get_rejection_reasons");
  },

  getCompanyLogo: async (): Promise<{ logo_url: string }> => {
    return await FrappeAPI.get("recruitment.job_offer_utils.get_company_logo");
  },

  getJobOfferPdfUrl: (appl: string, token?: string): string => {
    const paramsObj: Record<string, string> = { appl };
    if (token) {
      paramsObj.token = token;
    }
    const params = new URLSearchParams(paramsObj).toString();
    // Same-origin proxy in the browser so the PDF request carries the
    // first-party session cookie (iOS Safari ITP-safe).
    return `${frappeApiBase()}/api/method/recruitment.job_offer_utils.download_job_offer_pdf?${params}`;
  },

  getCultureBookPdfUrl: (appl: string, token?: string): string => {
    const paramsObj: Record<string, string> = { appl };
    if (token) {
      paramsObj.token = token;
    }
    const params = new URLSearchParams(paramsObj).toString();
    return `${frappeApiBase()}/api/method/recruitment.job_offer_utils.preview_culture_book?${params}`;
  },

  updateJobOfferStatus: async (
    params: UpdateJobOfferStatusParams
  ): Promise<UpdateJobOfferStatusResponse> => {
    return await FrappeAPI.post(
      "recruitment.job_offer_utils.job_offer_update",
      params as unknown as Record<string, unknown>
    );
  },

  getJobOfferStatus: async (appl: string, token?: string): Promise<{ status: string }> => {
    const params: Record<string, string> = { appl };
    if (token) {
      params.token = token;
    }
    return await FrappeAPI.get("recruitment.job_offer_utils.get_job_offer_status", params);
  },

  getConsentForm: async (appl: string, token: string): Promise<ConsentFormResponse> => {
    return await FrappeAPI.get(
      "recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form",
      {
        appl,
        token,
      }
    );
  },

  submitConsent: async (payload: Record<string, unknown>): Promise<any> => {
    return await FrappeAPI.post(
      "recruitment.dpdp_consent.submit_dpdp_consent",
      payload
    );
  },

  getJobOfferLetters: async (appl: string, token?: string): Promise<{ count: number, letters: { index: number, print_format: string, filename: string, pdf_base64: string }[] }> => {
    const params: Record<string, string> = { appl, separate: "1" };
    if (token) {
      params.token = token;
    }
    return await FrappeAPI.get("recruitment.job_offer_utils.download_job_offer_pdf", params);
  },
};
