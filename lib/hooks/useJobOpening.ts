 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomJobOpening, SubmitApplicationPayload, SubmitApplicationResponse, ListOpeningsResponse } from "../../types/job";
import {
  JobOpeningService,
  draftJobApplicantService,
  jobApplicationService,
} from "../services/jobOpeningService";

export const useJobOpening = ({ page, limit, searchTerm, email, enabled }: { page: number; limit: number; searchTerm?: string; email?: string; enabled?: boolean }) => {
  return useQuery<ListOpeningsResponse>({
    queryKey: ["job-opening", page, limit, searchTerm, email],
    queryFn: () => JobOpeningService.getJobOpening(page, limit, searchTerm, email),
    enabled: enabled ?? true,
  });
};

export const useCreateJobApplicant = () => {
  const queryClient = useQueryClient();
  return useMutation<SubmitApplicationResponse, Error, SubmitApplicationPayload>({
    mutationFn: jobApplicationService.submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-opening"] });
    },
    onError: (error: Error) => console.error("❌ Error creating applicant:", error),
  });
};

export const useGetAllDrafts = (email: string) => {
  return useQuery<any>({
    queryKey: ["all-drafts", email],
    queryFn: () => draftJobApplicantService.getAllDrafts(email),
    enabled: !!email,
    retry: false,
  });
};

export const useDeleteDraftJobApplicant = () => {
  return useMutation({
    mutationFn: draftJobApplicantService.deleteDraftJobApplicant,
    onSuccess: (data) => console.log("✅ Draft Deleted:", data),
    onError: (error: any) => console.error("❌ Error deleting draft:", error),
  });
};

export function useJobApplicationForm(job_opening?: string, form_name?: string) {
  return useQuery({
    queryKey: ["job-application-form", job_opening, form_name],
    queryFn: async () => {
      const data = await jobApplicationService.getJobApplicationForm(job_opening, form_name);
      return data ?? { fields: [] };
    },
  });
}
