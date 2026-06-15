import { FrappeAPI } from "../frappe-api";

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
}

export interface UpdateJobOfferStatusResponse {
  jo_id: string;
  webform: string;
}

export interface RejectionReason {
  name: string;
  reason: string;
}

export const jobOfferService = {
  getJobOfferSummary: async (appl: string): Promise<JobOfferSummary> => {
    try {
      const result = await FrappeAPI.get("recruitment.job_offer_utils.get_job_offer_summary", {
        appl,
      });
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

  getJobOfferPdfUrl: (appl: string): string => {
    const configuredUrl = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
    const params = new URLSearchParams({ appl }).toString();
    return `${configuredUrl}/api/method/recruitment.job_offer_utils.download_job_offer_pdf?${params}`;
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

  getJobOfferStatus: async (appl: string): Promise<{ status: string }> => {
    try {
      const result = await FrappeAPI.get("recruitment.job_offer_utils.get_job_offer_status", {
        appl,
      });
      return result;
    } catch (error) {
      console.error("Failed to fetch job offer status:", error);
      throw error;
    }
  },
};
