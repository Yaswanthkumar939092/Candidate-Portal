import { describe, expect, it } from "vitest"
import { OnboardingTab } from "@/lib/types/onboarding"
import { validateOnboardingStep } from "@/lib/validation/onboarding-validation"

type Row = Record<string, unknown>
type RootError = { message?: string; type?: string }

function dataTab(fields: Array<Record<string, unknown>>): OnboardingTab {
  return {
    tab: "Identity",
    sections: [{ section: "Identity", fields: fields as never }],
  } as OnboardingTab
}

function field(fieldname: string, label: string, extra: Record<string, unknown> = {}) {
  return {
    fieldname,
    label,
    fieldtype: "Data",
    is_mandatory: 0,
    read_only: 0,
    hidden: 0,
    ...extra,
  }
}

describe("validateOnboardingStep identity and bank patterns", () => {
  // Spec: CAND-05-A6.9A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-9a)
  // Characterization: pins current behaviour, not endorsed.
  it("rejects a bad Aadhaar number, PAN, permanent postal code and account holder name by fieldname alone", () => {
    const tab = dataTab([
      field("custom_aadhaar_number", "Aadhaar Number"),
      field("custom_pan_number", "PAN Number"),
      field("custom_permanent_postal_code", "Permanent Postal Code"),
      field("custom_account_holder_name", "Account Holder Name"),
    ])

    const bad = validateOnboardingStep(
      tab,
      {
        custom_aadhaar_number: "12345",
        custom_pan_number: "AAAAA1111",
        custom_permanent_postal_code: "012345",
        custom_account_holder_name: "Test Candidate 1",
      },
      {},
    )
    expect((bad.custom_aadhaar_number as RootError).message).toBe("Please enter a valid 12-digit Aadhaar number")
    expect((bad.custom_pan_number as RootError).message).toBe(
      "Please enter a valid 10-character PAN number (e.g. AAAAA1111A)",
    )
    expect((bad.custom_permanent_postal_code as RootError).message).toBe(
      "Please enter a valid 6-digit postal code (cannot start with 0)",
    )
    expect((bad.custom_account_holder_name as RootError).message).toBe(
      "Account holder name can only contain alphabets and spaces",
    )

    const good = validateOnboardingStep(
      tab,
      {
        custom_aadhaar_number: "123456789012",
        custom_pan_number: "aaaaa1111a",
        custom_permanent_postal_code: "560001",
        custom_account_holder_name: "Test Candidate",
      },
      {},
    )
    expect(good.custom_aadhaar_number).toBeUndefined()
    // The PAN regex accepts lower case letters.
    expect(good.custom_pan_number).toBeUndefined()
    expect(good.custom_permanent_postal_code).toBeUndefined()
    expect(good.custom_account_holder_name).toBeUndefined()
  })

  // Spec: CAND-05-A6.9B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-9b)
  // Characterization: pins current behaviour, not endorsed.
  it("refuses an emergency contact number equal to the mobile number, on both fields", () => {
    const tab = dataTab([
      field("custom_mobile_number", "Mobile Number"),
      field("custom_emergency_contact_number", "Emergency Contact Number"),
    ])

    const same = validateOnboardingStep(
      tab,
      { custom_mobile_number: "9000000001", custom_emergency_contact_number: "9000000001" },
      {},
    )
    expect((same.custom_emergency_contact_number as RootError).message).toBe(
      "Emergency contact number cannot be the same as mobile number",
    )
    expect((same.custom_mobile_number as RootError).message).toBe(
      "Mobile number cannot be the same as emergency contact number",
    )

    const different = validateOnboardingStep(
      tab,
      { custom_mobile_number: "9000000001", custom_emergency_contact_number: "9000000002" },
      {},
    )
    expect(different.custom_emergency_contact_number).toBeUndefined()
    expect(different.custom_mobile_number).toBeUndefined()
  })
})

