"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  SmartCareerMatch,
  type MatchedJob,
} from "@/components/jobs/smart-career-match";
import { JobMatchCard } from "@/components/jobs/job-match-card";
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog";
import { cn, formatDateDDMMYYYY } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobOpening } from "@/lib/hooks/useJobOpening";
import { useToggleSavedJob } from "@/lib/hooks/useSavedJobs";
import { useAuth } from "@/lib/contexts/auth-context";
import { CustomJobOpening } from "@/types/job";
import { toast } from "sonner";


const JOBS_PER_PAGE = 6;

// ---------------------------------------------------------------------------
// Pagination Component
// ---------------------------------------------------------------------------
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const MAX_VISIBLE = 5;

  const getVisiblePages = (): (number | "ellipsis-start" | "ellipsis-end")[] => {
    if (totalPages <= MAX_VISIBLE) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
    let end = start + MAX_VISIBLE - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - MAX_VISIBLE + 1;
    }

    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

    if (start > 1) pages.push("ellipsis-start");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("ellipsis-end");

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 hover:cursor-pointer rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
      >
        ‹ Previous
      </button>

      {visiblePages.map((page, idx) =>
        typeof page === "string" ? (
          <span
            key={page}
            className="h-9 w-9 flex items-center justify-center text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "h-9 w-9 rounded-full text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted cursor-pointer",
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 hover:cursor-pointer rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
      >
        Next ›
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function OpenJobsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<"smart-match" | "view-all">(
    "view-all",
  );

  const { user } = useAuth();
  const userEmail = user?.email || user?.user_metadata?.email || "";

  const { data: jobOpeningsResponse, isLoading } = useJobOpening({
    page: currentPage,
    limit: JOBS_PER_PAGE,
    searchTerm: debouncedSearch || undefined,
    email: userEmail || undefined,
    enabled: activeTab === "view-all",
  });
  const jobOpenings = useMemo(() => jobOpeningsResponse?.openings || [], [jobOpeningsResponse]);
  const jobColumns = useMemo(() => jobOpeningsResponse?.columns || [], [jobOpeningsResponse]);

  const [matchResults, setMatchResults] = useState<MatchedJob[]>([]);
  const toggleSavedJobMutation = useToggleSavedJob();
  const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);


  // filters state
  const [searchText, setSearchText] = useState("");

  // Detail dialog
  const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAnalysisComplete = useCallback((results: MatchedJob[]) => {
    setMatchResults(results);
  }, []);

  const handleViewDetails = (job: MatchedJob) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const handleBookmark = (jobId: string) => {
    if (!userEmail) {
      toast.error("Please log in to save jobs");
      return;
    }
    setPendingBookmarkId(jobId);
    toggleSavedJobMutation.mutate(
      { email: userEmail, jobId },
      {
        onSettled: () => setPendingBookmarkId(null),
        onSuccess: (data) => {
          if (data?.action === "saved") {
            toast.success("Job saved successfully");
          } else {
            toast.success("Job removed from saved list");
          }
        },
        onError: () => {
          toast.error("Failed to update saved job status");
        },
      },
    );
  };

  // Filter change handlers — also reset page to 1
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    // Debounce the search to avoid hammering the API on every keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);



  const mappedJobs: MatchedJob[] = useMemo(() => {
    const list = Array.isArray(jobOpenings) ? jobOpenings : [];

    return list.map((job: CustomJobOpening) => ({
      id: job.name,
      title: job.job_title || job.designation,
      company: job.company,
      location: job.location || "Not specified",
      type: job.employment_type || "full-time",
      experience: job.custom_work_experience || "",
      lower_range: job.lower_range ?? null,
      upper_range: job.upper_range ?? null,
      description: job.description,
      status: job.status,
      custom_qualifications: [],
      salary:
        job.custom_salary ||
        (job.lower_range && job.upper_range
          ? `${job.lower_range} - ${job.upper_range}`
          : "Not disclosed"),
      skills: job.skills_required ? job.skills_required.split(" ") : [],
      matchPercentage: 0,
      applied: job.applied,
      saved: job.saved,
    }));
  }, [jobOpenings]);

  // Build column metadata for each opening, extracting values via value_key.
  // Exclude 'name' (used as ID) and 'job_title' (already shown as card title).
  const openingColumnData = useMemo(() => {
    const displayColumns = jobColumns.filter(
      (col) => col.value_key !== "name" && col.value_key !== "job_title",
    );
    const map = new Map<string, Array<{ label: string; value: string }>>();
    const list = Array.isArray(jobOpenings) ? jobOpenings : [];
    list.forEach((opening: any) => {
      const fields = displayColumns
        .map((col) => {
          let val = String(opening[col.value_key] ?? "");
          if ((col.value_key === "posted_on" || col.value_key.toLowerCase().includes("date")) && val) {
            val = formatDateDDMMYYYY(val, "-");
          }
          return {
            label: col.label,
            value: val,
          };
        })
        .filter((f) => f.value !== "" && f.value !== "null");
      map.set(opening.name, fields);
    });
    return map;
  }, [jobColumns, jobOpenings]);

  // ✅ FIXED (boundary check added)
  const handlePageChange = (page: number) => {
    if (page < 1) return;
    if (mappedJobs.length < JOBS_PER_PAGE && page > currentPage) return;

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Total pages from API response
  const totalPages = jobOpeningsResponse?.pagination?.total_pages ?? 1;

  // 🔍 CLIENT-SIDE FILTER — search is now server-side, no local filtering needed
  const filteredJobs = useMemo(() => {
    return mappedJobs;
  }, [mappedJobs]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Open Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find opportunities that match your skills within the organization.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          className={cn(
            "relative pb-2.5 text-sm font-medium",
            activeTab === "smart-match"
              ? "text-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => setActiveTab("smart-match")}
        >
          Smart Career Match
        </button>

        <button
          className={cn(
            "relative pb-2.5 text-sm font-medium",
            activeTab === "view-all"
              ? "text-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => setActiveTab("view-all")}
        >
          View All
        </button>
      </div>

      {/* SMART MATCH */}
      {activeTab === "smart-match" && (
        <Card>
          <CardContent>
            <SmartCareerMatch onAnalysisComplete={handleAnalysisComplete} />
          </CardContent>
        </Card>
      )}

      {/* VIEW ALL */}
      {activeTab === "view-all" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative md:max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by job title, location, department..."
                className="pl-9"
                value={searchText}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* JOB LIST */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: JOBS_PER_PAGE }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-28 rounded-md" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title="No Open Jobs Found"
              description="No open jobs found. Try adjusting your filters."
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <JobMatchCard
                    key={job.id}
                    job={job}
                    columnFields={openingColumnData.get(job.id)}
                    isBookmarked={job.saved ?? false}
                    isBookmarkPending={pendingBookmarkId === job.id}
                    onBookmark={() => handleBookmark(job.id)}
                    onViewDetails={() => handleViewDetails(job)}
                  />
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      )}

      <JobDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={
          selectedJob
            ? {
                ...selectedJob,
                upper_range: selectedJob.upper_range || null,
                lower_range: selectedJob.lower_range || null,
                custom_qualifications: selectedJob.custom_qualifications || [],
                salary: `${selectedJob.lower_range || 0} - ${selectedJob.upper_range || 0}`,
                skills: selectedJob.skills || [],
                matchPercentage: selectedJob.matchPercentage || 0,
              }
            : null
        }
      />
    </div>
  );
}
