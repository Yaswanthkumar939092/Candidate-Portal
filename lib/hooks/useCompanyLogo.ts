import { useQuery } from "@tanstack/react-query";
import { jobOfferService } from "../services/jobOffer";

export const useCompanyLogo = (enabled = true) => {
  return useQuery({
    queryKey: ["companyLogo"],
    queryFn: () => jobOfferService.getCompanyLogo(),
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour (logo rarely changes)
  });
};
