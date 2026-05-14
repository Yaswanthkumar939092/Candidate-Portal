/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  JobApplicantService,
  JobOpeningService,
} from "../services/jobOpeningService";
import { jobApplicationService } from "../services/jobOpeningService";

export const useJobOpening = ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) => {
  return useQuery<any>({
    queryKey: ["job-opening", page, limit], // page + limit in key → refetches on change
    queryFn: () => JobOpeningService.getJobOpening(page, limit),
  });
};

export const useCreateJobApplicant = () => {
  return useMutation({
    mutationFn: JobApplicantService.createJobApplicant,

    onSuccess: (data) => {
      console.log("✅ Job Applicant Created:", data);
    },

    onError: (error: any) => {
      console.error("❌ Error creating applicant:", error);
    },
  });
};

export function useJobApplicationForm(
  job_opening?: string,
  form_name?: string,
) {
  return useQuery({
    queryKey: ["job-application-form", job_opening, form_name],
    queryFn: async () => {
      const data = await jobApplicationService.getJobApplicationForm(
        job_opening,
        form_name,
      );
      return data ?? { fields: [] };
    },
  });
}
