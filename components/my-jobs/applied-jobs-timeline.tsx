"use client"

import { Check, Building2, MapPin, Clock, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The pipeline stages for each application.
 */
const PIPELINE_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "review", label: "Review" },
  { key: "interview", label: "Interview" },
  { key: "transitioning", label: "Transitioning" },
] as const

type PipelineStageKey = (typeof PIPELINE_STAGES)[number]["key"]

interface TimelineStage {
  key: string
  label: string
  date?: string
}

export interface ApplicationWithTimeline {
  id: string
  jobTitle: string
  company: string
  location: string
  experience: string
  jobType: string
  currentStage: PipelineStageKey
  stages: TimelineStage[]
  appliedDate: string
}

interface AppliedJobsTimelineProps {
  applications: ApplicationWithTimeline[]
  className?: string
}

/**
 * Displays applied job cards with a horizontal timeline showing progress
 * through the hiring pipeline: Applied -> Review -> Interview -> Transitioning.
 * Green filled circles for completed stages, connected by green lines.
 * Gray for upcoming stages.
 */
export function AppliedJobsTimeline({
  applications,
  className,
}: AppliedJobsTimelineProps) {
  const getStageIndex = (stageKey: string): number => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.key === stageKey)
    return idx >= 0 ? idx : 0
  }

  return (
    <div className={cn("space-y-4", className)}>
      {applications.map((app) => {
        const currentStageIndex = getStageIndex(app.currentStage)

        return (
          <Card key={app.id} className="shadow-sm">
            <CardContent className="space-y-5">
              {/* Job header */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {app.jobTitle}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {app.company}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {app.location}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {app.experience}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {app.jobType}
                  </span>
                </div>
              </div>

              {/* Horizontal timeline */}
              <div className="px-2">
                <div className="flex items-start">
                  {PIPELINE_STAGES.map((stage, idx) => {
                    const isPast = idx < currentStageIndex
                    const isCurrent = idx === currentStageIndex
                    const isCompleted = isPast || isCurrent
                    const stageData = app.stages.find(
                      (s) => s.key === stage.key
                    )

                    return (
                      <div key={stage.key} className="flex flex-1 items-start">
                        <div className="flex w-full flex-col items-center">
                          {/* Circle + connector row */}
                          <div className="flex w-full items-center">
                            {/* Left connector */}
                            {idx > 0 && (
                              <div className="relative h-1 flex-1">
                                <div className="absolute inset-0 rounded-full bg-muted" />
                                {(isPast || isCurrent) && (
                                  <div className="absolute inset-0 rounded-full bg-green-500" />
                                )}
                              </div>
                            )}
                            {idx === 0 && <div className="flex-1" />}

                            {/* Circle */}
                            {isCompleted ? (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 shadow-sm">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 shrink-0 rounded-full border-2 border-muted-foreground/20 bg-white" />
                            )}

                            {/* Right connector */}
                            {idx < PIPELINE_STAGES.length - 1 && (
                              <div className="relative h-1 flex-1">
                                <div className="absolute inset-0 rounded-full bg-muted" />
                                {isPast && (
                                  <div className="absolute inset-0 rounded-full bg-green-500" />
                                )}
                              </div>
                            )}
                            {idx === PIPELINE_STAGES.length - 1 && (
                              <div className="flex-1" />
                            )}
                          </div>

                          {/* Stage label */}
                          <span
                            className={cn(
                              "mt-2 text-xs font-medium",
                              isCompleted
                                ? "text-foreground"
                                : "text-muted-foreground/50"
                            )}
                          >
                            {stage.label}
                          </span>

                          {/* Stage date */}
                          {stageData?.date && (
                            <span className="mt-0.5 text-[10px] text-muted-foreground">
                              {stageData.date}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* View Application button */}
              <div>
                <Button variant="outline" size="sm">
                  View Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
