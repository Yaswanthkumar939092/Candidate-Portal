import { FrappeAPI } from "../frappe-api";

export interface LinkFieldOption {
  id: string;
  label: string;
}

export interface LinkFieldOptionsResponse {
  status: "success" | "error";
  doctype: string;
  title_field: string;
  total: number;
  results: LinkFieldOption[];
}

export const linkFieldService = {
  getLinkFieldOptions: async (doctype: string, searchText?: string): Promise<LinkFieldOptionsResponse> => {
    if (!doctype) throw new Error("Doctype is required");

    const params: Record<string, string> = {
      doctype,
    };
    if (searchText) {
      params.search_text = searchText;
    }

    const res = await FrappeAPI.get("recruitment.api.candidate_portal.get_link_field_options", params);

    if (!res || res.status !== "success") {
      throw new Error("Failed to fetch link field options");
    }

    return res as LinkFieldOptionsResponse;
  },
};
