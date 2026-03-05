"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ApplicationStage =
  | "pending"
  | "reviewing"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn"

interface ApplicationStageBadgeProps {
  stage: ApplicationStage
  className?: string
}

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

/**
 * Colour-coded badge indicating an application's current stage.
 */
export function ApplicationStageBadge({
  stage,
  className,
}: ApplicationStageBadgeProps) {
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
