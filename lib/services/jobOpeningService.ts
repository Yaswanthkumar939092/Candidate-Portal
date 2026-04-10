/* eslint-disable @typescript-eslint/no-explicit-any */
import { FrappeAPI } from "../frappe-api";

export const JobOpeningService = {
    getJobOpening: async (page: number, limit: number): Promise<any> => {
      const response = await FrappeAPI.resource("Job Opening", {
        method: "GET",
        page,   // ✅ pass page
        limit,  // ✅ pass limit
        fields: ["*"],
      })
  
      return response.data
    },
  }

export const JobApplicantService = {
    createJobApplicant: async (payload: any): Promise<any> => {
      const response = await FrappeAPI.resource("Job Applicant", {
        method: "POST",
        data: payload,
      });
  
      return response.data;
    },
  };