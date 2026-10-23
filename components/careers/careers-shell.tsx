"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";
import { loginHref, PORTAL_EQUIVALENT } from "@/lib/careers/login-redirect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/ai-match", label: "AI Resume / Job Match" },
  { href: "/jobs", label: "All Open Jobs" },
] as const;

/**
 * Chrome for the public Careers Page, styled like the Candidate Portal navbar
 * (`PortalNavigation`). Logged-in visitors are moved to the matching portal page,
 * so one URL set serves both modes.
 */
export function CareersShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { data: branding } = useCandidateBranding();

  useEffect(() => {
    if (user) router.replace(PORTAL_EQUIVALENT[pathname] ?? "/dashboard");
  }, [pathname, router, user]);

  if (user) return null;

  const showCompanyName = Boolean(branding?.logo_includes_company_name);
  const logo = branding?.app_logo
    ? branding.app_logo.startsWith("http")
      ? branding.app_logo
      : `${(process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "")}${branding.app_logo.startsWith("/") ? branding.app_logo : `/${branding.app_logo}`}`
    : "/fallback.png";

  return (
    <div data-careers-shell className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Careers home">
            <Image
              src={logo}
              alt={branding?.title_prefix || "Logo"}
              width={showCompanyName ? 32 : 120}
              height={32}
              priority
              className={cn(
                "shrink-0",
                showCompanyName ? "size-8 rounded-full object-cover" : "h-8 w-auto max-w-[140px] object-contain",
              )}
            />
            {showCompanyName && (
              <span className="hidden text-[14px] font-extrabold uppercase text-black sm:block sm:text-base">
                {branding?.title_prefix || ""}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Careers">
            {TABS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out",
                  pathname === href
                    ? "bg-nav-active-bg text-nav-active-text"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Button asChild>
            <Link href={loginHref("/dashboard")}>Login</Link>
          </Button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden" aria-label="Careers">
          {TABS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out",
                pathname === href
                  ? "bg-nav-active-bg text-nav-active-text"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
