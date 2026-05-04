import { describe, it, expect } from "vitest";
import { transformFieldsToTabs } from "@/lib/utils/transformJobFields";

describe("transformJobFields", () => {
  it("returns empty array for empty input", () => {
    expect(transformFieldsToTabs([])).toEqual([]);
    expect(transformFieldsToTabs(null as any)).toEqual([]);
  });

  it("groups fields by tab and section", () => {
    const fields = [
      { fieldname: "f1", tab_label: "Tab 1", section_label: "Sec 1" },
      { fieldname: "f2", tab_label: "Tab 1", section_label: "Sec 1" },
      { fieldname: "f3", tab_label: "Tab 1", section_label: "Sec 2" },
      { fieldname: "f4", tab_label: "Tab 2", section_label: "Sec 1" },
    ];

    const result = transformFieldsToTabs(fields);

    expect(result).toHaveLength(2);
    expect(result[0].tab).toBe("Tab 1");
    expect(result[0].sections).toHaveLength(2);
    expect(result[0].sections[0].section).toBe("Sec 1");
    expect(result[0].sections[0].fields).toHaveLength(2);
  });

  it("uses 'General' and 'Details' as defaults", () => {
    const fields = [{ fieldname: "f1" }];
    const result = transformFieldsToTabs(fields);
    expect(result[0].tab).toBe("General");
    expect(result[0].sections[0].section).toBe("Details");
  });
});
