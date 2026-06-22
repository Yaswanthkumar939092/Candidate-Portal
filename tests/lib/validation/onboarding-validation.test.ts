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

  describe("custom_ifsc_code validation", () => {
    const ifscTab: OnboardingTab = {
      tab: "Bank Details",
      sections: [
        {
          section: "Bank Information",
          fields: [
            {
              fieldname: "custom_ifsc_code",
              label: "IFSC Code",
              fieldtype: "Data",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
            },
          ],
        },
      ],
    };

    it("accepts valid uppercase alphanumeric IFSC code matching BBBB0AAAAAA", () => {
      const errors = validateOnboardingStep(
        ifscTab,
        { custom_ifsc_code: "SBIN0123456" },
        {}
      );
      expect(errors.custom_ifsc_code).toBeUndefined();
    });

    it("rejects lowercase IFSC code", () => {
      const errors = validateOnboardingStep(
        ifscTab,
        { custom_ifsc_code: "sbin0123456" },
        {}
      );
      expect(errors.custom_ifsc_code).toBeDefined();
      expect((errors.custom_ifsc_code as any).message).toContain("valid 11-character IFSC code");
    });

    it("rejects non-alphanumeric branch code", () => {
      const errors = validateOnboardingStep(
        ifscTab,
        { custom_ifsc_code: "SBIN012345-" },
        {}
      );
      expect(errors.custom_ifsc_code).toBeDefined();
    });

    it("rejects non-alphabetic bank code", () => {
      const errors = validateOnboardingStep(
        ifscTab,
        { custom_ifsc_code: "SB1N0123456" },
        {}
      );
      expect(errors.custom_ifsc_code).toBeDefined();
    });

    it("rejects non-zero fifth character", () => {
      const errors = validateOnboardingStep(
        ifscTab,
        { custom_ifsc_code: "SBINA123456" },
        {}
      );
      expect(errors.custom_ifsc_code).toBeDefined();
    });

    it("rejects length different from 11 characters", () => {
      const errors = validateOnboardingStep(
        ifscTab,
        { custom_ifsc_code: "SBIN012345" },
        {}
      );
      expect(errors.custom_ifsc_code).toBeDefined();
    });
  });

  describe("reporting_manager_contact_number validation", () => {
    const contactTab: OnboardingTab = {
      tab: "Contact Details",
      sections: [
        {
          section: "Emergency Info",
          fields: [
            {
              fieldname: "reporting_manager_contact_number",
              label: "Reporting Manager Contact Number",
              fieldtype: "Data",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
            },
          ],
        },
      ],
    };

    it("accepts valid 10-digit numeric phone number", () => {
      const errors = validateOnboardingStep(
        contactTab,
        { reporting_manager_contact_number: "9876543210" },
        {}
      );
      expect(errors.reporting_manager_contact_number).toBeUndefined();
    });

    it("rejects non-numeric phone number", () => {
      const errors = validateOnboardingStep(
        contactTab,
        { reporting_manager_contact_number: "987654321a" },
        {}
      );
      expect(errors.reporting_manager_contact_number).toBeDefined();
      expect((errors.reporting_manager_contact_number as any).message).toContain("valid 10-digit mobile number");
    });

    it("rejects shorter phone number", () => {
      const errors = validateOnboardingStep(
        contactTab,
        { reporting_manager_contact_number: "987654321" },
        {}
      );
      expect(errors.reporting_manager_contact_number).toBeDefined();
    });

    it("rejects longer phone number", () => {
      const errors = validateOnboardingStep(
        contactTab,
        { reporting_manager_contact_number: "98765432101" },
        {}
      );
      expect(errors.reporting_manager_contact_number).toBeDefined();
    });
  });

  describe("table fields pattern validation", () => {
    const tableTab: OnboardingTab = {
      tab: "Contacts",
      sections: [
        {
          section: "Key Contacts",
          fields: [
            {
              fieldname: "custom_key_contacts",
              label: "Key Contacts",
              fieldtype: "Table",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
              child_fields: [
                {
                  fieldname: "reporting_manager_contact_number",
                  label: "Reporting Manager Contact Number",
                  fieldtype: "Data",
                  is_mandatory: 0,
                  read_only: 0,
                  hidden: 0,
                },
                {
                  fieldname: "email",
                  label: "Email ID",
                  fieldtype: "Data",
                  is_mandatory: 0,
                  read_only: 0,
                  hidden: 0,
                }
              ]
            }
          ]
        }
      ]
    };

    it("accepts valid phone and email in table row", () => {
      const errors = validateOnboardingStep(
        tableTab,
        {
          custom_key_contacts: [
            { reporting_manager_contact_number: "9876543210", email: "manager@example.com" }
          ]
        },
        {}
      );
      expect(errors.custom_key_contacts).toBeUndefined();
    });

    it("rejects invalid pattern in table row child fields", () => {
      const errors = validateOnboardingStep(
        tableTab,
        {
          custom_key_contacts: [
            { reporting_manager_contact_number: "12345", email: "invalid-email" }
          ]
        },
        {}
      );
      expect(errors.custom_key_contacts).toBeDefined();
      const rowErrors = (errors.custom_key_contacts as any)[0];
      expect(rowErrors.reporting_manager_contact_number).toBeDefined();
      expect(rowErrors.reporting_manager_contact_number.message).toContain("10-digit mobile number");
      expect(rowErrors.email).toBeDefined();
      expect(rowErrors.email.message).toContain("valid email address");
    });
  });

  describe("dob validation", () => {
    const dobTab: OnboardingTab = {
      tab: "Personal Details",
      sections: [
        {
          section: "Personal Details",
          fields: [
            {
              fieldname: "dob",
              label: "Date of Birth",
              fieldtype: "Date",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
            },
          ],
        },
      ],
    };

    it("accepts dob representing age >= 18", () => {
      const today = new Date();
      const validDob = new Date(today.getFullYear() - 19, today.getMonth(), today.getDate())
        .toISOString()
        .split("T")[0];
      const errors = validateOnboardingStep(
        dobTab,
        { dob: validDob },
        {}
      );
      expect(errors.dob).toBeUndefined();
    });

    it("rejects dob representing age < 18", () => {
      const today = new Date();
      const invalidDob = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate())
        .toISOString()
        .split("T")[0];
      const errors = validateOnboardingStep(
        dobTab,
        { dob: invalidDob },
        {}
      );
      expect(errors.dob).toBeDefined();
      expect((errors.dob as any).message).toContain("at least 18 years old");
    });
  });

  describe("numeric fields validation", () => {
    const numTab: OnboardingTab = {
      tab: "Financial Info",
      sections: [
        {
          section: "Salary Details",
          fields: [
            {
              fieldname: "expected_salary",
              label: "Expected Salary",
              fieldtype: "Currency",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
            },
            {
              fieldname: "experience_years",
              label: "Years of Experience",
              fieldtype: "Int",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
            },
          ],
        },
      ],
    };

    it("accepts zero or positive values", () => {
      const errors = validateOnboardingStep(
        numTab,
        { expected_salary: "150000", experience_years: "3" },
        {}
      );
      expect(errors.expected_salary).toBeUndefined();
      expect(errors.experience_years).toBeUndefined();
    });

    it("rejects negative values", () => {
      const errors = validateOnboardingStep(
        numTab,
        { expected_salary: "-1", experience_years: "-5" },
        {}
      );
      expect(errors.expected_salary).toBeDefined();
      expect((errors.expected_salary as any).message).toContain("cannot be negative");
      expect(errors.experience_years).toBeDefined();
      expect((errors.experience_years as any).message).toContain("cannot be negative");
    });
  });

  describe("percentage fields validation", () => {
    const pctTab: OnboardingTab = {
      tab: "Academics",
      sections: [
        {
          section: "Marks Details",
          fields: [
            {
              fieldname: "percentage",
              label: "Percentage Scored",
              fieldtype: "Float",
              is_mandatory: 0,
              read_only: 0,
              hidden: 0,
            },
          ],
        },
      ],
    };

    it("accepts values <= 100", () => {
      const errors = validateOnboardingStep(
        pctTab,
        { percentage: "95.5" },
        {}
      );
      expect(errors.percentage).toBeUndefined();
    });

    it("rejects values > 100", () => {
      const errors = validateOnboardingStep(
        pctTab,
        { percentage: "100.1" },
        {}
      );
      expect(errors.percentage).toBeDefined();
      expect((errors.percentage as any).message).toContain("cannot be greater than 100");
    });
  });
});
