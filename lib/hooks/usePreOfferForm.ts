import { useQuery, useMutation } from "@tanstack/react-query";
import { preOfferService } from "../services/pre-offer";

export function usePreOfferForm(userEmail?: string) {
  return useQuery({
    queryKey: ["pre-offer-form", { userEmail }],
    queryFn: () => preOfferService.getPreOfferForm(userEmail!),
    enabled: !!userEmail,
    staleTime: 1000 * 60 * 1, // 1 minute cache
  });
}

export function usePreOfferSubmit() {
  return useMutation({
    mutationFn: ({
      stepData,
      userEmail,
    }: {
      stepData: Record<string, Record<string, unknown>>;
      userEmail: string;
    }) => preOfferService.submitPreOffer(stepData, userEmail),
    onSuccess: () => {
      console.log("✅ Pre-Offer Form Submitted Successfully");
    },
    onError: (error: Error) => {
      console.error("❌ Error submitting pre-offer form:", error);
    },
  });
}
