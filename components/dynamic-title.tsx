"use client";

import { useEffect } from "react";
import { useWebsiteBranding } from "@/lib/hooks/useWebsiteBranding";

export function DynamicTitle() {
  const { data: branding } = useWebsiteBranding();

  useEffect(() => {
    if (branding?.title_prefix) {
      document.title = branding.title_prefix;
    }
  }, [branding?.title_prefix]);

  return null;
}
