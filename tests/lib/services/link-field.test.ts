import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkFieldService } from "@/lib/services/link-field";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
  },
}));

describe("linkFieldService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Spec: CAND-05-A9.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a9-1b)
  it("fetches link field options correctly without search text", async () => {
    const mockRes = {
      status: "success",
      doctype: "Designation",
      title_field: "custom_designation_title",
      total: 2,
      results: [
        { id: "ID_1", label: "Label 1" },
        { id: "ID_2", label: "Label 2" },
      ],
    };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await linkFieldService.getLinkFieldOptions("Designation");

    expect(result).toEqual(mockRes);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.candidate_portal.get_link_field_options",
      { doctype: "Designation" }
    );
  });

  // Spec: CAND-05-A9.1C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a9-1c)
  it("fetches link field options correctly with search text", async () => {
    const mockRes = {
      status: "success",
      doctype: "Designation",
      title_field: "custom_designation_title",
      total: 1,
      results: [{ id: "ID_1", label: "Label 1" }],
    };
    (FrappeAPI.get as any).mockResolvedValue(mockRes);

    const result = await linkFieldService.getLinkFieldOptions("Designation", "searchQuery");

    expect(result).toEqual(mockRes);
    expect(FrappeAPI.get).toHaveBeenCalledWith(
      "recruitment.api.candidate_portal.get_link_field_options",
      { doctype: "Designation", search_text: "searchQuery" }
    );
  });

  // Spec: CAND-05-A9.1D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a9-1d)
  it("throws error if doctype is missing", async () => {
    await expect(linkFieldService.getLinkFieldOptions("")).rejects.toThrow("Doctype is required");
  });

  // Spec: CAND-05-A9.1E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a9-1e)
  it("throws error if API returns failure", async () => {
    (FrappeAPI.get as any).mockResolvedValue({ status: "error", message: "Failed" });
    await expect(linkFieldService.getLinkFieldOptions("Designation")).rejects.toThrow("Failed to fetch link field options");
  });
});
