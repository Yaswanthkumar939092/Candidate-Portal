import { useQuery } from "@tanstack/react-query";
import { candidateOnboardingService } from "../services/candidate-onboarding";

interface GenderOption {
  gender: string;
}

interface GenderResponse {
  data: GenderOption[];
}

/**
 * Hook to fetch dynamic gender options.
 */
export function useGenderOptions() {
  return useQuery({
    queryKey: ["gender-options"],
    queryFn: async () => {
      const response = await candidateOnboardingService.getGenderOptions();
      return response as GenderResponse;
    },
    select: (data) => data?.data?.map((item) => item.gender) || [],
  });
}
