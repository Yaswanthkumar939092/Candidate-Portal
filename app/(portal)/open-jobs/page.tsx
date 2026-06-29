"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SmartCareerMatch,
  type MatchedJob,
} from "@/components/jobs/smart-career-match";
import { JobMatchCard } from "@/components/jobs/job-match-card";
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog";
import { cn } from "@/lib/utils";
import { useJobOpening } from "@/lib/hooks/useJobOpening";
import { CustomJobOpening, JobOpeningColumn } from "@/types/job";
import { useAuth } from "@/lib/contexts/auth-context";
import { useGetSavedJobs, useToggleSavedJob } from "@/lib/hooks/useSavedJobs";
import { toast } from "sonner";

type PageState = "upload" | "analyzing" | "results";

const JOBS_PER_PAGE = 5;

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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 hover:cursor-pointer rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
      >
        ‹ Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            "h-9 w-9 rounded-full  text-sm font-medium transition-colors",
            page === currentPage
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted cursor-pointer",
          )}
        >
          {page}
        </button>
      ))}

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

  const { data: jobOpeningsResponse } = useJobOpening({
    page: currentPage,
    limit: JOBS_PER_PAGE,
    searchTerm: debouncedSearch || undefined,
  });
  const jobOpenings = jobOpeningsResponse?.openings || [];
  const jobColumns = jobOpeningsResponse?.columns || [];

  const [activeTab, setActiveTab] = useState<"smart-match" | "view-all">(
    "smart-match",
  );

  const [pageState, setPageState] = useState<PageState>("upload");
  const [applyFormOpen, setApplyFormOpen] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchedJob[]>([]);
  const { user } = useAuth();
  const userEmail = user?.email || user?.user_metadata?.email || "";
  const { data: savedJobsResponse } = useGetSavedJobs(userEmail);
  const savedJobIdsList = savedJobsResponse?.saved_job_openings || [];
  const toggleSavedJobMutation = useToggleSavedJob();

  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);

  // filters state
  const [searchText, setSearchText] = useState("");
  const [jobType, setJobType] = useState("all");

  // Detail dialog
  const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAnalysisComplete = useCallback((results: MatchedJob[]) => {
    setMatchResults(results);
    setPageState("results");
  }, []);

  const handleBookmark = (jobId: string) => {
    if (!userEmail) {
      toast.error("Please log in to save jobs");
      return;
    }
    toggleSavedJobMutation.mutate(
      { email: userEmail, jobId },
      {
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

  const handleViewDetails = (job: MatchedJob) => {
    setSelectedJob(job);
    setDialogOpen(true);
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

  const handleJobTypeChange = (val: string) => {
    setJobType(val);
    setCurrentPage(1);
  };

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
        .map((col) => ({
          label: col.label,
          value: String(opening[col.value_key] ?? ""),
        }))
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

  const savedJobs = matchResults.filter((job) =>
    savedJobIdsList.includes(job.id),
  );

  // Total pages from API response
  // Adjust the key (total_pages / pageCount / etc.) to match your API shape
  const totalPages =
    mappedJobs.length < JOBS_PER_PAGE ? currentPage : currentPage + 1;

  // 🔍 CLIENT-SIDE FILTER — search is now server-side, only status filter remains client-side
  const filteredJobs = useMemo(() => {
    return mappedJobs.filter((job) => {
      const matchesType =
        jobType === "all" || job.type?.toLowerCase() === jobType;

      return matchesType;
    });
  }, [mappedJobs, jobType]);

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
          {filteredJobs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No open jobs found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <JobMatchCard
                    key={job.id}
                    job={job}
                    columnFields={openingColumnData.get(job.id)}
                    isBookmarked={savedJobIdsList.includes(job.id)}
                    onBookmark={() => handleBookmark(job.id)}
                    onViewDetails={() => handleViewDetails(job)}
                  />
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 0 && (
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

      {/* DRAWER */}
      <Sheet open={savedDrawerOpen} onOpenChange={setSavedDrawerOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Saved Jobs ({savedJobs.length})</SheetTitle>
          </SheetHeader>

          {savedJobs.map((job) => (
            <Card key={job.id}>
              <CardContent>
                <h4>{job.title}</h4>
                <Button onClick={() => handleViewDetails(job)}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </SheetContent>
      </Sheet>

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
        onApply={setApplyFormOpen}
      />
    </div>
  );
}
