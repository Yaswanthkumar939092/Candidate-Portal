import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preOfferService } from "../services/pre-offer";
import { PreOfferForm } from "../types/pre-offer";

export function usePreOfferForm(userEmail?: string) {
  return useQuery<PreOfferForm, Error>({
    queryKey: ["pre-offer-form", { userEmail: userEmail || "" }],
    queryFn: () => preOfferService.getPreOfferForm(userEmail || ""),
    staleTime: 1000 * 60 * 1, // 1 minute cache
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
    },
  });
}
