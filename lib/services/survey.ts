import { FrappeAPI } from "../frappe-api";
import type { PostLoginRouteResponse, SubmitSurveyPayload, SubmitSurveyResponse } from "@/types/survey";

export const surveyService = {
  getPostLoginRoute: async () => {
    return FrappeAPI.get(
      "recruitment.api.candidate_portal_survey.get_post_login_route"
    ) as Promise<PostLoginRouteResponse>;
  },

  submitSurvey: async (payload: SubmitSurveyPayload): Promise<SubmitSurveyResponse> => {
    return FrappeAPI.post(
      "recruitment.api.candidate_portal_survey.submit_survey",
      payload as unknown as Record<string, unknown>
    ) as Promise<SubmitSurveyResponse>;
  },
};
