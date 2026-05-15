import { useQuery } from "@tanstack/react-query";
import { candidateBrandingService } from "../services/candidate-branding";

export function useCandidateBranding() {
  return useQuery({
    queryKey: ["candidate-branding"],
    queryFn: () => candidateBrandingService.getCandidateBranding(),
    staleTime: 1000 * 60 * 60,
  });
}
