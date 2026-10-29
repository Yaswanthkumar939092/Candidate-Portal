import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CandidateBranding } from "@/lib/services/candidate-branding";

export function resolveBrandLogoUrl(logo?: string | null): string {
  const value = logo?.trim();
  if (!value) return "/fallback.png";
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
  logoSrc?: string;
  /** `light` for dark backgrounds (auth left pane). */
  tone?: "default" | "light";
  size?: "md" | "lg";
  className?: string;
}

/** Logo first, company name second, vertically centred — one layout for every portal surface. */
export function BrandLockup({
  branding,
  logoSrc,
  tone = "default",
  size = "md",
  className,
}: BrandLockupProps) {
  const showName = shouldShowBrandName(branding);
  const name = branding?.title_prefix?.trim() ?? "";
  const px = size === "lg" ? 48 : 32;

  return (
    <span
      data-testid="brand-lockup"
      className={cn("flex min-w-0 items-center", size === "lg" ? "gap-3" : "gap-2", className)}
    >
      <Image
        src={logoSrc || resolveBrandLogoUrl(branding?.app_logo)}
        alt={showName ? "" : name || "Logo"}
        aria-hidden={showName ? true : undefined}
        width={px}
        height={px}
        priority
        className={cn(
          "shrink-0 object-contain",
          size === "lg" ? "size-12" : "size-8",
          // Logos that carry their own wordmark are wide, not square.
          !showName && "w-auto max-w-[160px]",
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
