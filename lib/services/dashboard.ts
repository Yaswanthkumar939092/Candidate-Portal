import { FrappeAPI } from "../frappe-api";

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

export const dashboardService = {
  getDashboard: async (email: string): Promise<DashboardResponse> => {
    return FrappeAPI.get(
      "recruitment.api.onboarding_dashboard.get_dashboard",
      { email }
    );
  },
};
