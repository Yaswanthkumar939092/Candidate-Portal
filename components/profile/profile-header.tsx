"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin } from "lucide-react";
import type { Profile } from "@/types/database";

interface ProfileHeaderProps {
  profile: Profile;
  className?: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const LIFECYCLE_CONFIG: Record<
  Profile["lifecycle_stage"],
  {
    label: string;
    banner: string;
    avatarBg: string;
    dot: string;
    badge: string;
  }
> = {
  candidate: {
    label: "Candidate",
    banner: "from-blue-500 via-blue-400 to-cyan-400",
    avatarBg: "bg-blue-500",
    dot: "bg-blue-500",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  },
  applicant: {
    label: "Applicant",
    banner: "from-amber-500 via-amber-400 to-yellow-400",
    avatarBg: "bg-amber-500",
    dot: "bg-amber-500",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  offered: {
    label: "Offered",
    banner: "from-purple-500 via-purple-400 to-pink-400",
    avatarBg: "bg-purple-500",
    dot: "bg-purple-500",
    badge:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  },
  onboarding: {
    label: "Onboarding",
    banner: "from-orange-500 via-orange-400 to-amber-400",
    avatarBg: "bg-orange-500",
    dot: "bg-orange-500",
    badge:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  },
  employee: {
    label: "Employee",
    banner: "from-emerald-500 via-emerald-400 to-teal-400",
    avatarBg: "bg-emerald-500",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
};

export function ProfileHeader({ profile, className }: ProfileHeaderProps) {
  const cfg = LIFECYCLE_CONFIG[profile?.lifecycle_stage];

  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* ── Gradient banner ── */}
      <div className={cn("h-24 w-full bg-linear-to-r", cfg?.banner)}>
        <div
          className="h-full w-full opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/*
        ── Row layout: avatar LEFT | details RIGHT ──
        The entire row is pulled up by -mt-10 so the avatar
        overlaps the banner. The details column uses pt-12 to
        push text back down below the banner edge.
      */}
      <div className="flex items-center gap-5 px-6 pb-6 -mt-14">
        {/* LEFT — avatar, sits half-in the banner */}
        <div className="shrink-0">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={profile?.avatar_url ?? ""}
              alt={profile?.full_name ?? "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* RIGHT — all text, aligned to start below the banner */}
        <div className="flex-1 min-w-0">
          {/* Name + lifecycle badge on same line */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground leading-none capitalize">
              {profile?.full_name ?? "—"}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 rounded-full px-3 py-1 text-sm font-semibold shrink-0",
                cfg?.badge,
              )}
            >
              <span className={cn("h-2 w-2 rounded-full shrink-0", cfg?.dot)} />
              {cfg?.label}
            </Badge>
          </div>

          {/* Contact pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              {profile?.email}
            </span>
            {profile?.phone && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {profile?.phone}
              </span>
            )}
            {profile?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                {profile?.location}
              </span>
            )}
          </div>
          {profile?.skills && profile?.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.skills?.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/30 pl-3 max-w-prose">
              {profile?.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
