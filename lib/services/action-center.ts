
import { FrappeAPI } from "../frappe-api";
export const ActionCenterDataService = {
  getActionCenterData: async (userEmail: string) => {
    return FrappeAPI.get(
      "recruitment.api.action_center.get_action_center_items",
      { candidate_email: userEmail }
    );
  },
}

export const ActionCenterMyRequestService = {
  getActionCenterMyRequestService: async (page: number, limit: number, userEmail: string): Promise<any> => {
    const response = await FrappeAPI.getresourceDocumentData("Candidate%20Raise%20Request", {
      method: "GET",
      page,
      limit,
      fields: ["*"],
      filters: [["candidate_email", "=", userEmail]],
    })

    return response.data
  },
}

export const CandidateRaiseRequestService = {
  createCandidateRaiseRequest: async (payload: any): Promise<any> => {
    const response = await FrappeAPI.getresourceDocumentData("Candidate Raise Request", {
      method: "POST",
      data: payload,
    });

    return response.data;
  },
}; 