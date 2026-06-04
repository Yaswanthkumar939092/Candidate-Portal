import { describe, it, expect } from "vitest";
import { evaluateDependsOn } from "@/lib/onboarding-utils";

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

  it("should handle error cases gracefully by returning false", () => {
    const doc = {};
    // Invalid javascript syntax should fail evaluation gracefully
    expect(evaluateDependsOn("eval:doc.custom_has_passport===", doc)).toBe(false);
  });
});
