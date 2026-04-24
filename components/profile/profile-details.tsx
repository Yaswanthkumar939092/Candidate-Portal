"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  CalendarDays,
  Zap,
  UserCog,
  RefreshCw,
  KeyRound,
  Hash,
} from "lucide-react"
import type { Profile } from "@/types/database"

interface ProfileDetailsProps {
  profile: Profile
  className?: string
}

const EXPERIENCE_LABELS: Record<NonNullable<Profile["experience_level"]>, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
}

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
}

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
  "part-time": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
  contract: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
  freelance: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
  internship: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-700",
}

const SKILL_PALETTE = [
  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
  "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-700",
  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
  "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700",
  "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-700",
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n)
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

interface DetailRowProps {
  icon: React.ReactNode
  iconClass: string
  label: string
  children: React.ReactNode
}

function DetailRow({ icon, iconClass, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          iconClass
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="text-sm font-semibold text-foreground">{children}</div>
      </div>
    </div>
  )
}

/**
 * Professional preferences and account info sections for the profile page.
 */
export function ProfileDetails({ profile, className }: ProfileDetailsProps) {
  const salary = formatSalary(profile.preferred_salary_min, profile.preferred_salary_max)
  const hasPreferences =
    !!profile.experience_level ||
    !!salary ||
    (profile.skills?.length ?? 0) > 0 ||
    (profile.preferred_job_types?.length ?? 0) > 0

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {/* ── Professional Preferences ── */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Colored section header */}
        <div className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="font-semibold text-foreground">Professional Preferences</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!hasPreferences && (
            <p className="text-sm text-muted-foreground">No preferences set yet.</p>
          )}

          {profile.experience_level && (
            <DetailRow
              icon={<GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
              iconClass="bg-violet-100 dark:bg-violet-900/50"
              label="Experience Level"
            >
              {EXPERIENCE_LABELS[profile.experience_level]}
            </DetailRow>
          )}

          {salary && (
            <DetailRow
              icon={<IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              iconClass="bg-emerald-100 dark:bg-emerald-900/50"
              label="Preferred Salary"
            >
              {salary}
            </DetailRow>
          )}

          {(profile.preferred_job_types?.length ?? 0) > 0 && (
            <DetailRow
              icon={<Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              iconClass="bg-blue-100 dark:bg-blue-900/50"
              label="Preferred Job Types"
            >
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.preferred_job_types!.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className={cn("rounded-full text-xs font-medium", JOB_TYPE_COLORS[t])}
                  >
                    {JOB_TYPE_LABELS[t] ?? t}
                  </Badge>
                ))}
              </div>
            </DetailRow>
          )}

          {(profile.skills?.length ?? 0) > 0 && (
            <DetailRow
              icon={<Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              iconClass="bg-amber-100 dark:bg-amber-900/50"
              label="Skills"
            >
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.skills!.map((skill, i) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className={cn("rounded-full text-xs font-medium", SKILL_PALETTE[i % SKILL_PALETTE.length])}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </DetailRow>
          )}
        </div>
      </div>

      {/* ── Account Info ── */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Colored section header */}
        <div className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-slate-50 to-cyan-50 dark:from-slate-900/40 dark:to-cyan-950/30 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
            <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="font-semibold text-foreground">Account Info</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          <DetailRow
            icon={<UserCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            iconClass="bg-blue-100 dark:bg-blue-900/50"
            label="Role"
          >
            <span className="capitalize">{profile.role.replace(/_/g, " ")}</span>
          </DetailRow>

          <DetailRow
            icon={<CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            iconClass="bg-emerald-100 dark:bg-emerald-900/50"
            label="Member Since"
          >
            {formatDate(profile.created_at)}
          </DetailRow>

          <DetailRow
            icon={<RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            iconClass="bg-amber-100 dark:bg-amber-900/50"
            label="Last Updated"
          >
            {formatDate(profile.updated_at)}
          </DetailRow>

          {profile.provider && (
            <DetailRow
              icon={<KeyRound className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              iconClass="bg-purple-100 dark:bg-purple-900/50"
              label="Sign-in Provider"
            >
              <span className="capitalize">{profile.provider}</span>
            </DetailRow>
          )}

          {profile.frappe_employee_id && (
            <DetailRow
              icon={<Hash className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
              iconClass="bg-rose-100 dark:bg-rose-900/50"
              label="Employee ID"
            >
              {profile.frappe_employee_id}
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  )
}
