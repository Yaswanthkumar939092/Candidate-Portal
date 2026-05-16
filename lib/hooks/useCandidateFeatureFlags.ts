import { useQuery } from "@tanstack/react-query";
import { featureFlagsService } from "../services/feature-flags";

export function useCandidateFeatureFlags() {
  return useQuery({
    queryKey: ["candidate-feature-flags"],
    queryFn: async () => {
      const response = await featureFlagsService.getFeatureFlags();
      return response as Record<string, 1 | 0 | boolean>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
