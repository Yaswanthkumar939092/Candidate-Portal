/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Lightbulb, Plus, X } from "lucide-react"
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

    // Derive a human-readable title from the name field (strip the email prefix)
    const rawName: string = item.name ?? ""
    const titleFromName = rawName.includes(" - ")
      ? rawName.split(" - ").slice(1).join(" - ").trim()
      : rawName

    // Use description as a fallback title if name parsing yields nothing useful
    const title = titleFromName || item.description?.split("\n")[0] || "Task"

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

    // Title
    const title =
      item.name ||
      item.description?.split("\n")[0] ||
      "Request"

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
export default function ActionCenterPage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "requests">("tasks")
  const [filter, setFilter] = useState("pending")
  const [infoBannerVisible, setInfoBannerVisible] = useState(true)
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
  } = useActionCenterMyRequest( {
    page: 1,
    limit: 100000,
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
              ? "text-[#101828] dark:text-gray-100"
              : "text-[#6A7282] hover:text-[#101828] dark:text-gray-400 dark:hover:text-gray-200"
          )}
          onClick={() => {
            setActiveTab("tasks")
            setFilter("pending")
          }}
        >
          Assigned Tasks
          {activeTab === "tasks" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-gray-100" />
          )}
        </button>
        <button
          className={cn(
            "relative pb-3 text-sm font-medium transition-colors",
            activeTab === "requests"
              ? "text-slate-900 dark:text-gray-100"
              : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200"
          )}
          onClick={() => {
            setActiveTab("requests")
            setFilter("pending")
          }}
        >
          My Requests
          {activeTab === "requests" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-gray-100" />
          )}
        </button>
      </div>

      {/* Info banner */}
      {infoBannerVisible && (
        <div className="relative flex items-center gap-3 rounded-xl border border-blue-100 bg-[#F4FAFF] p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2E90FA] self-start mt-0.5">
            <Lightbulb className="size-4 text-white" strokeWidth={3} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <span className="font-bold text-[#101828] dark:text-gray-100">
              Did you know?
            </span>
            <span className="text-[#344054] dark:text-gray-300 block sm:inline">
              Tasks such as pre-offer submission and offer acceptance can be
              completed directly from this dashboard.
            </span>
          </div>
          <button
            onClick={() => setInfoBannerVisible(false)}
            className="shrink-0 text-blue-400 hover:text-blue-600 transition-colors self-start mt-0.5"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter pills and Raise Request Button row */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-[#F2F4F7] p-1 w-fit border border-[#E5E7EB] dark:bg-slate-900 dark:border-slate-800">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              filter === "pending"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-gray-100"
                : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-300"
            )}
            onClick={() => setFilter("pending")}
          >
            Pending ({currentPendingCount})
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              filter === "accepted"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-gray-100"
                : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-300"
            )}
            onClick={() => setFilter("accepted")}
          >
            Archived ({currentAcceptedCount})
          </button>
        </div>
        {activeTab === "requests" && (
          <Button
            onClick={() => setRequestDialogOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#0F172A]/90 text-white rounded-lg px-3 sm:px-4 py-2 font-semibold shrink-0"
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