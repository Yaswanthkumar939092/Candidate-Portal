"use client";

import { useState } from "react";

/**
 * Returns the configured logo, switching to `fallback` once it fails to load.
 * Operate stores the site logo as a relative /files path, which the /backend
 * proxy does not serve, so without this the header would show a broken image.
 */
export function useLogoWithFallback(src: string | null | undefined, fallback: string) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const current = src && src !== failedSrc ? src : fallback;
  return {
    src: current,
    onError: () => {
      if (current !== fallback) setFailedSrc(current);
    },
  };
}
