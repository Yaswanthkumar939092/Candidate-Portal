"use client"

import { useState } from "react"
import { Info, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AssignedTasksList,
  type Task,
} from "@/components/action-center/assigned-tasks-list"
import {
  MyRequestsList,
  type Request,
} from "@/components/action-center/my-requests-list"
import { RaiseRequestDialog } from "@/components/action-center/raise-request-dialog"
import { cn } from "@/lib/utils"

// Mock data for assigned tasks
const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "PF Form",
    category: "Onboarding",
    status: "action_required",
    dueDate: "15 May 2025",
  },
  {
    id: "t2",
    title: "Offer Letter Released",
    category: "Recruitment",
    status: "completed",
    completedDate: "04 Feb 2025",
  },
  {
    id: "t3",
    title: "Pre-Offer Submission",
    category: "Recruitment",
    status: "approved",
    completedDate: "04 Feb 2025",
  },
  {
    id: "t4",
    title: "Onboarding Journey",
    category: "Onboarding",
    status: "completed",
    completedDate: "10 Feb 2025",
  },
  {
    id: "t5",
    title: "Gratuity Form",
    category: "Onboarding",
    status: "completed",
    completedDate: "12 Feb 2025",
  },
]

// Mock data for requests
const MOCK_REQUESTS: Request[] = [
  {
    id: "r1",
    title: "Extension of Joining Date",
    category: "Request",
    status: "pending_approval",
    responseDate: "15 May 2025",
  },
]

/**
 * Action Center page -- shows assigned tasks and user requests in tabbed layout.
 * Includes a blue info banner, filter pills (Pending/Accepted/All), and a
 * "Raise a Request" button that opens a right-side sheet.
 */
export default function ActionCenterPage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "requests">("tasks")
  const [filter, setFilter] = useState("pending")
  const [infoBannerVisible, setInfoBannerVisible] = useState(true)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)

  // Count tasks and requests by filter category
  const pendingTaskCount = MOCK_TASKS.filter(
    (t) => t.status === "action_required" || t.status === "pending"
  ).length
  const acceptedTaskCount = MOCK_TASKS.filter(
    (t) => t.status === "approved" || t.status === "completed"
  ).length

  const pendingRequestCount = MOCK_REQUESTS.filter(
    (r) => r.status === "pending_approval" || r.status === "in_review"
  ).length
  const acceptedRequestCount = MOCK_REQUESTS.filter(
    (r) => r.status === "approved"
  ).length

  const currentPendingCount =
    activeTab === "tasks" ? pendingTaskCount : pendingRequestCount
  const currentAcceptedCount =
    activeTab === "tasks" ? acceptedTaskCount : acceptedRequestCount

  const handleRequestSubmit = (data: {
    requestType: string
    description: string
    attachments: File[]
  }) => {
    // In a real app, this would make an API call
    console.log("Request submitted:", data)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Action Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your tasks, tasks and requests efficiently.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setRequestDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Raise Request
        </Button>
      </div>

      {/* Info banner */}
      {infoBannerVisible && (
        <div className="relative flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Did you know?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Take quick or give offer submissions and offer acceptance can be
              completed directly from this dashboard.
            </p>
          </div>
          <button
            onClick={() => setInfoBannerVisible(false)}
            className="shrink-0 text-blue-500 hover:text-blue-700"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          className={cn(
            "relative pb-2.5 text-sm font-medium transition-colors",
            activeTab === "tasks"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            setActiveTab("tasks")
            setFilter("pending")
          }}
        >
          Assigned Tasks
          {activeTab === "tasks" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          className={cn(
            "relative pb-2.5 text-sm font-medium transition-colors",
            activeTab === "requests"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            setActiveTab("requests")
            setFilter("pending")
          }}
        >
          My Requests
          {activeTab === "requests" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            filter === "pending"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setFilter("pending")}
        >
          Pending
          {currentPendingCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "h-4 px-1 text-[10px]",
                filter === "pending"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted"
              )}
            >
              {currentPendingCount}
            </Badge>
          )}
        </button>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            filter === "accepted"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setFilter("accepted")}
        >
          Accepted
          {currentAcceptedCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "h-4 px-1 text-[10px]",
                filter === "accepted"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted"
              )}
            >
              {currentAcceptedCount}
            </Badge>
          )}
        </button>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            filter === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setFilter("all")}
        >
          All
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "tasks" && (
        <AssignedTasksList tasks={MOCK_TASKS} filter={filter} />
      )}
      {activeTab === "requests" && (
        <MyRequestsList requests={MOCK_REQUESTS} filter={filter} />
      )}

      {/* Raise Request Dialog (Sheet) */}
      <RaiseRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSubmit={handleRequestSubmit}
      />
    </div>
  )
}