describe("validateOnboardingStep fields the step makes mandatory by itself", () => {
  const employmentTab: OnboardingTab = {
    tab: "Employment",
    sections: [
      {
        section: "Employment",
        fields: [
          {
            fieldname: "custom_jf_employment",
            label: "Employment History",
            fieldtype: "Table",
            is_mandatory: 0,
            read_only: 0,
            hidden: 0,
            child_fields: [
              {
                fieldname: "company_name",
                label: "Company",
                fieldtype: "Data",
                is_mandatory: 0,
                read_only: 0,
                hidden: 0,
              },
            ],
          },
        ],
      },
    ],
  } as OnboardingTab

  // Spec: CAND-05-A6.9C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-9c)
  // Characterization: pins current behaviour, not endorsed.
  it("skips the employment table when is_fresher is set and otherwise forces it and its children to be mandatory", () => {
    const fresher = validateOnboardingStep(employmentTab, { custom_jf_employment: [] }, { personal: { is_fresher: 1 } })
    expect(fresher.custom_jf_employment).toBeUndefined()

    const empty = validateOnboardingStep(employmentTab, { custom_jf_employment: [] }, { personal: { is_fresher: 0 } })
    expect((empty.custom_jf_employment as RootError).message).toBe("Employment History is required")

    const blankRow = validateOnboardingStep(
      employmentTab,
      { custom_jf_employment: [{ company_name: "" }] },
      {},
    )
    const rows = blankRow.custom_jf_employment as Array<Record<string, RootError>>
    expect(rows[0].company_name.message).toBe("Company is required")
  })

  // Spec: CAND-05-A6.9D (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-9d)
  // Characterization: pins current behaviour, not endorsed.
  it("requires the communication address proof unless custom_same_as_permanent is set", () => {
    const tab = dataTab([
      field("custom_communication_address_proof", "Communication Address Proof", { fieldtype: "Attach" }),
    ])

    const missing = validateOnboardingStep(tab, { custom_communication_address_proof: "" }, {})
    expect((missing.custom_communication_address_proof as RootError).message).toBe(
      "Communication Address Proof is required",
    )

    const sameAddress = validateOnboardingStep(
      tab,
      { custom_communication_address_proof: "" },
      { address: { custom_same_as_permanent: 1 } },
    )
    expect(sameAddress.custom_communication_address_proof).toBeUndefined()
  })
})

