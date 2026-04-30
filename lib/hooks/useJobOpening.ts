/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  draftJobApplicantService,
  JobApplicantService,
  JobOpeningService,
  jobApplicationService,
} from "../services/jobOpeningService";

export const useJobOpening = ({ page, limit }: { page: number; limit: number }) => {
  return useQuery<any>({
    queryKey: ["job-opening", page, limit],
    queryFn: () => JobOpeningService.getJobOpening(page, limit),
  });
};

export const useCreateJobApplicant = () => {
  return useMutation({
    mutationFn: JobApplicantService.createJobApplicant,
    onSuccess: (data) => console.log("✅ Job Applicant Created:", data),
    onError: (error: any) => console.error("❌ Error creating applicant:", error),
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

export const useCreateDraftJobApplicant = () => {
  return useMutation({
    mutationFn: draftJobApplicantService.createDraftJobApplicant,
    onSuccess: (data) => console.log("✅ Draft Created:", data),
    onError: (error: any) => console.error("❌ Error creating draft:", error),
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

export function useJobApplicationForm() {
  return useQuery({
    queryKey: ["job-application-form"],
    queryFn: async () => {
      const data = await jobApplicationService.getJobApplicationForm();
      return data ?? { fields: [] };
    },
  });
}