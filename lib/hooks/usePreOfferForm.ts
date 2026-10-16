import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preOfferService } from "../services/pre-offer";
import { PreOfferForm, PreOfferFormState } from "../types/pre-offer";

export function usePreOfferForm(userEmail?: string) {
  return useQuery<PreOfferForm, Error>({
    queryKey: ["pre-offer-form", { userEmail: userEmail || "" }],
    queryFn: () => preOfferService.getPreOfferForm(userEmail || ""),
    staleTime: 1000 * 60 * 1, // 1 minute cache
  });
}

/**
 * Whether the candidate has already submitted this pre-offer form, so the page
 * can open it read-only instead of offering a second submission.
 */
export function usePreOfferFormState(jobApplicant?: string) {
  return useQuery<PreOfferFormState, Error>({
    queryKey: ["pre-offer-form-state", jobApplicant || ""],
    queryFn: () => preOfferService.getPreOfferFormState(jobApplicant || ""),
    enabled: !!jobApplicant,
  });
}

export function useSubmitPreOffer() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { jobApplicant: string; data: Record<string, unknown> }>({
    mutationFn: ({ jobApplicant, data }) => preOfferService.submitPreOffer(jobApplicant, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pre-offer-form", { userEmail: variables.jobApplicant }],
      });
      queryClient.invalidateQueries({
        queryKey: ["pre-offer-form-state", variables.jobApplicant],
      });
    },
  });
}
