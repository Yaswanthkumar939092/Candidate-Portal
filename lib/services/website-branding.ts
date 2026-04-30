import { FrappeAPI } from "../frappe-api";

export interface WebsiteBranding {
  title_prefix?: string;
  app_logo?: string;
}

export const websiteBrandingService = {
  getWebsiteBranding: async () => {
    return FrappeAPI.get(
      "cn_hrms_core.api.get_website_branding",
    ) as Promise<WebsiteBranding>;
  },
};
