import { FrappeAPI } from "../frappe-api";

export const SavedJobsService = {
  getSavedJobs: async (email: string): Promise<any> => {
    return FrappeAPI.get("recruitment.api.saved_jobs.get_saved_job_openings", {
      candidate_email: email,
    });
  },

  toggleSavedJob: async (email: string, jobId: string): Promise<any> => {
    return FrappeAPI.post(
      "recruitment.api.saved_jobs.toggle_saved_job_opening",
      {
        candidate_email: email,
        job_opening: jobId,
      }
    );
  },

  getJobOpeningsByNames: async (names: string[]): Promise<any> => {
    if (!names || names.length === 0) {
      return { data: [] };
    }
    const response = await FrappeAPI.getresourceDocumentData("Job Opening", {
      method: "GET",
      limit: names.length,
      fields: ["*"],
      filters: [["name", "in", names]],
    });
    return response;
  },
};
export type SavedJobsServiceType = typeof SavedJobsService;
