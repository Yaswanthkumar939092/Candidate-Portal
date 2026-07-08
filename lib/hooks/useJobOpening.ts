 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SubmitApplicationPayload, SubmitApplicationResponse, ListOpeningsResponse } from "../../types/job";
import {
  JobOpeningService,
  draftJobApplicantService,
  jobApplicationService,
} from "../services/jobOpeningService";

export const useJobOpening = ({
  page,
  limit,
  searchTerm,
  email,
  enabled,
  campusInvite,
}: {
  page: number;
  limit: number;
  searchTerm?: string;
  email?: string;
  enabled?: boolean;
  campusInvite?: string | null;
}) => {
  return useQuery<ListOpeningsResponse>({
    queryKey: ["job-opening", page, limit, searchTerm, email, campusInvite],
    queryFn: async (): Promise<ListOpeningsResponse> => {
      if (campusInvite) {
        const response = await JobOpeningService.getCampusInviteOpenings(campusInvite, email);
        const openings = (response?.data?.openings || response?.openings || []).map((o: any) => ({
          ...o,
          name: o.name || o.job_opening,
        }));
        return {
          columns: [],
          search_filters: [],
          openings,
          pagination: {
            total: openings.length,
            page: 1,
            limit: openings.length || 10,
            total_pages: 1,
            has_more: false,
          },
        };
      }
      return JobOpeningService.getJobOpening(page, limit, searchTerm, email);
    },
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

export function useJobApplicationForm(job_opening?: string, form_name?: string, isCampus?: boolean) {
  return useQuery({
    queryKey: ["job-application-form", job_opening, form_name, isCampus],
    queryFn: async () => {
      const data = await jobApplicationService.getJobApplicationForm(job_opening, isCampus);
      return data ?? { fields: [] };
    },
  });
}
