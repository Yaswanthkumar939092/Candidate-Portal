"use client";

import { useEffect } from "react";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";

const PRIMARY_COLOR_VARIABLES = [
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
  "--accent-foreground",
  "--info",
  "--nav-active-bg",
] as const;

/** Accept only CSS hex colors received from the candidate-auth settings endpoint. */
export function isValidPrimaryColor(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value);
}

/**
 * Applies the configured candidate portal color after auth settings load.
 * CSS supplies the fallback values whenever no valid color is configured.
 */
export function DynamicPrimaryColor() {
  const { data: settings } = useAuthSettings();
  const primaryColor = settings?.primary_color;

  useEffect(() => {
    const rootStyle = document.documentElement.style;

    if (isValidPrimaryColor(primaryColor)) {
      PRIMARY_COLOR_VARIABLES.forEach((variable) => rootStyle.setProperty(variable, primaryColor));
      return;
    }

    PRIMARY_COLOR_VARIABLES.forEach((variable) => rootStyle.removeProperty(variable));
  }, [primaryColor]);

  return null;
}
