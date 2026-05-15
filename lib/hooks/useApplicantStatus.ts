import { useQuery } from "@tanstack/react-query";
import { ApplicantStatusResponse } from "../services/applicantStatusService";

export const useApplicantStatus = (email: string) => {
    return useQuery<ApplicantStatusResponse>({
      queryKey: ["application-status", email],
      queryFn: () => ApplicantStatusResponse.getApplicantStatusResponse(email),
      enabled: !!email, 
      retry: false,     
    });
  };

export const useJobApplicantDetails = (jobApplicantName: string | null) => {
  return useQuery({
    queryKey: ["job-applicant-details", jobApplicantName],
    queryFn: () => ApplicantStatusResponse.getJobApplicant(jobApplicantName!),
    enabled: !!jobApplicantName,
    retry: false,
  });
};