"use client";

import { cn } from "@/lib/utils";
import {
  CircleUserRound,
  UserCog,
  Clock,
  KeyRound,
  Hash,
  Phone,
} from "lucide-react";
import type { Profile } from "@/types/database";
import { PasswordChangeForm } from "./password-change-form";
import { MobileEditInline } from "./mobile-edit-inline";

interface ProfileDetailsProps {
  profile: Profile;
  className?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface DetailRowProps {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  children: React.ReactNode;
}

function DetailRow({ icon, iconClass, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          iconClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className="text-sm font-semibold text-foreground">{children}</div>
      </div>
    </div>
  );
}

/**
 * Professional preferences and account info sections for the profile page.
 */
export function ProfileDetails({ profile, className }: ProfileDetailsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {/* ── Account Security ── */}
      <PasswordChangeForm />

      {/* ── Account Info ── */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Colored section header */}
        <div className="flex items-center gap-2.5 px-6 py-4 bg-muted/50 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <CircleUserRound className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Account Info</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          <DetailRow
            icon={
              <UserCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            }
            iconClass="bg-blue-100 dark:bg-blue-900/50"
            label="Role"
          >
            <span className="capitalize">
              {profile.role.replace(/_/g, " ")}
            </span>
          </DetailRow>

          <DetailRow
            icon={
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            }
            iconClass="bg-emerald-100 dark:bg-emerald-900/50"
            label="Mobile Number"
          >
            <MobileEditInline profile={profile} />
          </DetailRow>

          <DetailRow
            icon={
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            }
            iconClass="bg-amber-100 dark:bg-amber-900/50"
            label="Last Logged In"
          >
            {formatDateTime(profile.last_login_at)}
          </DetailRow>

          {profile.provider && (
            <DetailRow
              icon={
                <KeyRound className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              }
              iconClass="bg-purple-100 dark:bg-purple-900/50"
              label="Sign-in Provider"
            >
              <span className="capitalize">{profile.provider}</span>
            </DetailRow>
          )}

          {profile.frappe_employee_id && (
            <DetailRow
              icon={
                <Hash className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              }
              iconClass="bg-rose-100 dark:bg-rose-900/50"
              label="Employee ID"
            >
              {profile.frappe_employee_id}
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  );
}
