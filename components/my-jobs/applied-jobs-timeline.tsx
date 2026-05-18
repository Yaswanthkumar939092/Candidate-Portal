"use client"

import { Check, Building2, MapPin, Clock, Briefcase, CalendarDays, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"
import { ViewApplicationModal } from "./view-application-modal"

// ─────────────────────────────────────────────
// Types — mirroring the API response shape
// ─────────────────────────────────────────────

export interface ApiFlag {
  status: string
  flag: boolean
  date: string | null
}

export interface ApiJob {
  designation: string
  company: string | null
  location: string | null
  experience_range: string | null
  employment_type: string | null
}

export interface ApiApplication {
  id: string
  applied_on: string
  job: ApiJob
  status: string
  flags: ApiFlag[]
}

interface AppliedJobsTimelineProps {
  applicantName: string
  applications: ApiApplication[]
  className?: string
}

// ─────────────────────────────────────────────
// ApplicationStageBadge
// ─────────────────────────────────────────────

type ApplicationStage =
  | "pending"
  | "reviewing"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn"

const STAGE_STYLES: Record<
  ApplicationStage,
  { label: string; className: string }
> = {
  pending: {
    label: "Applied",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  reviewing: {
    label: "In Review",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  interviewing: {
    label: "Interview",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  offered: {
    label: "Offered",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  withdrawn: {
    label: "Withdrawn",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
}

// Map API status strings → UI stage
const FLAG_STATUS_MAP: Record<string, ApplicationStage> = {
  Open: "pending",
  Screening: "reviewing",
  Replied: "reviewing",
  Interview: "interviewing",
  Hold: "interviewing",
  Approvals: "offered",
  Accepted: "offered",
  Rejected: "rejected",
}

/**
 * Derive the current badge stage from the application's flags array.
 * Uses the last flag where flag === true.
 */
function mapFlagsToStage(flags: ApiFlag[]): ApplicationStage {
  if (!flags || !Array.isArray(flags)) return "pending"
  const activeFlags = flags.filter((f) => f?.flag)
  if (!activeFlags.length) return "pending"
  const last = activeFlags[activeFlags.length - 1]
  return FLAG_STATUS_MAP[last?.status] ?? "pending"
}

function ApplicationStageBadge({
  stage,
  className,
}: {
  stage: ApplicationStage
  className?: string
}) {
  const config = STAGE_STYLES[stage] ?? STAGE_STYLES.pending
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function AppliedJobsTimeline({
  applicantName,
  applications,
  className,
}: AppliedJobsTimelineProps) {
  const [selectedApplication, setSelectedApplication] = React.useState<string | null>(null)

  return (
    <div className={cn("space-y-4", className)}>
      {applications.map((app) => {
        const stage = mapFlagsToStage(app.flags)
        const { designation, company, location, experience_range, employment_type } = app.job
        return (
          <Card key={app.id} className="shadow-sm">
            <CardContent className="space-y-5">
              {/* ── Header ── */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {designation}
                </h3>
                <ApplicationStageBadge stage={stage} className="shrink-0" />
              </div>

              {/* ── Job Details Grid ── */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-4">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    Company
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {company ?? <span className="text-muted-foreground italic">Not specified</span>}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Location
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {location ?? <span className="text-muted-foreground italic">Not specified</span>}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Experience
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {experience_range ?? <span className="text-muted-foreground italic">Not specified</span>}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    Job Type
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {employment_type ?? <span className="text-muted-foreground italic">Not specified</span>}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <User className="h-3 w-3" />
                    Applicant
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {applicantName || <span className="text-muted-foreground italic">—</span>}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    Applied On
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {app.applied_on || <span className="text-muted-foreground italic">—</span>}
                  </span>
                </div>
              </div>

              {/* ── Timeline from flags ── */}
              <div className="px-2">
                <div className="grid grid-cols-6 md:grid-cols-8 xl:grid-cols-12 items-center">
                  {app.flags.map((flag, idx) => {
                    const isActive = flag.flag
                    const prevActive = idx > 0 ? app.flags[idx - 1].flag : false

                    return (
                      <React.Fragment key={flag.status}>
                        {/* Left connector line (before first node, skip) */}
                        {idx > 0 && (
                          <div className="relative h-1 flex-1">
                            <div className="absolute inset-0 rounded-full bg-muted" />
                            {prevActive && isActive && (
                              <div className="absolute inset-0 rounded-full bg-green-500" />
                            )}
                            {prevActive && !isActive && (
                              <div className="absolute inset-0 rounded-full bg-green-500" />
                            )}
                          </div>
                        )}

                        {/* Node + label stacked, but node stays in the flex row */}
                        <div className="flex flex-col items-center mt-10">
                          {/* Node circle */}
                          {isActive ? (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-white dark:bg-background text-xs text-muted-foreground">
                              {idx + 1}
                            </div>
                          )}

                          {/* Label below — does NOT affect line alignment */}
                          <span
                            className={cn(
                              "mt-2 text-center text-xs font-medium whitespace-nowrap",
                              isActive ? "text-foreground" : "text-muted-foreground/50"
                            )}
                          >
                            {flag.status}
                          </span>

                          {isActive && flag.date ? (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {flag.date}
                            </span>
                          ) : (
                            <span className="text-[10px] invisible">—</span>
                          )}
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* ── Action ── */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(app.id)}
                >
                  View Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <ViewApplicationModal
        jobApplicantName={selectedApplication}
        isOpen={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />
    </div>
  )
}