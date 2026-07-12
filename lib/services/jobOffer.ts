import { FrappeAPI } from "../frappe-api";
import { frappeApiBase } from "../frappe-base";
import { ConsentFormResponse } from "@/types/consent";

export interface JobOfferSummary {
  expiry_display: string | null;
  applicant_name: string;
  designation: string;
  duration_display: string | null;
  expected_doj_display: string | null;
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
  total_formatted?: string | null;
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
    try {
      const params: Record<string, string> = { appl };
      if (token) {
        params.token = token;
      }
      const result = await FrappeAPI.get("recruitment.job_offer_utils.get_job_offer_summary", params);
      return result;
    } catch (error) {
      console.error("Failed to fetch job offer summary:", error);
      throw error;
    }
  },

  getRejectionReasons: async (): Promise<RejectionReason[]> => {
    try {
      const result = await FrappeAPI.get("recruitment.job_offer_utils.get_rejection_reasons");
      return result;
    } catch (error) {
      console.error("Failed to fetch rejection reasons:", error);
      throw error;
    }
  },

  getCompanyLogo: async (): Promise<{ logo_url: string }> => {
    try {
      const result = await FrappeAPI.get("recruitment.job_offer_utils.get_company_logo");
      return result;
    } catch (error) {
      console.error("Failed to fetch company logo:", error);
      throw error;
    }
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

  updateJobOfferStatus: async (
    params: UpdateJobOfferStatusParams
  ): Promise<UpdateJobOfferStatusResponse> => {
    try {
      const result = await FrappeAPI.post(
        "recruitment.job_offer_utils.job_offer_update",
        params as unknown as Record<string, unknown>
      );
      return result;
    } catch (error) {
      console.error("Failed to update job offer status:", error);
      throw error;
    }
  },

  getJobOfferStatus: async (appl: string, token?: string): Promise<{ status: string }> => {
    try {
      const params: Record<string, string> = { appl };
      if (token) {
        params.token = token;
      }
      const result = await FrappeAPI.get("recruitment.job_offer_utils.get_job_offer_status", params);
      return result;
    } catch (error) {
      console.error("Failed to fetch job offer status:", error);
      throw error;
    }
  },

  getConsentForm: async (appl: string, token: string): Promise<ConsentFormResponse> => {
    try {
      const result = await FrappeAPI.get(
        "recruitment.recruitment.doctype.dpdp_act_settings.dpdp_act_settings.get_consent_form",
        {
          appl,
          token,
        }
      );
      return result;
    } catch (error) {
      console.error("Failed to fetch consent form:", error);
      throw error;
    }
  },

  submitConsent: async (payload: Record<string, unknown>): Promise<any> => {
    try {
      const result = await FrappeAPI.post(
        "recruitment.dpdp_consent.submit_dpdp_consent",
        payload
      );
      return result;
    } catch (error) {
      console.error("Failed to submit consent:", error);
      throw error;
    }
  },
};
