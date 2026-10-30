"use client";

// Frame for the pages a candidate opens from an emailed link, without logging
// in: company logo on top, the page below. (Portal pages use the portal layout.)

import * as React from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { data: branding } = useCandidateBranding();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          {/* Logo lives on the Frappe host, which may be outside next/image remotePatterns. */}
          <BrandLockup branding={branding} unoptimized />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
