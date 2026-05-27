"use client";

import { useEffect } from "react";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";

export function DynamicTitle() {
  const { data: branding } = useCandidateBranding();

  useEffect(() => {
    if (branding?.title_prefix) {
      document.title = branding.title_prefix;
    }
  }, [branding?.title_prefix]);

  return null;
}
