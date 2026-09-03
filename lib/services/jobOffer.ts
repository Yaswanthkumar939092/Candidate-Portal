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

  /**
   * Reports whether a culture book actually exists for this application.
   *
   * `preview_culture_book` answers with the PDF when one is configured and with
   * a JSON body of `{ message: { available: false } }` when it is not, so the
   * content type tells the two apart. The PDF body is never read - the response
   * is cancelled once the headers arrive - so this stays cheap enough to run on
   * dashboard load.
   */
  isCultureBookAvailable: async (appl: string, token?: string): Promise<boolean> => {
    if (!appl) return false;
    const url = jobOfferService.getCultureBookPdfUrl(appl, token);
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        void response.body?.cancel();
        return false;
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        void response.body?.cancel();
        return true;
      }
      const data = await response.json();
      return data?.message?.available !== false;
    } catch {
      return false;
    }
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
