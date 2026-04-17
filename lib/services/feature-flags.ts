import { FrappeAPI } from "../frappe-api";

export const featureFlagsService = {
  getFeatureFlags: async () => {
    return FrappeAPI.get("recruitment.api.candidate_portal.get_candidate_feature_flags");
  },
};
