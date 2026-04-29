"use client"

import { useState } from "react"
import {
  Info,
  ChevronRight,
  Trash2,
  X,
  Building2,
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppliedJobsTimeline } from "@/components/my-jobs/applied-jobs-timeline"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/contexts/auth-context"
import { useApplicantStatus } from "@/lib/hooks/useApplicantStatus"

// Mock data for draft applications (no API for drafts yet)
interface DraftApplication {
  id: string
  jobTitle: string
  company: string
  location: string
  experience: string
  jobType: string
  progress: number
}

const MOCK_DRAFTS: DraftApplication[] = [
  {
    id: "d1",
    jobTitle: "Product Designer",
    company: "Physics Wallah",
    location: "Bangalore, Karnataka, India",
    experience: "2-4 Years",
    jobType: "Full Time",
    progress: 60,
  },
]

export default function MyJobsPage() {
  const { user } = useAuth()
  const userEmail = user?.email || user?.user_metadata?.email || ""
  const { data: response, isLoading, error } = useApplicantStatus(userEmail)

  const apiData = response?.data

  const [activeTab, setActiveTab] = useState<"applied" | "drafts">("applied")
  const [filter, setFilter] = useState("active")
  const [infoBannerVisible, setInfoBannerVisible] = useState(true)

  // Derive applied count from API applications array
  const appliedCount = apiData?.applications?.length ?? 0
  const draftCount = MOCK_DRAFTS.length

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your jobs, tasks, and requests, all in one place.
        </p>
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
            "relative flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors",
            activeTab === "applied"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("applied")}
        >
          Applied Jobs
          {appliedCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">
              {appliedCount}
            </Badge>
          )}
          {activeTab === "applied" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>

        <button
          className={cn(
            "relative flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors",
            activeTab === "drafts"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("drafts")}
        >
          Draft Applications
          {draftCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">
              {draftCount}
            </Badge>
          )}
          {activeTab === "drafts" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Applied Jobs Tab */}
      {activeTab === "applied" && (
        <div className="space-y-4">
          {/* Filter */}
          <div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Active Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Jobs</SelectItem>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading state */}
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              Loading your applications…
            </p>
          )}

          {/* Error state */}
          {error && (
            <p className="text-sm text-destructive">
              Could not load applications: {(error as Error).message}
            </p>
          )}

          {/* Empty state */}
          {!isLoading && !error && appliedCount === 0 && (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No applications yet. Start browsing open jobs to apply.
              </p>
            </div>
          )}

          {/* Applications list — pass full apiData down */}
          {!isLoading && !error && apiData && apiData.applications.length > 0 && (
            <AppliedJobsTimeline
              applicantName={apiData.name}
              applications={apiData.applications}
            />
          )}
        </div>
      )}

      {/* Draft Applications Tab */}
      {activeTab === "drafts" && (
        <div className="space-y-4">
          {MOCK_DRAFTS.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No draft applications. When you start an application without
                finishing, it will appear here.
              </p>
            </div>
          ) : (
            MOCK_DRAFTS.map((draft) => (
              <Card key={draft.id} className="shadow-sm">
                <CardContent className="space-y-4">
                  {/* Job info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {draft.jobTitle}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {draft.company}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {draft.location}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {draft.experience}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          {draft.jobType}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-orange-600">
                      {draft.progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Application Progress
                    </p>
                    <Progress
                      value={draft.progress}
                      className="h-2 [&>div]:bg-orange-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button className="inline-flex items-center gap-1 text-sm text-destructive hover:underline">
                      <Trash2 className="h-3.5 w-3.5" />
                      Discard Draft
                    </button>
                    <Button size="sm" className="gap-1">
                      Resume Application
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}