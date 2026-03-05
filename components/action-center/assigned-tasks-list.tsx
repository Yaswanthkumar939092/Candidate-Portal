"use client"

import {
  Calendar,
  ChevronRight,
  FileText,
  Users,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Task {
  id: string
  title: string
  category: string
  status: "action_required" | "completed" | "approved" | "pending"
  dueDate?: string
  completedDate?: string
  icon?: string
  iconColor?: string
}

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  action_required: {
    label: "Action Required",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  completed: {
    label: "Completed",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  approved: {
    label: "Approved",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  pending: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
}

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; bgColor: string }> = {
  Onboarding: { icon: ClipboardCheck, bgColor: "bg-purple-100 text-purple-600" },
  Recruitment: { icon: Users, bgColor: "bg-blue-100 text-blue-600" },
  Documents: { icon: FileText, bgColor: "bg-orange-100 text-orange-600" },
  Training: { icon: GraduationCap, bgColor: "bg-green-100 text-green-600" },
}

interface AssignedTasksListProps {
  tasks: Task[]
  filter?: string
  className?: string
}

/**
 * Displays assigned tasks grouped by category, with colored icon circles,
 * status badges, due dates, and "Complete Now" action links.
 *
 * @param tasks - Array of task objects to display
 * @param filter - Optional filter string to filter tasks by status
 */
export function AssignedTasksList({
  tasks,
  filter,
  className,
}: AssignedTasksListProps) {
  // Apply filter if provided
  const filteredTasks =
    filter && filter !== "all"
      ? tasks.filter((task) => {
          if (filter === "pending") return task.status === "action_required" || task.status === "pending"
          if (filter === "accepted") return task.status === "approved" || task.status === "completed"
          return true
        })
      : tasks

  // Group tasks by category
  const grouped = filteredTasks.reduce<Record<string, Task[]>>(
    (acc, task) => {
      const cat = task.category || "Other"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(task)
      return acc
    },
    {}
  )

  if (filteredTasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No tasks found for the selected filter.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(grouped).map(([category, categoryTasks]) => {
        const catConfig = CATEGORY_ICONS[category] ?? {
          icon: ClipboardCheck,
          bgColor: "bg-muted text-muted-foreground",
        }

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryTasks.map((task) => {
                const statusConfig =
                  STATUS_STYLES[task.status] ?? STATUS_STYLES.pending
                const IconComponent = catConfig.icon

                return (
                  <Card key={task.id} className="shadow-sm">
                    <CardContent className="flex items-center gap-3 py-3">
                      {/* Icon circle */}
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          catConfig.bgColor
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Task info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-medium text-foreground">
                            {task.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "shrink-0 border-transparent text-[10px]",
                              statusConfig.className
                            )}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate
                            ? `Due by ${task.dueDate}`
                            : task.completedDate
                              ? `Completed on ${task.completedDate}`
                              : "No due date"}
                        </div>
                      </div>

                      {/* Action link */}
                      {(task.status === "action_required" ||
                        task.status === "pending") && (
                        <button className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline">
                          Complete Now
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {task.status === "completed" && (
                        <button className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline">
                          View Details
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
