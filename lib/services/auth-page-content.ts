import { FrappeAPI } from "../frappe-api";

export interface AuthPagePoint {
  title?: string | null;
  description?: string | null;
}

export interface AuthPageSection {
  heading?: string | null;
  subheading?: string | null;
  background_image?: string | null;
  points?: AuthPagePoint[] | null;
}

export interface AuthPageContent {
  logo?: string | null;
  footer?: string | null;
  login?: AuthPageSection | null;
  signup?: AuthPageSection | null;
}

export const authPageContentService = {
  getAuthPageContent: async () => {
    return FrappeAPI.get(
      "recruitment.api.candidate_auth.get_auth_page_content",
    ) as Promise<AuthPageContent>;
  },
};
