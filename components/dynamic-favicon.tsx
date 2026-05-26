"use client";

import { useEffect } from "react";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";

/**
 * Component that dynamically updates the browser tab's favicon (logo)
 * using the company logo URL fetched from the website branding API.
 */
export function DynamicFavicon() {
  const { data: branding } = useCandidateBranding();

  useEffect(() => {
    // Resolve the logo URL
    let logoUrl = "/favicon.svg";

    if (branding?.app_logo) {
      logoUrl = branding.app_logo.startsWith("http")
        ? branding.app_logo
        : `${(process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "")}${branding.app_logo.startsWith("/") ? branding.app_logo : `/${branding.app_logo}`}`;
    }

    // Find all favicon link tags and update their href
    const linkElements = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    if (linkElements.length > 0) {
      linkElements.forEach((link) => {
        link.href = logoUrl;
        // If updating to a SVG/PNG icon, update type appropriately
        if (logoUrl.endsWith(".svg")) {
          link.type = "image/svg+xml";
        } else if (logoUrl.endsWith(".png")) {
          link.type = "image/png";
        } else if (logoUrl.endsWith(".ico")) {
          link.type = "image/x-icon";
        }
      });
    } else {
      // Fallback: Create dynamic favicon link tag if not present
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = logoUrl;
      if (logoUrl.endsWith(".svg")) {
        link.type = "image/svg+xml";
      }
      document.head.appendChild(link);
    }
  }, [branding?.app_logo]);

  return null;
}
