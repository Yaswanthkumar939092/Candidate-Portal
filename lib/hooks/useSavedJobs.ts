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
      // Invalidate both saved-jobs list and job opening list to sync UI
      queryClient.invalidateQueries({ queryKey: ["saved-jobs", variables.email] });
    },
  });
};

export const useGetSavedJobDetails = (names: string[]) => {
  return useQuery<any>({
    queryKey: ["saved-job-details", names],
    queryFn: () => SavedJobsService.getJobOpeningsByNames(names),
    enabled: Array.isArray(names) && names.length > 0,
    retry: false,
  });
};
