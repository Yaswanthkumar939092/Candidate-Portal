import { describe, it, expect } from "vitest";
import { formatDateDDMMYYYY, formatIndianAmount, formatIndianAmountInWords, isMonetaryField } from "@/lib/utils";

describe("formatIndianAmount", () => {
  it("formats numbers using Indian digit grouping", () => {
    expect(formatIndianAmount(1234567)).toBe("12,34,567");
    expect(formatIndianAmount(999)).toBe("999");
  });

  it("regroups pre-formatted strings while keeping currency and decimals", () => {
    expect(formatIndianAmount("₹ 1,234,567.00")).toBe("₹ 12,34,567.00");
    expect(formatIndianAmount("₹1000000")).toBe("₹10,00,000");
    expect(formatIndianAmount("$10000")).toBe("$10,000");
    expect(formatIndianAmount("INR 250000.5 per annum")).toBe("INR 2,50,000.5 per annum");
  });

  it("handles empty and non-numeric values gracefully", () => {
    expect(formatIndianAmount(null)).toBe("");
    expect(formatIndianAmount(undefined)).toBe("");
    expect(formatIndianAmount("")).toBe("");
    expect(formatIndianAmount("Not disclosed")).toBe("Not disclosed");
  });
});

describe("formatIndianAmountInWords", () => {
  it("spells rupees and paise with Indian denominations", () => {
    expect(formatIndianAmountInWords("1234567.89")).toBe(
      "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven Rupees and Eighty Nine Paise",
    );
    expect(formatIndianAmountInWords(-10000000)).toBe("Minus One Crore Rupees");
  });

  it("does not fabricate words for non-monetary text", () => {
    expect(formatIndianAmountInWords("Not disclosed")).toBe("");
  });
});

describe("isMonetaryField", () => {
  it("recognizes currency and monetary labels without matching percentages", () => {
    expect(isMonetaryField({ fieldtype: "Currency" })).toBe(true);
    expect(isMonetaryField({ fieldname: "custom_expected_ctc", fieldtype: "Float" })).toBe(true);
    expect(isMonetaryField({ label: "Salary percentage", fieldtype: "Float" })).toBe(false);
  });
});

describe("formatDateDDMMYYYY", () => {
  it("formats standard date inputs with default separator", () => {
    expect(formatDateDDMMYYYY("2026-07-07")).toBe("07-07-2026");
    expect(formatDateDDMMYYYY("2026/07/08")).toBe("08-07-2026");
    const dateObj = new Date("2026-07-09");
    expect(formatDateDDMMYYYY(dateObj)).toBe("09-07-2026");
  });

  it("supports customizable separator", () => {
    expect(formatDateDDMMYYYY("2026-07-07", " ")).toBe("07 07 2026");
    expect(formatDateDDMMYYYY("2026-07-07", "/")).toBe("07/07/2026");
  });

  it("handles empty and invalid values gracefully", () => {
    expect(formatDateDDMMYYYY("")).toBe("");
    expect(formatDateDDMMYYYY(null as any)).toBe("");
    expect(formatDateDDMMYYYY("invalid-date-string")).toBe("invalid-date-string");
  });
});
