import { FrappeAPI } from "../frappe-api";

export interface CandidateBranding {
  title_prefix?: string;
  app_logo?: string;
}

export const candidateBrandingService = {
  getCandidateBranding: async () => {
    return FrappeAPI.get(
      "recruitment.api.candidate_portal.get_website_branding",
    ) as Promise<CandidateBranding>;
  },
};
