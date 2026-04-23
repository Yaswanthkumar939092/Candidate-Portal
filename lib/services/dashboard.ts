import { FrappeAPI } from "../frappe-api";
import type {
  DashboardApiResponse,
  DashboardData,
} from "../../types/dashboard";

const API_METHODS = {
  GET_DASHBOARD: "recruitment.api.onboarding_dashboard.get_dashboard",
};

export const dashboardService = {
  getDashboardData: async (email: string): Promise<DashboardData> => {
    if (!email) throw new Error("Email is required");

    const res: DashboardApiResponse = await FrappeAPI.get(
      API_METHODS.GET_DASHBOARD,
      { email },
    );

    if (!res.success) {
      throw new Error(res.message || "Failed to fetch dashboard");
    }

    return res.data;
  },
};
