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