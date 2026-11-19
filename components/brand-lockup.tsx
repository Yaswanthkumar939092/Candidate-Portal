"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_LOGO, BRAND_LOGO_ON_DARK, BRAND_NAME } from "@/lib/branding";
import { useLogoWithFallback } from "@/lib/hooks/useLogoWithFallback";
import type { CandidateBranding } from "@/lib/services/candidate-branding";

/** Absolute URL for the configured logo, or null when Operate has none (the bundled wordmark is used). */
export function resolveBrandLogoUrl(logo?: string | null): string | null {
  const value = logo?.trim();
  if (!value) return null;
  if (value.startsWith("http")) return value;
  const base = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

/**
 * Whether the company name is printed next to the logo. The name follows the
 * logo everywhere in the portal (Oxygen Live style) unless the backend says the
 * logo artwork already spells the name out (`logo_includes_company_name`, see
 * `candidate_portal._logo_includes_company_name`).
 */
export function shouldShowBrandName(branding?: CandidateBranding | null): boolean {
  return Boolean(branding?.title_prefix?.trim()) && !branding?.logo_includes_company_name;
}

interface BrandLockupProps {
  branding?: CandidateBranding | null;
  /** Override the resolved logo URL (e.g. an auth-page specific logo). */
  logoSrc?: string | null;
  /** `light` for dark backgrounds (auth left pane). */
  tone?: "default" | "light";
  size?: "md" | "lg";
  /** Skip next/image optimisation (logo host may be outside `images.remotePatterns`). */
  unoptimized?: boolean;
  className?: string;
}

/**
 * Logo first, company name second, vertically centred — one layout for every portal surface.
 * Without a configured logo, or when it fails to load (Operate's relative /files URLs are not
 * served by the /backend proxy), the bundled Hybrowlabs wordmark is shown instead.
 */
export function BrandLockup({
  branding,
  logoSrc,
  tone = "default",
  size = "md",
  unoptimized,
  className,
}: BrandLockupProps) {
  const fallback = tone === "light" ? BRAND_LOGO_ON_DARK : BRAND_LOGO;
  const logo = useLogoWithFallback(logoSrc || resolveBrandLogoUrl(branding?.app_logo), fallback);
  // The bundled wordmark already spells out the name, so it never gets a text label.
  const usingFallback = logo.src === fallback;
  const showName = shouldShowBrandName(branding) && !usingFallback;
  const name = branding?.title_prefix?.trim() || BRAND_NAME;
  const px = size === "lg" ? 48 : 32;

  return (
    <span
      data-testid="brand-lockup"
      className={cn("flex min-w-0 items-center", size === "lg" ? "gap-3" : "gap-2", className)}
    >
      <Image
        src={logo.src}
        onError={logo.onError}
        // The alt names what the picture shows: the bundled wordmark is always Hybrowlabs.
        alt={showName ? "" : usingFallback ? BRAND_NAME : name}
        aria-hidden={showName ? true : undefined}
        width={px}
        height={px}
        priority
        unoptimized={unoptimized}
        className={cn(
          "shrink-0 object-contain",
          // Name beside the logo: square mark. Wordmark logo alone: height-bound, width follows
          // the artwork (h-* + w-auto, never size-*, so a wide logo is not squeezed).
          showName
            ? size === "lg" ? "size-12" : "size-8"
            : size === "lg" ? "h-12 w-auto max-w-[220px]" : "h-8 w-auto max-w-[160px]",
        )}
      />
      {showName && (
        <span
          className={cn(
            "truncate font-bold leading-none tracking-tight",
            size === "lg" ? "text-xl" : "text-base",
            tone === "light" ? "text-white" : "text-foreground",
          )}
        >
          {name}
        </span>
      )}
    </span>
  );
}
