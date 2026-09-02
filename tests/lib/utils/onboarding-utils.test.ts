import { describe, it, expect } from "vitest";
import { evaluateDependsOn, isFieldFilled } from "@/lib/onboarding-utils";
import { OnboardingField } from "@/lib/types/onboarding";

describe("evaluateDependsOn", () => {
  it("should return true if expression is empty or undefined", () => {
    expect(evaluateDependsOn(undefined, {})).toBe(true);
    expect(evaluateDependsOn("", {})).toBe(true);
  });

  it("should evaluate a simple eval expression", () => {
    const doc = { custom_has_passport: "Yes" };
    expect(evaluateDependsOn("eval:doc.custom_has_passport=='Yes'", doc)).toBe(true);
    expect(evaluateDependsOn("eval:doc.custom_has_passport=='No'", doc)).toBe(false);
  });

  it("should evaluate expression without eval prefix", () => {
    const doc = { custom_has_passport: "Yes" };
    expect(evaluateDependsOn("doc.custom_has_passport=='Yes'", doc)).toBe(true);
    expect(evaluateDependsOn("doc.custom_has_passport=='No'", doc)).toBe(false);
  });

  it("should handle boolean/falsy evaluation", () => {
    const doc = { custom_has_passport: "No", custom_passport_number: "" };
    expect(evaluateDependsOn("eval:!doc.custom_passport_number", doc)).toBe(true);
  });

  it("should evaluate expression with simple fieldname", () => {
    const doc = { custom_is_rehire: 1, custom_another_field: 0 };
    expect(evaluateDependsOn("custom_is_rehire", doc)).toBe(true);
    expect(evaluateDependsOn("custom_another_field", doc)).toBe(false);
    expect(evaluateDependsOn("non_existent_field", doc)).toBe(false);
  });

  it("should handle error cases gracefully by returning false", () => {
    const doc = {};
    // Invalid javascript syntax should fail evaluation gracefully
    expect(evaluateDependsOn("eval:doc.custom_has_passport===", doc)).toBe(false);
  });
});

describe("isFieldFilled", () => {
  it("does not require table child fields that are hidden by their dependency", () => {
    const educationField: OnboardingField = {
      fieldname: "custom_education_details",
      label: "Education Details",
      fieldtype: "Table",
      is_mandatory: 1,
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
          fieldname: "school_or_college",
          label: "School Name",
          fieldtype: "Data",
          is_mandatory: 0,
          reqd: 1,
          read_only: 0,
          hidden: 0,
          depends_on: "eval:['10th', '12th'].includes(doc.education_level)",
        },
        {
          fieldname: "college_name",
          label: "College Name",
          fieldtype: "Data",
          is_mandatory: 0,
          reqd: 1,
          read_only: 0,
          hidden: 0,
          depends_on: "eval:['Graduation', 'Post Graduation'].includes(doc.education_level)",
        },
      ],
    };

    expect(
      isFieldFilled(educationField, {
        custom_education_details: [
          { education_level: "10th", school_or_college: "Example School" },
          { education_level: "Graduation", college_name: "Example College" },
        ],
      }),
    ).toBe(true);
  });
});
