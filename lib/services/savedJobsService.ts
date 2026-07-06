import { FrappeAPI } from "../frappe-api";

export const SavedJobsService = {
  getSavedJobs: async (email: string): Promise<any> => {
    return FrappeAPI.get(
      "recruitment.api.channels.careers.get_saved_job_openings",
      {
        candidate_email: email,
      },
    );
  },

  toggleSavedJob: async (email: string, jobId: string): Promise<any> => {
    return FrappeAPI.post(
      "recruitment.api.channels.careers.toggle_saved_job_opening",
      {
        candidate_email: email,
        job_opening: jobId,
      },
    );
  },

};
export type SavedJobsServiceType = typeof SavedJobsService;
