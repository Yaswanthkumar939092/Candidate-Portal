import { useMutation } from "@tanstack/react-query";
import { candidateOnboardingService } from "../services/candidate-onboarding";

/**
 * Hook to handle submitting onboarding data to Frappe.
 */
export const useOnboardingSubmit = () => {
  return useMutation({
    mutationFn: ({
      stepData,
      userEmail,
    }: {
      stepData: Record<string, Record<string, unknown>>;
      userEmail: string;
    }) => candidateOnboardingService.submitOnboarding(stepData, userEmail),
  });
};
