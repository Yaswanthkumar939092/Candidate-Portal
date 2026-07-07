import { describe, it, expect } from "vitest";
import { formatDateDDMMYYYY } from "@/lib/utils";

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
