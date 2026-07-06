import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SavedJobsService } from "../services/savedJobsService";

export const useGetSavedJobs = (email: string) => {
  return useQuery<any>({
    queryKey: ["saved-jobs", email],
    queryFn: () => SavedJobsService.getSavedJobs(email),
    enabled: !!email,
    retry: false,
  });
};

export const useToggleSavedJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, jobId }: { email: string; jobId: string }) =>
      SavedJobsService.toggleSavedJob(email, jobId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs", variables.email] });
      queryClient.invalidateQueries({ queryKey: ["job-opening"] });
    },
  });
};


