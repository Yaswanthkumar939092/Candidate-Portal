"use client";

import { useState } from "react";
import {
  ChevronRight,
  Trash2,
  Building2,
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppliedJobsTimeline } from "@/components/my-jobs/applied-jobs-timeline";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth-context";
import { useApplicantStatus } from "@/lib/hooks/useApplicantStatus";
import {
  useGetAllDrafts,
  useDeleteDraftJobApplicant,
} from "@/lib/hooks/useJobOpening";
import { useGetSavedJobs, useToggleSavedJob } from "@/lib/hooks/useSavedJobs";
import { JobMatchCard } from "@/components/jobs/job-match-card";
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import Link from "next/link";

// Mock data for draft applications removed in favor of real API

export default function MyJobsPage() {
  const { user } = useAuth();
  const userEmail = user?.email || user?.user_metadata?.email || "";
  const { data: response, isLoading, error } = useApplicantStatus(userEmail);
  const {
    data: draftsResponse,
    isLoading: isLoadingDrafts,
    refetch: refetchDrafts,
  } = useGetAllDrafts(userEmail);
  const { mutate: deleteDraft, isPending: isDeletingDraft } =
    useDeleteDraftJobApplicant();

  const apiData = response?.data;
  const drafts = draftsResponse?.data || [];

  const { data: savedJobsResponse, isLoading: isLoadingSaved } =
    useGetSavedJobs(userEmail);
  const savedJobsDetails = savedJobsResponse?.saved_job_openings || [];

  const toggleSavedJobMutation = useToggleSavedJob();

  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyFormOpen, setApplyFormOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"applied" | "drafts" | "saved">(
    "applied",
  );

  // Derive applied count from API applications array
  const appliedCount = apiData?.applications?.length ?? 0;
  const draftCount = drafts.length;
  const savedCount = savedJobsDetails.length;

  const handleDeleteDraft = (jobId: string) => {
    deleteDraft(
      { email: userEmail, jobId },
      {
        onSuccess: () => {
          toast.success("Draft application discarded");
          refetchDrafts();
        },
        onError: () => {
          toast.error("Failed to discard draft");
        },
      },
    );
  };

  const handleBookmark = (jobId: string) => {
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

  const handleViewDetails = (job: any) => {
    setSelectedJob({
      id: job.name,
      title: job.job_title || job.designation,
      company: job.company,
      location: job.location || job.custom_location || "Not specified",
      type: job.employment_type || "full-time",
      experience: job.custom_work_experience,
      lower_range: job.lower_range,
      upper_range: job.upper_range,
      description: job.description,
      status: job.status,
    });
    setDialogOpen(true);
  };

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

      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-border">
        <button
          className={cn(
            "relative flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors",
            activeTab === "applied"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("applied")}
        >
          Applied Jobs
          {appliedCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-5 px-1.5 text-[10px]"
            >
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
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("drafts")}
        >
          Draft Applications
          {draftCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-5 px-1.5 text-[10px]"
            >
              {draftCount}
            </Badge>
          )}
          {activeTab === "drafts" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>

        <button
          className={cn(
            "relative flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors",
            activeTab === "saved"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("saved")}
        >
          Saved Jobs
          {savedCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-5 px-1.5 text-[10px]"
            >
              {savedCount}
            </Badge>
          )}
          {activeTab === "saved" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Applied Jobs Tab */}
      {activeTab === "applied" && (
        <div className="space-y-4">
          {/* Filter */}

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
            <EmptyState
              title="No Applications Yet"
              description="No applications yet. Start browsing open jobs to apply."
            />
          )}

          {/* Applications list — pass full apiData down */}
          {!isLoading &&
            !error &&
            apiData &&
            apiData.applications.length > 0 && (
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
          {isLoadingDrafts ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Loading draft applications...
            </p>
          ) : drafts.length === 0 ? (
            <EmptyState
              title="No Draft Applications"
              description="No draft applications. When you start an application without finishing, it will appear here."
            />
          ) : (
            drafts.map((draft: any) => (
              <Card key={draft.name} className="shadow-sm">
                <CardContent className="space-y-4">
                  {/* Job info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {draft.job_title || draft.job_opening}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {draft.company && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {draft.company}
                          </span>
                        )}
                        {draft.location && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {draft.location}
                          </span>
                        )}
                        {draft.experience && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {draft.experience}
                          </span>
                        )}
                        {draft.employment_type && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            {draft.employment_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress percentage */}
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {draft.progress?.percentage || 0}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Application Progress
                    </p>
                    <Progress
                      value={draft.progress?.percentage || 0}
                      className="h-2"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDraft(draft.job_opening)}
                      disabled={isDeletingDraft}
                      className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive focus:ring-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Discard Draft
                    </Button>
                    <Button size="sm" className="gap-1" asChild>
                      <Link href={`/open-jobs/${draft.job_opening}/apply-job`}>
                        Resume Application
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Saved Jobs Tab */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {isLoadingSaved ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Loading saved jobs...
            </p>
          ) : savedJobsDetails.length === 0 ? (
            <EmptyState
              title="No Saved Jobs"
              description="No saved jobs. Start browsing open jobs to save opportunities."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedJobsDetails.map((job: any) => {
                const postedDate = job.posted_on
                  ? new Date(job.posted_on).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "";
                const columnFields = [
                  { label: "Designation", value: job.designation },
                  { label: "Department", value: job.department },
                  { label: "Company", value: job.company },
                  {
                    label: "Location",
                    value:
                      job.location || job.custom_location || "Not specified",
                  },
                  { label: "Posted On", value: postedDate },
                  { label: "Status", value: job.status },
                ].filter((f) => f.value);
                const mappedJob = {
                  id: job.name,
                  title: job.job_title || job.designation,
                  company: job.company,
                  location:
                    job.location || job.custom_location || "Not specified",
                  type: job.employment_type || "full-time",
                  experience: job.custom_work_experience,
                  salary:
                    job.lower_range && job.upper_range
                      ? `${job.lower_range} - ${job.upper_range} LPA`
                      : "",
                  skills: job.skills ? job.skills.map((s: any) => s.skill) : [],
                  matchPercentage: 0,
                };
                return (
                  <JobMatchCard
                    key={job.name}
                    job={mappedJob}
                    columnFields={columnFields}
                    isBookmarked={true}
                    onBookmark={() => handleBookmark(job.name)}
                    onViewDetails={() => handleViewDetails(job)}
                  />
                );
              })}
            </div>
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
                salary: `${selectedJob.lower_range || 0} - ${selectedJob.upper_range || 0} LPA`,
                skills: selectedJob.skills || [],
                matchPercentage: selectedJob.matchPercentage || 0,
              }
            : null
        }
      />
    </div>
  );
}
