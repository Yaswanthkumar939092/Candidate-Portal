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

    it("maps table_fields into child_fields for table fields", async () => {
      (FrappeAPI.get as any).mockResolvedValue([
        {
          section: "Education Details",
          reference_name: "custom_educational_qualification",
          display_name: "Educational Qualification",
          fieldtype: "Table",
          options: "Employee Education",
          reqd: 0,
          visibility: "All",
          editability: "Editable",
          table_fields: [
            {
              fieldname: "school_univ",
              label: "Institute",
              fieldtype: "Small Text",
              options: "",
              reqd: 1,
              read_only: 0,
              hidden: 0,
            },
            {
              fieldname: "year_of_passing",
              label: "Year of Passing",
              fieldtype: "Int",
              options: "",
              reqd: 0,
              read_only: 0,
              hidden: 0,
            },
          ],
        },
      ]);

      const result = await preOfferService.getPreOfferForm("asha@example.com");
      const tableField = result.tabs[0].sections[0].fields[0];

      expect(tableField.fieldname).toBe("custom_educational_qualification");
      expect(tableField.child_fields?.map((field) => field.fieldname)).toEqual([
        "school_univ",
        "year_of_passing",
      ]);
      expect(tableField.child_fields?.[0]).toMatchObject({
        fieldname: "school_univ",
        label: "Institute",
        fieldtype: "Small Text",
        reqd: 1,
      });
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
