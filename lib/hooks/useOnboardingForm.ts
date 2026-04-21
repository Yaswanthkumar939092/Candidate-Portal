import { useQuery } from "@tanstack/react-query";
import { candidateOnboardingService } from "../services/candidate-onboarding";
import { OnboardingFormResponse } from "../types/onboarding";

/**
 * Hook to fetch the dynamic onboarding form configuration.
 */
export function useOnboardingForm(userEmail: string) {
  return useQuery({
    queryKey: ["onboarding-form", userEmail],
    queryFn: async () => {
      const response = await candidateOnboardingService.getOnboardingForm(userEmail);
      return response as OnboardingFormResponse;
    },
    enabled: !!userEmail,
  });
}
