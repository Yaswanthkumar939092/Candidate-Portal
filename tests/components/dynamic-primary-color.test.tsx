import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DynamicPrimaryColor, isValidPrimaryColor } from "@/components/dynamic-primary-color";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";

vi.mock("@/lib/hooks/useAuthSettings", () => ({
  useAuthSettings: vi.fn(),
}));

const managedVariables = [
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
  "--accent-foreground",
  "--info",
  "--nav-active-bg",
];

describe("DynamicPrimaryColor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    managedVariables.forEach((variable) => document.documentElement.style.removeProperty(variable));
  });

  it("uses the primary color returned by auth settings", async () => {
    vi.mocked(useAuthSettings).mockReturnValue({
      data: { primary_color: "#761ACB" },
    } as ReturnType<typeof useAuthSettings>);

    render(<DynamicPrimaryColor />);

    await waitFor(() => {
      managedVariables.forEach((variable) => {
        expect(document.documentElement.style.getPropertyValue(variable)).toBe("#761ACB");
      });
    });
  });

  it("leaves CSS fallback colors in place when no valid API color is supplied", () => {
    document.documentElement.style.setProperty("--primary", "#7B2CF1");
    vi.mocked(useAuthSettings).mockReturnValue({
      data: { primary_color: "not-a-color" },
    } as ReturnType<typeof useAuthSettings>);

    render(<DynamicPrimaryColor />);

    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
  });

  it("validates hex colors only", () => {
    expect(isValidPrimaryColor("#761ACB")).toBe(true);
    expect(isValidPrimaryColor("rgb(118, 26, 203)")).toBe(false);
    expect(isValidPrimaryColor(undefined)).toBe(false);
  });
});
