 
import { useMutation, useQuery } from "@tanstack/react-query";
import { CustomJobOpening, SubmitApplicationPayload, SubmitApplicationResponse, ListOpeningsResponse } from "../../types/job";
import {
  draftJobApplicantService,
  JobApplicantService,
  JobOpeningService,
  jobApplicationService,
} from "../services/jobOpeningService";

export const useJobOpening = ({ page, limit }: { page: number; limit: number }) => {
  return useQuery<ListOpeningsResponse>({
    queryKey: ["job-opening", page, limit],
    queryFn: () => JobOpeningService.getJobOpening(page, limit),
  });
};

export const useCreateJobApplicant = () => {
  return useMutation<SubmitApplicationResponse, Error, SubmitApplicationPayload>({
    mutationFn: JobApplicantService.createJobApplicant,
    onSuccess: (data) => console.log("✅ Job Applicant Created:", data),
    onError: (error: Error) => console.error("❌ Error creating applicant:", error),
  });
};

// ✅ FIX: enabled must require BOTH email AND jobId (use && not ||)
export const useGetDraftJobApplicant = (email: string, jobId: string) => {
  return useQuery<any>({
    queryKey: ["draft-job-applicant", email, jobId],
    queryFn: () => draftJobApplicantService.getDraftJobApplicant(email, jobId),
    enabled: !!email && !!jobId, // ← was || which caused fetch with empty email
    retry: false,
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

export const useSaveApplication = () => {
  return useMutation({
    mutationFn: draftJobApplicantService.saveApplication,
    onSuccess: (data) => console.log("✅ Application Saved:", data),
    onError: (error: any) => console.error("❌ Error saving application:", error),
  });
};

export const useUpdateDraftJobApplicant = () => {
  return useMutation({
    mutationFn: draftJobApplicantService.updateDraftJobApplicant,
    onSuccess: (data) => console.log("✅ Draft Updated:", data),
    onError: (error: any) => console.error("❌ Error updating draft:", error),
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
