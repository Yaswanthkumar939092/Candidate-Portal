"use client"

import { Suspense, useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

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
import { useAuth } from "@/lib/contexts/auth-context"
import { useActionCenter, useActionCenterMyRequest, useCandidateRaiseRequest } from "@/lib/hooks/useAcationCenter"
import { toast } from "sonner"

/**
 * Maps the API status string to the Task status union type.
 */
function mapApiStatusToTaskStatus(
  apiStatus: string
): Task["status"] {
  switch (apiStatus?.toLowerCase()) {
    case "action required":
      return "action_required"
    case "completed":
      return "completed"
    case "approved":
      return "approved"
    case "pending":
      return "pending"
    default:
      return "action_required"
  }
}

/**
 * Transforms raw API items into the Task[] shape expected by AssignedTasksList.
 */
function mapApiItemsToTasks(items: any[]): Task[] {
  return items.map((item, index) => {
    const status = mapApiStatusToTaskStatus(item.status)
    const isCompleted = status === "completed" || status === "approved"

    // Use title from item
    const title = item.title || "Task"

    // Derive a category from reference_doctype
    const category = item.reference_doctype
      ? item.reference_doctype.replace(/_/g, " ")
      : "General"

    // Format modified date for display
    const formattedDate = item.modified
      ? new Date(item.modified).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : undefined

    return {
      id: item.name ?? `task-${index}`,
      title,
      category,
      status,
      description: item.description || "",
      attachment: item.attachment || "",
      ...(isCompleted
        ? { completedDate: formattedDate }
        : { dueDate: formattedDate }),
      // Optionally carry through redirect for click handling
      redirectUrl: item.redirect_url,
    } satisfies Task & { redirectUrl?: string }
  })
}

function mapApiStatusToRequestStatus(
  apiStatus: string
): Request["status"] {
  switch (apiStatus?.toLowerCase()) {
    case "pending":
      return "pending_approval"

    case "approved":
      return "approved"

    case "rejected":
      return "rejected"

    case "completed":   // ✅ ADD THIS
      return "approved" // ya "rejected" nahi, logically approved type

    case "in review":
      return "in_review"

    default:
      return "pending_approval"
  }
}

function mapApiItemsToRequests(items: any[]): Request[] {
  return items.map((item, index) => {
    const status = mapApiStatusToRequestStatus(item.status)

    // Use title from item
    const title = item.title || "Request"

    // Category
    const category = item.request_type
      ? item.request_type.replace(/_/g, " ")
      : "General"

    // Date format
    const formattedDate = item.creation
      ? new Date(item.creation).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : undefined

    return {
      id: item.name ?? `req-${index}`,
      title,
      category,
      status,
      requestType: item.request_type || "General",
      submittedDate: formattedDate,
      description: item.description || "",
      redirectUrl: item.redirect_url || "",
      attachment: item.attachment || "",


    }
  })
}
/**
 * Action Center page -- shows assigned tasks and user requests in tabbed layout.
 */
function ActionCenterContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<"tasks" | "requests">(
    tabParam === "requests" ? "requests" : "tasks"
  )
  const [filter, setFilter] = useState("pending")
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)

  const { user } = useAuth()
  const userEmail = user?.email || user?.user_metadata?.email || ""

  const {
    data: actionCenterData,
    isLoading: isFormConfigLoading,
    isError: isFormConfigError,
  } = useActionCenter(userEmail)

  const {
    data: actionCenterMyRequestData,
  } = useActionCenterMyRequest({
    page: 1,
    limit: 100000,
    userEmail: userEmail as string
  })
  const { mutate: raiseRequest } = useCandidateRaiseRequest()
  // Derive tasks from API response; fall back to empty array while loading
  const tasks: Task[] = actionCenterData?.items
    ? mapApiItemsToTasks(actionCenterData.items)
    : []

  // Requests remain empty until a requests API is wired up
  const requests: Request[] = actionCenterMyRequestData
    ? mapApiItemsToRequests(actionCenterMyRequestData)
    : []

  // Count tasks by filter category
  const pendingTaskCount = tasks.filter(
    (t) => t.status === "action_required" || t.status === "pending"
  ).length
  const acceptedTaskCount = tasks.filter(
    (t) => t.status === "approved" || t.status === "completed"
  ).length

  const pendingRequestCount = requests.filter(
    (r) => r.status === "pending_approval" || r.status === "in_review"
  ).length

  const acceptedRequestCount = requests.filter(
    (r) => r.status === "approved" || r.status === "rejected"
  ).length

  const currentPendingCount =
    activeTab === "tasks" ? pendingTaskCount : pendingRequestCount
  const currentAcceptedCount =
    activeTab === "tasks" ? acceptedTaskCount : acceptedRequestCount

  const handleRequestSubmit = (data: {
    requestType: string
    description: string
    attachment: string
  }) => {
    raiseRequest({
      ...data,
      request_type: data.requestType,
      candidate_email: userEmail
    }, {
      onSuccess: () => {
        toast.success("Request created successfully")
      },
      onError: (err) => {
        toast.error("Error:", err)
      },
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-gray-100">
            Action Center
          </h1>
          <p className="mt-1 text-base text-[#6A7282] dark:text-gray-400">
            Manage your tasks and requests efficiently.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          className={cn(
            "relative pb-3 text-sm font-medium transition-colors",
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
            "relative pb-3 text-sm font-medium transition-colors",
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

      {/* Filter pills and Raise Request Button row */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-[#F2F4F7] p-1 w-fit border border-[#E5E7EB] dark:bg-card dark:border-border">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              filter === "pending"
                ? "bg-card dark:bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setFilter("pending")}
          >
            Pending ({currentPendingCount})
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              filter === "accepted"
                ? "bg-card dark:bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setFilter("accepted")}
          >
            Completed ({currentAcceptedCount})
          </button>
        </div>
        {activeTab === "requests" && (
          <Button
            onClick={() => setRequestDialogOpen(true)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 font-semibold shrink-0"
          >
            <Plus className="h-4 w-4 sm:mr-1 shrink-0" strokeWidth={3} />
            <span className="hidden sm:inline whitespace-nowrap">
              Raise Request
            </span>
          </Button>
        )}
      </div>

      {/* Loading / error states */}
      {activeTab === "tasks" && isFormConfigLoading && (
        <p className="text-sm text-slate-500 dark:text-gray-400 py-6 text-center">
          Loading tasks…
        </p>
      )}
      {activeTab === "tasks" && isFormConfigError && (
        <p className="text-sm text-red-500 py-6 text-center">
          Failed to load tasks. Please try again.
        </p>
      )}

      {/* Tab content */}
      {activeTab === "tasks" && !isFormConfigLoading && !isFormConfigError && (
        <AssignedTasksList tasks={tasks} filter={filter} />
      )}
      {activeTab === "requests" && (
        <MyRequestsList requests={requests} filter={filter} />
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

export default function ActionCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading action center...</p>
          </div>
        </div>
      }
    >
      <ActionCenterContent />
    </Suspense>
  )
}