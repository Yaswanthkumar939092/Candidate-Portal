import { describe, expect, it } from "vitest";
import { OnboardingTab } from "@/lib/types/onboarding";
import { validateOnboardingStep } from "@/lib/validation/onboarding-validation";

function createEducationTab(): OnboardingTab {
  return {
    tab: "Education",
    sections: [
      {
        section: "Education",
        fields: [
          {
            fieldname: "custom_has_post_graduation_degree",
            label: "Do you have Post Graduation Degree?",
            fieldtype: "Select",
            is_mandatory: 1,
            read_only: 0,
            hidden: 0,
            options: "No\nYes",
          },
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
                options: "10th\n12th\nGraduation\nPost Graduation",
                is_mandatory: 1,
                reqd: 1,
                read_only: 0,
                hidden: 0,
              },
              {
                fieldname: "year_of_passing",
                label: "Year of Passing",
                fieldtype: "Data",
                is_mandatory: 1,
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
}

describe("validateOnboardingStep", () => {
  it("returns nested errors for required child fields in rendered table rows", () => {
    const tab: OnboardingTab = {
      tab: "Education",
      sections: [
        {
          section: "Education",
          fields: [
            {
              fieldname: "custom_required_child_details",
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
      { custom_required_child_details: [{ education_level: "", city: "" }] },
      {},
    );

    const tableErrors = errors.custom_required_child_details as Array<Record<string, { message?: string }>>;

    expect(tableErrors[0].education_level.message).toBe("Education Level is required");
    expect(tableErrors[0].city.message).toBe("City is required");
    expect((tableErrors as typeof tableErrors & { message?: string }).message).toBe(
      "Please complete all required fields in Education Details",
    );
  });

  it("requires 10th, 12th, and Graduation education details before continuing", () => {
    const errors = validateOnboardingStep(
      createEducationTab(),
      {
        custom_has_post_graduation_degree: "No",
        custom_education_details: [
          { education_level: "10th", year_of_passing: "2018" },
        ],
      },
      {},
    );

    expect((errors.custom_education_details as { message?: string }).message).toBe(
      "Please add education details for: 12th, Graduation",
    );
  });

  it("requires education details even when the education table is empty", () => {
    const errors = validateOnboardingStep(
      createEducationTab(),
      {
        custom_has_post_graduation_degree: "No",
        custom_education_details: [],
      },
      {},
    );

    expect((errors.custom_education_details as { message?: string }).message).toBe(
      "Please add education details for: 10th, 12th, Graduation",
    );
  });

  it("requires post graduation details when the candidate selects Yes", () => {
    const errors = validateOnboardingStep(
      createEducationTab(),
      {
        custom_has_post_graduation_degree: "Yes",
        custom_education_details: [
          { education_level: "10th", year_of_passing: "2018" },
          { education_level: "12th", year_of_passing: "2020" },
          { education_level: "Graduation", year_of_passing: "2023" },
        ],
      },
      {},
    );

    expect((errors.custom_education_details as { message?: string }).message).toBe(
      "Please add education details for: Post Graduation",
    );
  });

  it("allows education details without post graduation when the candidate selects No", () => {
    const errors = validateOnboardingStep(
      createEducationTab(),
      {
        custom_has_post_graduation_degree: "No",
        custom_education_details: [
          { education_level: "10th", year_of_passing: "2018" },
          { education_level: "12th", year_of_passing: "2020" },
          { education_level: "Graduation", year_of_passing: "2023" },
        ],
      },
      {},
    );

    expect(errors.custom_education_details).toBeUndefined();
  });
});
