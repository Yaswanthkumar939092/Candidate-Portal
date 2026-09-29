"use client";

// Frame for the pages a candidate opens from an emailed link, without logging
// in: company logo on top, the page below. (Portal pages use the portal layout.)

import * as React from "react";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";

function logoUrl(logo?: string | null) {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  const base = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  return `${base}${logo.startsWith("/") ? logo : `/${logo}`}`;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { data: branding } = useCandidateBranding();
  const logo = logoUrl(branding?.app_logo);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          {logo ? (
            // Plain <img>: the logo is on the Frappe host, outside next/image's config.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Logo" className="h-10 w-auto max-w-[200px] object-contain" />
          ) : (
            <span className="text-lg font-bold text-foreground">{branding?.title_prefix || "Candidate Portal"}</span>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
