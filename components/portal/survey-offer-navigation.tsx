"use client";

import Image from "next/image";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";
import { useCompanyLogo } from "@/lib/hooks/useCompanyLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SurveyOfferNavigation() {
  const { user, profile } = useAuth();
  const { data: branding } = useCandidateBranding();
  const { data: logoData } = useCompanyLogo();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || undefined;

  const logoSrc = branding?.app_logo
    ? branding.app_logo.startsWith("http")
      ? branding.app_logo
      : `${(process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "")}${branding.app_logo.startsWith("/") ? branding.app_logo : `/${branding.app_logo}`}`
    : logoData?.logo_url
    ? `${(process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "")}${logoData.logo_url}`
    : "/Logo.jpg";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card shadow-sm transition-all duration-300">
      <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side: Logo */}
        <div className="flex items-center gap-2">
          <div className="relative h-[50px] w-[200px] sm:w-[240px] flex items-center">
            <Image
              src={logoSrc}
              alt={branding?.title_prefix || "Company Logo"}
              fill
              className="object-contain object-left shrink-0"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Right side: User Name -> Circle Initial / Avatar (Direct Display, No Dropdown) */}
        <div className="flex items-center gap-2.5">
          {/* User Name */}
          <span className="text-[0.95rem] font-semibold text-[#1a2332] dark:text-slate-200 max-w-[180px] truncate">
            {displayName}
          </span>

          {/* Avatar / Circle Initial */}
          <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-[#1a2332] text-white font-bold text-sm flex items-center justify-center">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
