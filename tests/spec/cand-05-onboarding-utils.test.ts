import { afterEach, describe, expect, it } from "vitest"
import { evaluateDependsOn, isFieldFilled } from "@/lib/onboarding-utils"
import { OnboardingField } from "@/lib/types/onboarding"

const probeKey = "__cand05DependsOnProbe"

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[probeKey]
})

describe("isFieldFilled outside the table-with-visible-children case", () => {
  // Spec: CAND-05-A5.2B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a5-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("treats a Check field as filled only when truthy, trims other values, and rejects an empty or invalid table", () => {
    const check: OnboardingField = {
      fieldname: "custom_declaration",
      label: "Declaration",
      fieldtype: "Check",
      is_mandatory: 1,
      read_only: 0,
      hidden: 0,
    }
    expect(isFieldFilled(check, { custom_declaration: 1 })).toBe(true)
    expect(isFieldFilled(check, { custom_declaration: 0 })).toBe(false)
    expect(isFieldFilled(check, {})).toBe(false)

    const data: OnboardingField = {
      fieldname: "custom_full_name",
      label: "Full Name",
      fieldtype: "Data",
      is_mandatory: 1,
      read_only: 0,
      hidden: 0,
    }
    expect(isFieldFilled(data, { custom_full_name: "   " })).toBe(false)
    expect(isFieldFilled(data, { custom_full_name: 0 })).toBe(true)
    expect(isFieldFilled(data, { custom_full_name: "CAND-TEST-0001" })).toBe(true)

    const table: OnboardingField = {
      fieldname: "custom_family_details",
      label: "Family Details",
      fieldtype: "Table",
      is_mandatory: 1,
      read_only: 0,
      hidden: 0,
      child_fields: [
        {
          fieldname: "relation",
          label: "Relation",
          fieldtype: "Select",
          is_mandatory: 1,
          read_only: 0,
          hidden: 0,
        },
        {
          fieldname: "member_name",
          label: "Name",
          fieldtype: "Data",
          is_mandatory: 1,
          read_only: 0,
          hidden: 0,
        },
      ],
    }
    expect(isFieldFilled(table, { custom_family_details: [] })).toBe(false)
    expect(isFieldFilled(table, { custom_family_details: "not-an-array" })).toBe(false)
    expect(isFieldFilled(table, { custom_family_details: [{ relation: "  ", member_name: "" }] })).toBe(false)
    expect(isFieldFilled(table, { custom_family_details: [{ relation: "Father", member_name: "" }] })).toBe(false)
    expect(isFieldFilled(table, { custom_family_details: [{ relation: "Father", member_name: "Test Parent" }] })).toBe(true)
  })
})

describe("evaluateDependsOn builds and runs a function", () => {
  // Spec: CAND-05-A5.3A (docs/spec/clauses/05-onboarding-logic.md#cand-05-a5-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("executes the depends_on text as JavaScript, so an expression with a side effect runs", () => {
    expect((globalThis as Record<string, unknown>)[probeKey]).toBeUndefined()

    const expression = `eval:(globalThis["${probeKey}"] = "CAND-TEST-0001", true)`
    expect(evaluateDependsOn(expression, {})).toBe(true)
    expect((globalThis as Record<string, unknown>)[probeKey]).toBe("CAND-TEST-0001")

    // A thrown expression is caught inside the generated function and reported as false.
    expect(evaluateDependsOn("eval:doc.missing.deep", {})).toBe(false)
    // The result is coerced with Boolean, so a non-empty string is true and 0 is false.
    expect(evaluateDependsOn("eval:'text'", {})).toBe(true)
    expect(evaluateDependsOn("eval:0", {})).toBe(false)
  })
})