describe("validateOnboardingStep education ordering and nomination totals", () => {
  const educationTab: OnboardingTab = {
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
                options: "10th\n12th\nGraduation\nPost Graduation",
                is_mandatory: 0,
                read_only: 0,
                hidden: 0,
              },
              {
                fieldname: "year_of_passing",
                label: "Year of Passing",
                fieldtype: "Data",
                is_mandatory: 0,
                read_only: 0,
                hidden: 0,
              },
            ],
          },
        ],
      },
    ],
  } as OnboardingTab

  const nominationTab: OnboardingTab = {
    tab: "Nomination",
    sections: [
      {
        section: "Nomination",
        fields: [
          {
            fieldname: "custom_nomination_details",
            label: "Nomination Details",
            fieldtype: "Table",
            is_mandatory: 0,
            read_only: 0,
            hidden: 0,
            child_fields: [
              {
                fieldname: "nomination_type",
                label: "Nomination Type",
                fieldtype: "Select",
                options: "Gratuity\nProvident Fund",
                is_mandatory: 0,
                read_only: 0,
                hidden: 0,
              },
              {
                fieldname: "percentage",
                label: "Percentage",
                fieldtype: "Float",
                is_mandatory: 0,
                read_only: 0,
                hidden: 0,
              },
            ],
          },
        ],
      },
    ],
  } as OnboardingTab

  // Spec: CAND-05-A6.3E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-3e)
  // Characterization: pins current behaviour, not endorsed.
  it("reports the first education level whose year of passing is not later than the level below it", () => {
    const rows: Row[] = [
      { education_level: "10th", year_of_passing: "2020" },
      { education_level: "12th", year_of_passing: "2019" },
      { education_level: "Graduation", year_of_passing: "2024" },
    ]
    const errors = validateOnboardingStep(educationTab, { custom_education_details: rows }, {})
    expect((errors.custom_education_details as RootError).message).toBe(
      "Year of passing for 12th must be after 10th (2020)",
    )

    const equalYears: Row[] = [
      { education_level: "10th", year_of_passing: "2020" },
      { education_level: "12th", year_of_passing: "2020" },
      { education_level: "Graduation", year_of_passing: "2024" },
    ]
    expect(
      (validateOnboardingStep(educationTab, { custom_education_details: equalYears }, {})
        .custom_education_details as RootError).message,
    ).toBe("Year of passing for 12th must be after 10th (2020)")

    const increasing: Row[] = [
      { education_level: "10th", year_of_passing: "2018" },
      { education_level: "12th", year_of_passing: "2020" },
      { education_level: "Graduation", year_of_passing: "2023" },
    ]
    expect(validateOnboardingStep(educationTab, { custom_education_details: increasing }, {}).custom_education_details)
      .toBeUndefined()
  })

  // Spec: CAND-05-A6.9E (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-9e)
  // Characterization: pins current behaviour, not endorsed.
  it("asks for every nomination type in the options list and for a per-type total of exactly 100 percent", () => {
    const missing = validateOnboardingStep(
      nominationTab,
      { custom_nomination_details: [{ nomination_type: "Gratuity", percentage: "100" }] },
      {},
    )
    expect((missing.custom_nomination_details as RootError).message).toBe(
      "Please add nomination details for: Provident Fund",
    )

    const short = validateOnboardingStep(
      nominationTab,
      {
        custom_nomination_details: [
          { nomination_type: "Gratuity", percentage: "60" },
          { nomination_type: "Provident Fund", percentage: "100" },
        ],
      },
      {},
    )
    expect((short.custom_nomination_details as RootError).message).toBe(
      "Total percentage for Gratuity nomination must be exactly 100% (currently 60%)",
    )

    const split = validateOnboardingStep(
      nominationTab,
      {
        custom_nomination_details: [
          { nomination_type: "Gratuity", percentage: "40" },
          { nomination_type: "Gratuity", percentage: "60" },
          { nomination_type: "Provident Fund", percentage: "100" },
        ],
      },
      {},
    )
    expect(split.custom_nomination_details).toBeUndefined()
  })
})

describe("validateOnboardingStep visibility and required handling", () => {
  // Spec: CAND-05-A6.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a6-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("skips hidden fields and fields whose depends_on is false, and treats an unticked mandatory Check as missing", () => {
    const tab = dataTab([
      field("custom_hidden_field", "Hidden Field", { is_mandatory: 1, hidden: 1 }),
      field("custom_dependent_field", "Dependent Field", {
        is_mandatory: 1,
        depends_on: "eval:doc.custom_has_passport=='Yes'",
      }),
      field("custom_declaration", "Declaration", { is_mandatory: 1, fieldtype: "Check" }),
      field("custom_conditional_field", "Conditional Field", {
        mandatory_depends_on: "eval:doc.custom_has_passport=='No'",
      }),
    ])

    const errors = validateOnboardingStep(
      tab,
      {
        custom_hidden_field: "",
        custom_dependent_field: "",
        custom_declaration: 0,
        custom_conditional_field: "",
      },
      { personal: { custom_has_passport: "No" } },
    )

    expect(errors.custom_hidden_field).toBeUndefined()
    expect(errors.custom_dependent_field).toBeUndefined()
    expect((errors.custom_declaration as RootError).message).toBe("Declaration is required")
    expect((errors.custom_conditional_field as RootError).message).toBe("Conditional Field is required")

    const ticked = validateOnboardingStep(
      tab,
      {
        custom_hidden_field: "",
        custom_dependent_field: "",
        custom_declaration: 1,
        custom_conditional_field: "value",
      },
      { personal: { custom_has_passport: "No" } },
    )
    expect(ticked.custom_declaration).toBeUndefined()
    expect(ticked.custom_conditional_field).toBeUndefined()
  })
})
