/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import { ActionCenterDataService, ActionCenterMyRequestService, CandidateRaiseRequestService } from "../services/action-center";


export function useActionCenter(userEmail: string) {
  return useQuery({
    queryKey: ["action-center", userEmail],
    queryFn: async () => {
      const response = await ActionCenterDataService.getActionCenterData(userEmail);
      return response;
    },
  });
}

export const useActionCenterMyRequest = ({ page, limit, userEmail }: { page: number; limit: number; userEmail?: string }) => {
  return useQuery<any>({
    queryKey: ["action-center-my-request", page, limit, userEmail],
    queryFn: () => ActionCenterMyRequestService.getActionCenterMyRequestService(page, limit),
  });
};


export const useCandidateRaiseRequest = () => {
  return useMutation({
    mutationFn: CandidateRaiseRequestService.createCandidateRaiseRequest,

    onSuccess: (data) => {
      console.log("✅ Job Applicant Created:", data);
    },

    onError: (error: any) => {
      console.error("❌ Error creating applicant:", error);
    },
  });
};
