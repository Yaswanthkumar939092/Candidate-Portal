 
// lib/utils/transformJobFields.ts

export function transformFieldsToTabs(fields: any[]) {
    if (!fields || fields.length === 0) return [];
  
    const tabMap: Record<string, { tab: string; sections: Record<string, any[]> }> = {};
  
    fields.forEach((field) => {
      // ✅ FIX: empty tab_label ko "General" default do
      const tabLabel = field.tab_label?.trim() || "General";
      const sectionLabel = field.section_label?.trim() || "Details";
  
      if (!tabMap[tabLabel]) {
        tabMap[tabLabel] = { tab: tabLabel, sections: {} };
      }
  
      if (!tabMap[tabLabel].sections[sectionLabel]) {
        tabMap[tabLabel].sections[sectionLabel] = [];
      }
  
      tabMap[tabLabel].sections[sectionLabel].push(field);
    });
  
    // sections object → array mein convert karo
    return Object.values(tabMap).map((tab) => ({
      tab: tab.tab,
      sections: Object.entries(tab.sections).map(([sectionName, fields]) => ({
        section: sectionName,
        fields,
      })),
    }));
  }