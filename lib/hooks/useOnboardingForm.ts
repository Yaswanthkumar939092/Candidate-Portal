import { useQuery } from "@tanstack/react-query";
import { candidateOnboardingService } from "../services/candidate-onboarding";

export function useOnboardingForm(userEmail?: string) {
  return useQuery({
    queryKey: ["onboarding-form", { userEmail }],
    queryFn: () => candidateOnboardingService.getOnboardingForm(userEmail!),
    enabled: !!userEmail,
    staleTime: 1000 * 60 * 1,
  });
}
