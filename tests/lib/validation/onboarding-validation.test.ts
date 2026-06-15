import { describe, expect, it } from "vitest";
import { OnboardingTab } from "@/lib/types/onboarding";
import { validateOnboardingStep } from "@/lib/validation/onboarding-validation";

describe("validateOnboardingStep", () => {
  it("returns nested errors for required child fields in rendered table rows", () => {
    const tab: OnboardingTab = {
      tab: "Education",
      sections: [
        {
          section: "Education",
          fields: [
            {
              fieldname: "custom_education_details",
              label: "Education Details",
              fieldtype: "Table",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
              child_fields: [
                {
                  fieldname: "education_level",
                  label: "Education Level",
                  fieldtype: "Select",
                  is_mandatory: 0,
                  reqd: 1,
                  read_only: 0,
                  hidden: 0,
                },
                {
                  fieldname: "city",
                  label: "City",
                  fieldtype: "Link",
                  is_mandatory: 0,
                  reqd: 1,
                  read_only: 0,
                  hidden: 0,
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = validateOnboardingStep(
      tab,
      { custom_education_details: [{ education_level: "", city: "" }] },
      {},
    );

    const tableErrors = errors.custom_education_details as Array<Record<string, { message?: string }>>;

    expect(tableErrors[0].education_level.message).toBe("Education Level is required");
    expect(tableErrors[0].city.message).toBe("City is required");
    expect((tableErrors as typeof tableErrors & { message?: string }).message).toBe(
      "Please complete all required fields in Education Details",
    );
  });
});
