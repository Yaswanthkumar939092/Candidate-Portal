"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";

/**
 * The variables the configured brand color paints. Deliberately limited to the
 * primary accent — backgrounds, surfaces, borders and muted tints stay on the
 * palette values in globals.css.
 */
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

/** Marks the document so the NOVA palette in globals.css takes effect. */
export const BRAND_ATTRIBUTE = "data-brand";
export const NOVA_BRAND = "nova";
/** Mirrors the flag so the pre-paint script in layout.tsx can avoid a flash. */
export const BRAND_STORAGE_KEY = "candidate-portal-brand";

/** Set on <html> by ThemeProvider (and the pre-paint script) in dark mode. */
export const THEME_ATTRIBUTE = "data-theme";
export const NOVA_DARK_THEME = "nova-dark";

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [THEME_ATTRIBUTE],
  });
  return () => observer.disconnect();
}

const isNovaDarkActive = () =>
  document.documentElement.getAttribute(THEME_ATTRIBUTE) === NOVA_DARK_THEME;

/** Tracks the dark-mode attribute on <html>; the server always renders light. */
function useIsNovaDark() {
  return useSyncExternalStore(subscribeToTheme, isNovaDarkActive, () => false);
}

/**
 * Applies the candidate portal theming from auth settings.
 *
 * - `enable_theme_mode: 1` mounts the NOVA palette (`data-brand="nova"`).
 * - Otherwise the default palette in globals.css is used unchanged, with
 *   `primary_color` recoloring only the primary accent variables.
 * - In dark mode (`data-theme="nova-dark"`) the override is skipped: a light
 *   theme brand color on the dark surfaces fails WCAG AA, so the nova-dark
 *   tokens in globals.css apply instead.
 *
 * CSS supplies the fallback whenever no valid color is configured.
 */
export function DynamicPrimaryColor() {
  const { data: settings } = useAuthSettings();
  const primaryColor = settings?.primary_color;
  const themeModeEnabled = settings?.enable_theme_mode === 1;
  const isNovaDark = useIsNovaDark();

  // 1. Choose the palette.
  useEffect(() => {
    if (settings === undefined) return; // not loaded yet — leave the markup as-is

    const root = document.documentElement;
    if (themeModeEnabled) {
      root.setAttribute(BRAND_ATTRIBUTE, NOVA_BRAND);
    } else {
      root.removeAttribute(BRAND_ATTRIBUTE);
    }

    try {
      localStorage.setItem(BRAND_STORAGE_KEY, themeModeEnabled ? NOVA_BRAND : "");
    } catch {
      // Storage unavailable (private mode / blocked cookies) — the attribute is
      // still correct for this page view, we just lose the no-flash hint.
    }
  }, [settings, themeModeEnabled]);

  // 2. Recolor the primary accent. NOVA ships its own designed palette, so the
  //    picker only applies when it is not active. Inline styles beat the
  //    nova-dark block, so the picker also steps aside in dark mode.
  useEffect(() => {
    const rootStyle = document.documentElement.style;

    if (!themeModeEnabled && !isNovaDark && isValidPrimaryColor(primaryColor)) {
      PRIMARY_COLOR_VARIABLES.forEach((variable) => rootStyle.setProperty(variable, primaryColor));
      return;
    }

    PRIMARY_COLOR_VARIABLES.forEach((variable) => rootStyle.removeProperty(variable));
  }, [primaryColor, themeModeEnabled, isNovaDark]);

  return null;
}
