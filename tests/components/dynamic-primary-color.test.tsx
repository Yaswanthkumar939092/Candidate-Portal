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

/** Surfaces the picker must never touch — they stay on the CSS palette. */
const untouchedVariables = [
  "--background",
  "--foreground",
  "--card",
  "--muted",
  "--border",
  "--secondary",
  "--accent",
  "--primary-foreground",
];

const mockSettings = (data: Record<string, unknown> | undefined) =>
  vi.mocked(useAuthSettings).mockReturnValue({ data } as unknown as ReturnType<
    typeof useAuthSettings
  >);

const readVar = (name: string) => document.documentElement.style.getPropertyValue(name);

describe("DynamicPrimaryColor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    [...managedVariables, ...untouchedVariables].forEach((v) =>
      document.documentElement.style.removeProperty(v),
    );
    document.documentElement.removeAttribute("data-brand");
  });

  describe("default palette (enable_theme_mode off)", () => {
    it("recolors the primary accent from primary_color", async () => {
      mockSettings({ primary_color: "#29CD42", enable_theme_mode: 0 });

      render(<DynamicPrimaryColor />);

      await waitFor(() => {
        managedVariables.forEach((v) => expect(readVar(v)).toBe("#29CD42"));
      });
      expect(document.documentElement.getAttribute("data-brand")).toBeNull();
    });

    it("leaves backgrounds, surfaces and borders on the CSS palette", async () => {
      mockSettings({ primary_color: "#29CD42", enable_theme_mode: 0 });

      render(<DynamicPrimaryColor />);

      await waitFor(() => expect(readVar("--primary")).toBe("#29CD42"));
      untouchedVariables.forEach((v) => expect(readVar(v)).toBe(""));
    });

    it("applies the picker when the flag is absent entirely", async () => {
      mockSettings({ primary_color: "#29CD42" });

      render(<DynamicPrimaryColor />);

      await waitFor(() => expect(readVar("--primary")).toBe("#29CD42"));
    });

    it("falls back to the CSS palette when the color is invalid", () => {
      mockSettings({ primary_color: "not-a-color", enable_theme_mode: 0 });

      render(<DynamicPrimaryColor />);

      expect(readVar("--primary")).toBe("");
    });

    it("clears overrides when the color is removed from settings", async () => {
      managedVariables.forEach((v) => document.documentElement.style.setProperty(v, "#761ACB"));
      mockSettings({ primary_color: null, enable_theme_mode: 0 });

      render(<DynamicPrimaryColor />);

      await waitFor(() => {
        managedVariables.forEach((v) => expect(readVar(v)).toBe(""));
      });
    });
  });

  describe("NOVA palette (enable_theme_mode on)", () => {
    it("mounts the nova palette", async () => {
      mockSettings({ primary_color: "#29CD42", enable_theme_mode: 1 });

      render(<DynamicPrimaryColor />);

      await waitFor(() =>
        expect(document.documentElement.getAttribute("data-brand")).toBe("nova"),
      );
    });

    it("does not let the picker recolor the designed nova palette", async () => {
      mockSettings({ primary_color: "#29CD42", enable_theme_mode: 1 });

      render(<DynamicPrimaryColor />);

      await waitFor(() =>
        expect(document.documentElement.getAttribute("data-brand")).toBe("nova"),
      );
      managedVariables.forEach((v) => expect(readVar(v)).toBe(""));
    });

    it("removes the nova palette when the flag goes off", async () => {
      document.documentElement.setAttribute("data-brand", "nova");
      mockSettings({ primary_color: "#29CD42", enable_theme_mode: 0 });

      render(<DynamicPrimaryColor />);

      await waitFor(() =>
        expect(document.documentElement.getAttribute("data-brand")).toBeNull(),
      );
    });

    it("leaves the palette untouched while settings are still loading", () => {
      document.documentElement.setAttribute("data-brand", "nova");
      mockSettings(undefined);

      render(<DynamicPrimaryColor />);

      expect(document.documentElement.getAttribute("data-brand")).toBe("nova");
    });
  });

  it("validates hex colors only", () => {
    expect(isValidPrimaryColor("#761ACB")).toBe(true);
    expect(isValidPrimaryColor("#29CD42")).toBe(true);
    expect(isValidPrimaryColor("rgb(118, 26, 203)")).toBe(false);
    expect(isValidPrimaryColor(undefined)).toBe(false);
    expect(isValidPrimaryColor(null)).toBe(false);
  });
});
