import { describe, it, expect, vi, beforeEach } from "vitest";
import { preOfferService } from "@/lib/services/pre-offer";
import { FrappeAPI } from "@/lib/frappe-api";

// Mock FrappeAPI
vi.mock("@/lib/frappe-api", () => ({
  FrappeAPI: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("preOfferService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPreOfferForm", () => {
    it("calls FrappeAPI.get with correct arguments and transforms data", async () => {
      const mockFields = [
        {
          reference_name: "applicant_name",
          display_name: "Applicant Name",
          fieldtype: "Data",
          reqd: 1,
          ctq: 0,
          visibility: "All",
          editability: "Editable",
          options: "",
          section: "Personal Details",
          value: "Asha Rao",
        },
      ];
      (FrappeAPI.get as any).mockResolvedValue(mockFields);

      const result = await preOfferService.getPreOfferForm("asha@example.com");

      expect(FrappeAPI.get).toHaveBeenCalledWith(
        "recruitment.api.channels.pre_offer.get_application_fields",
        { job_applicant: "asha@example.com" }
      );
      expect(result.applicantId).toBe("asha@example.com");
      expect(result.tabs[0].tab).toBe("Personal Details");
      expect(result.tabs[0].sections[0].fields[0].fieldname).toBe("applicant_name");
    });

    it("calls FrappeAPI.get without job_applicant param if email is not provided", async () => {
      (FrappeAPI.get as any).mockResolvedValue([]);
      const result = await preOfferService.getPreOfferForm("");
      expect(FrappeAPI.get).toHaveBeenCalledWith(
        "recruitment.api.channels.pre_offer.get_application_fields",
        {}
      );
      expect(result.applicantId).toBe("");
    });
  });

  describe("submitPreOffer", () => {
    it("calls FrappeAPI.post with correct arguments", async () => {
      (FrappeAPI.post as any).mockResolvedValue({ success: true });
      const data = { applicant_name: "Asha Rao" };
      await preOfferService.submitPreOffer("asha@example.com", data);
      expect(FrappeAPI.post).toHaveBeenCalledWith(
        "recruitment.api.channels.pre_offer.submit_application",
        {
          job_applicant: "asha@example.com",
          data: JSON.stringify(data),
        }
      );
    });
  });
});
