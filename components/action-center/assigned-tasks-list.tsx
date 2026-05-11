"use client"

import {
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  FileText,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"

export interface Task {
  attachment: string
  redirectUrl: string
  description: string
  id: string
  title: string
  category: string
  status: "action_required" | "completed" | "approved" | "pending"
  dueDate?: string
  completedDate?: string
  icon?: string
  iconColor?: string
}

const STATUS_STYLES: Record<string, { label: string; badgeClass: string; iconBgColor: string; icon: React.ElementType }> = {
  action_required: {
    label: "Action Required",
    badgeClass: "bg-red-50 text-[#B42318] hover:bg-red-50 dark:bg-red-900/30 dark:text-red-400 border border-[#FECDCA] font-medium text-[12px] px-2.5 py-0.5 rounded-full shadow-none",
    iconBgColor: "bg-[#F04438]",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-[#ECFDF3] text-[#027A48] hover:bg-[#ECFDF3] dark:bg-green-900/30 dark:text-green-400 border border-[#A6F4C5] font-medium text-[12px] px-2.5 py-0.5 rounded-full shadow-none",
    iconBgColor: "bg-[#12B76A]",
    icon: FileText,
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-[#EFF8FF] text-[#175CD3] hover:bg-[#EFF8FF] dark:bg-blue-900/30 dark:text-blue-400 border border-[#B2DDFF] font-medium text-[12px] px-2.5 py-0.5 rounded-full shadow-none",
    iconBgColor: "bg-[#12B76A]",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    badgeClass: "bg-[#FFFAEB] text-[#B54708] hover:bg-[#FFFAEB] dark:bg-orange-900/30 dark:text-orange-400 border border-[#FEDF89] font-medium text-[12px] px-2.5 py-0.5 rounded-full shadow-none",
    iconBgColor: "bg-[#F79009]",
    icon: Hourglass,
  },
}

const ICON_MAP: Record<string, React.ElementType> = {
  FileText: FileText,
  Check: Check,
  Clock: Clock,
}

interface AssignedTasksListProps {
  tasks: Task[]
  filter?: string
  className?: string
}

export function AssignedTasksList({
  tasks,
  filter,
  className,
}: AssignedTasksListProps) {
  // Apply filter if provided
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const BASE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL
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
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-gray-400">
          No tasks found for the selected filter.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 mt-6", className)}>
      {Object.entries(grouped).map(([category, categoryTasks]) => {
        return (
          <Card key={category} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 bg-white dark:bg-slate-950 p-0 gap-0">
            <CardHeader className="px-6 pt-6 pb-0 border-none">
              <CardTitle className="text-lg font-bold text-slate-900 tracking-tight dark:text-gray-100 font-sans">
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {categoryTasks.map((task) => {
                  const statusConfig = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending
                  const StatusIcon = task.icon ? (ICON_MAP[task.icon] || statusConfig.icon) : statusConfig.icon
                  const bgClass = task.iconColor || statusConfig.iconBgColor
                  

                  return (
                    <Card key={task.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 transition-shadow hover:shadow-md p-0 gap-0 py-0 w-full md:max-w-[570px]">
                      <CardContent className="p-5 pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className={cn("flex size-10 shrink-0 items-center justify-center text-white rounded-[12px]", bgClass)}>
                              <StatusIcon className="size-6" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col pt-0.5 min-w-0">
                              <h4 className="font-bold text-base text-slate-900 dark:text-gray-100 leading-tight ">{task.title}</h4>
                              <span className="text-xs text-[#667085] mt-1.5 font-medium dark:text-gray-400 leading-none ">{task?.description || "No description available"}</span>
          
                              {task.attachment && (<span className="text-xs text-[#667085] mt-1.5 font-medium dark:text-gray-400 leading-none truncate">
                               Document:<button
                               onClick={() => {
                               setPdfUrl(`${task?.attachment}`)
                               setIsOpen(true)
                                }}
                            className="text-blue-600 underline hover:text-blue-800 transition-colors"
                            >
                            View
                            </button>
                            </span>)}
                              <div className="mt-3.5 flex items-center gap-1.5 text-xs font-medium text-[#475467] whitespace-nowrap dark:text-gray-400 overflow-hidden text-ellipsis">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span className="">{task.dueDate ? `Due by ${task.dueDate}` : task.completedDate ? `Completed on ${task.completedDate}` : "No due date"}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className={cn("shrink-0", statusConfig.badgeClass)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardContent>

                      <div className="mx-5 my-4.5 h-[1px] bg-slate-100 dark:bg-slate-800" />

                      <CardFooter className="px-5 pb-5 pt-0 justify-end">
                        {(task.status === "action_required" || task.status === "pending") ? (
                          <button 
                          onClick={() => {
                            if (task.redirectUrl) {
                              router.push(`${task.redirectUrl}`)
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#2E90FA] hover:text-[#2E90FA]/80 transition-colors">
                            Complete now <ArrowRight className="h-3.5 w-3.5 mt-[1px]" />
                          </button>
                        ) : (
                          <button
                          onClick={() => {
                            if (task.redirectUrl) {
                              const targetUrl = task.redirectUrl.startsWith('/')
                                ? task.redirectUrl
                                : `${task.redirectUrl}`;
                              window.location.href = targetUrl;
                            }
                          }}
                           className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#2E90FA] hover:text-[#2E90FA]/80 transition-colors">
                            View Details <ArrowRight className="h-3.5 w-3.5 mt-[1px]" />
                          </button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg w-[80%] h-[80%] p-8 relative">
      
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-1 right-3 text-gray-500"
      >
        ✕
      </button>

      {pdfUrl ? (
        <iframe
         src={`${BASE_URL}${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
         className="w-full h-full bg-white"
         />
      ):(
        <p className="text-center text-gray-500 mt-10">No document available</p>
      )}
    </div>
  </div>
)}
    </div>
  )
}
