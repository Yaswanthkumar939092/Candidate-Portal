import { useMutation, useQuery } from "@tanstack/react-query";
import { surveyService } from "../services/survey";
import type { PostLoginRouteResponse, SubmitSurveyPayload, SubmitSurveyResponse } from "@/types/survey";

export function useSurvey() {
  return useQuery<PostLoginRouteResponse>({
    queryKey: ["post-login-route"],
    queryFn: () => surveyService.getPostLoginRoute(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useSubmitSurvey() {
  return useMutation<SubmitSurveyResponse, Error, SubmitSurveyPayload>({
    mutationFn: (payload) => surveyService.submitSurvey(payload),
  });
}
