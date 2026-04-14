/* eslint-disable @typescript-eslint/no-explicit-any */
import { FrappeAPI } from "../frappe-api";

export const JobOpeningService = {
    getJobOpening: async (page: number, limit: number): Promise<any> => {
      const response = await FrappeAPI.getresourceDocumentData("Job Opening", {
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
      const response = await FrappeAPI.getresourceDocumentData("Job Applicant", {
        method: "POST",
        data: payload,
      });
  
      return response.data;
    },
  };

  
  export const jobApplicationService = {
    /**
     * Fetch dynamic job application fields
     */
    getJobApplicationForm: async () => {
      try {
        const res = await FrappeAPI.get(
          "recruitment.api.candidate_portal.get_all_job_applicant_fields"
        );
        return res ?? { fields: [] };  // ← .message hatao
    
      } catch (error) {
        console.error("API ERROR:", error);
        return { fields: [] };
      }
    },

  
    /**
     * Submit job application
     */
    submitJobApplication: async (data: Record<string, unknown>) => {
      return FrappeAPI.post(
        "recruitment.api.candidate_portal.create_job_applicant",
        data
      );
    },
  };