"use client"

import {
  Calendar,
  ChevronRight,
  FileText,
  CalendarClock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Request {
  id: string
  title: string
  category: string
  status: "pending_approval" | "approved" | "rejected" | "in_review"
  responseDate?: string
  submittedDate?: string
  icon?: string
  iconColor?: string
}

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending_approval: {
    label: "Pending Approval",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  approved: {
    label: "Approved",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  in_review: {
    label: "In Review",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
}

interface MyRequestsListProps {
  requests: Request[]
  filter?: string
  className?: string
}

/**
 * Displays a list of user-submitted requests with icon circles,
 * status badges, response dates, and "View Status" action links.
 *
 * @param requests - Array of request objects to display
 * @param filter - Optional filter string to filter by status
 */
export function MyRequestsList({
  requests,
  filter,
  className,
}: MyRequestsListProps) {
  // Apply filter if provided
  const filteredRequests =
    filter && filter !== "all"
      ? requests.filter((req) => {
          if (filter === "pending") return req.status === "pending_approval" || req.status === "in_review"
          if (filter === "accepted") return req.status === "approved"
          return true
        })
      : requests

  if (filteredRequests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No requests found for the selected filter.
        </p>
      </div>
    )
  }

  // Group by category
  const grouped = filteredRequests.reduce<Record<string, Request[]>>(
    (acc, req) => {
      const cat = req.category || "Other"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(req)
      return acc
    },
    {}
  )

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(grouped).map(([category, categoryRequests]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{category}</h3>
          <div className="space-y-2">
            {categoryRequests.map((req) => {
              const statusConfig =
                STATUS_STYLES[req.status] ?? STATUS_STYLES.pending_approval

              return (
                <Card key={req.id} className="shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3">
                    {/* Icon circle */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <CalendarClock className="h-4 w-4" />
                    </div>

                    {/* Request info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-medium text-foreground">
                          {req.title}
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
                        {req.responseDate
                          ? `Response on ${req.responseDate}`
                          : req.submittedDate
                            ? `Submitted on ${req.submittedDate}`
                            : "No date available"}
                      </div>
                    </div>

                    {/* Action link */}
                    <button className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline">
                      View Status
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
