import { FrappeAPI } from "../frappe-api";
import type { HomeContent } from "@/types/home";

export const homeService = {
  getHomeContent: async () => {
    return FrappeAPI.get(
      "recruitment.api.candidate_home.get_home_content",
    ) as Promise<HomeContent>;
  },
};
