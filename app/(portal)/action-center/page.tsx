"use client"

import { useState } from "react"
import { Info, Lightbulb, Plus, X } from "lucide-react"
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
    completedDate: "04-09-2025",
    icon: "FileText",
    iconColor: "bg-[#12B76A]",
  },
  {
    id: "t3",
    title: "Pre-Offer Submission",
    category: "Recruitment",
    status: "approved",
    completedDate: "03-09-2025",
    icon: "Check",
    iconColor: "bg-[#12B76A]",
  },
  {
    id: "t4",
    title: "Onboarding Journey",
    category: "Onboarding",
    status: "completed",
    completedDate: "10-09-2025",
    icon: "Clock",
    iconColor: "bg-[#7A5AF8]",
  },
  {
    id: "t5",
    title: "Gratuity Form",
    category: "Onboarding",
    status: "completed",
    completedDate: "09-09-2025",
    icon: "FileText",
    iconColor: "bg-[#2E90FA]",
  },
]

// Mock data for requests
const MOCK_REQUESTS: Request[] = [
  {
    id: "r1",
    title: "Extension of Joining Date",
    category: "Request",
    status: "pending_approval",
    requestType: "Date Change",
    submittedDate: "12-Sep-2025",
    icon: "Clock",
    iconColor: "bg-[#F79009]",
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-gray-100">Action Center</h1>
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
              Tasks such as pre-offer submission and offer acceptance can be completed directly from this dashboard.
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
              filter === "accepted" // Interpreting "Archived" as "accepted" in code logic
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
            <span className="hidden sm:inline whitespace-nowrap">Raise Request</span>
          </Button>
        )}
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
