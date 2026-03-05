"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type TaskStatus = "pending" | "in_progress" | "completed" | "overdue"

interface TaskStatusBadgeProps {
  status: TaskStatus
  className?: string
}

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  overdue: {
    label: "Overdue",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
}

/**
 * Colour-coded badge for action center task status.
 */
export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.pending

  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
