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
      action,
    }: {
      stepData: Record<string, Record<string, unknown>>;
      userEmail: string;
      action: "save" | "submit";
    }) => candidateOnboardingService.submitOnboarding(stepData, userEmail, action),
  });
};
