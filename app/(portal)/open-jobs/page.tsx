"use client"

import { useState, useCallback } from "react"
import {
  Search,
  LayoutGrid,
  MapPin,
  Briefcase,
  Loader2,
  Bookmark,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  SmartCareerMatch,
  type MatchedJob,
} from "@/components/jobs/smart-career-match"
import { JobMatchCard } from "@/components/jobs/job-match-card"
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog"
import { cn } from "@/lib/utils"

type PageState = "upload" | "analyzing" | "results"

/**
 * Open Jobs page with two tabs:
 * - Smart Career Match: AI-powered resume matching (upload -> analyzing -> results)
 * - View All: Browse all open jobs
 */
export default function OpenJobsPage() {
  const [activeTab, setActiveTab] = useState<"smart-match" | "view-all">(
    "smart-match"
  )
  const [pageState, setPageState] = useState<PageState>("upload")
  const [matchResults, setMatchResults] = useState<MatchedJob[]>([])
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false)

  // Detail dialog state
  const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleAnalysisComplete = useCallback((results: MatchedJob[]) => {
    setMatchResults(results)
    setPageState("results")
  }, [])

  const handleBookmark = (jobId: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const handleViewDetails = (job: MatchedJob) => {
    setSelectedJob(job)
    setDialogOpen(true)
  }

  const savedJobs = matchResults.filter((job) => savedJobIds.has(job.id))

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Open Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find opportunities that match your skills within the organization.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          className={cn(
            "relative pb-2.5 text-sm font-medium transition-colors",
            activeTab === "smart-match"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("smart-match")}
        >
          Smart Career Match
          {activeTab === "smart-match" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          className={cn(
            "relative pb-2.5 text-sm font-medium transition-colors",
            activeTab === "view-all"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("view-all")}
        >
          View All
          {activeTab === "view-all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Smart Career Match Tab */}
      {activeTab === "smart-match" && (
        <div>
          {pageState === "upload" && (
            <Card className="shadow-sm">
              <CardContent>
                <SmartCareerMatch onAnalysisComplete={handleAnalysisComplete} />
              </CardContent>
            </Card>
          )}

          {pageState === "analyzing" && (
            <Card className="shadow-sm">
              <CardContent>
                <SmartCareerMatch onAnalysisComplete={handleAnalysisComplete} />
              </CardContent>
            </Card>
          )}

          {pageState === "results" && (
            <div className="space-y-6">
              {/* Top Results header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Top Results
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSavedDrawerOpen(true)}
                >
                  <Bookmark className="h-4 w-4" />
                  Saved Jobs ({savedJobs.length})
                </Button>
              </div>

              {/* Results grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matchResults.map((job) => (
                  <JobMatchCard
                    key={job.id}
                    job={job}
                    isBookmarked={savedJobIds.has(job.id)}
                    onBookmark={() => handleBookmark(job.id)}
                    onViewDetails={() => handleViewDetails(job)}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>
                  Powered by <span className="font-semibold">AI</span>
                </span>
                <span>&middot;</span>
                <button className="text-primary hover:underline">
                  Privacy Policy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View All Tab */}
      {activeTab === "view-all" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, company, or keyword..."
                className="pl-9"
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Location"
                className="w-full pl-9 sm:w-40"
              />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-44">
                <Briefcase className="mr-1 h-4 w-4" />
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No open jobs found. Try adjusting your filters.
            </p>
          </div>
        </div>
      )}

      {/* Saved Jobs Drawer */}
      <Sheet open={savedDrawerOpen} onOpenChange={setSavedDrawerOpen}>
        <SheetContent side="right" className="w-95 sm:max-w-95">
          <SheetHeader>
            <SheetTitle>Saved Jobs ({savedJobs.length})</SheetTitle>
            <SheetDescription className="sr-only">
              Your bookmarked jobs
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {savedJobs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No saved jobs yet. Bookmark jobs to see them here.
              </p>
            ) : (
              savedJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="space-y-2 p-4">
                    <h4 className="text-sm font-semibold text-foreground">
                      {job.title}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {job.company}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {job.location}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewDetails(job)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Job Detail Dialog */}
      <JobDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={selectedJob}
        onApply={() => {
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
