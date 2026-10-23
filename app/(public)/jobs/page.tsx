"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { JobDetailDialog } from "@/components/jobs/job-detail-dialog";
import { JobMatchCard } from "@/components/jobs/job-match-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeDropzone } from "@/components/careers/resume-dropzone";
import { toCardJob, toColumnFields } from "@/components/careers/job-mapping";
import { loginHref } from "@/lib/careers/login-redirect";
import { matchesQuery } from "@/lib/careers/openings";
import { usePublicOpenings } from "@/lib/hooks/usePublicOpenings";
import type { PublicOpening } from "@/types/public-job";

const GROUPS = [
  { value: "normal", title: "Normal Jobs", subtitle: "Time-limited and specific vacancies.", evergreen: false },
  { value: "evergreen", title: "Evergreen Jobs", subtitle: "Always live, for ongoing and bulk hiring.", evergreen: true },
];

export default function PublicJobsPage() {
  const router = useRouter();
  const { data: openings, isLoading, isError, refetch } = usePublicOpenings();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PublicOpening | null>(null);
  const [tab, setTab] = useState<string | null>(null);

  const results = useMemo(() => (openings ?? []).filter((o) => matchesQuery(o, query)), [openings, query]);
  const searching = query.trim().length > 0;
  const noMatch = !!openings && results.length === 0;
  // Until the visitor picks a tab, open the first one that has jobs.
  const activeTab = tab ?? (results.some((o) => !o.evergreen) || results.length === 0 ? "normal" : "evergreen");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Open Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse every active role. You only need to log in when you apply.
        </p>
      </div>

      <div className="relative md:max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search jobs"
          placeholder="Search by job title, location, department..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="rounded-2xl border bg-card p-6 text-center text-sm">
          <p className="text-muted-foreground">We couldn&apos;t load the open jobs.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 font-medium text-primary hover:underline">
            Try again
          </button>
        </div>
      )}

      {noMatch && (
        <section className="rounded-2xl border bg-card p-6" aria-label="No matching jobs">
          <h2 className="text-lg font-semibold">
            {searching ? `No jobs found for “${query.trim()}”` : "No open jobs right now"}
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Drop your resume and our recruiters will reach out when a suitable role opens.
          </p>
          <ResumeDropzone title="Put your resume here" />
        </section>
      )}

      {results.length > 0 && (
        <Tabs value={activeTab} onValueChange={setTab} className="gap-4">
          {/* Same underline tab bar as My Jobs (Applied / Drafts / Saved). */}
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
            {GROUPS.map((group) => (
              <TabsTrigger
                key={group.value}
                value={group.value}
                className="group relative h-auto flex-none gap-1.5 rounded-none border-0 bg-transparent px-0 pb-2.5 pt-0 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:ring-0 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-0 dark:data-[state=active]:bg-transparent"
              >
                {group.title}
                <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">
                  {results.filter((o) => o.evergreen === group.evergreen).length}
                </Badge>
                <span className="absolute bottom-0 left-0 right-0 hidden h-0.5 bg-foreground group-data-[state=active]:block" />
              </TabsTrigger>
            ))}
          </TabsList>
          {GROUPS.map((group) => {
            const jobs = results.filter((o) => o.evergreen === group.evergreen);
            return (
              <TabsContent key={group.value} value={group.value} className="space-y-3">
                <p className="text-sm text-muted-foreground">{group.subtitle}</p>
                {jobs.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                    No {group.title.toLowerCase()} {searching ? "match your search" : "are open right now"}.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map((opening) => (
                      <JobMatchCard
                        key={opening.id}
                        job={toCardJob(opening)}
                        columnFields={toColumnFields(opening)}
                        onViewDetails={() => setSelected(opening)}
                        onBookmark={() => router.push(loginHref("/open-jobs"))}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {results.length > 0 && (
        <section className="rounded-2xl border bg-card p-6" aria-label="Resume drop">
          <h2 className="text-lg font-semibold">Can&apos;t find the right role?</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Put your resume here and recruiters can match you to a job.
          </p>
          <ResumeDropzone title="Put your resume here" />
        </section>
      )}

      <JobDetailDialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        job={selected ? toCardJob(selected) : null}
        applyHref={selected ? loginHref(`/open-jobs/${selected.id}/apply-job`) : undefined}
      />
    </div>
  );
}
