"use client";

import {
  MapPin,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  Building2,
  IndianRupee,
  Info,
  Check,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JobMatchCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    experience: string;
    salary: string;
    type: string;
    skills: string[];
    matchPercentage: number;
    applied?: boolean;
  };
  /** Column-driven fields from the API (label + value pairs). When provided, these are rendered instead of hardcoded fields. */
  columnFields?: Array<{ label: string; value: string }>;
  onViewDetails?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  isBookmarkPending?: boolean;
  className?: string;
}

/** Map well-known column labels to icons for richer UI */
const COLUMN_ICONS: Record<string, React.ElementType> = {
  Company: Building2,
  Location: MapPin,
  Department: Briefcase,
  Designation: Briefcase,
};

/**
 * Displays a job match result card with company info tags, skill pills,
 * a "View Details" button, and a bookmark icon.
 *
 * @param job - The job object containing title, company, location, experience, salary, type, skills, matchPercentage
 * @param columnFields - Optional API-driven column fields to render
 * @param onViewDetails - Callback when user clicks "View Details"
 * @param onBookmark - Callback when user toggles the bookmark
 * @param isBookmarked - Whether the job is currently bookmarked
 */
export function JobMatchCard({
  job,
  columnFields,
  onViewDetails,
  onBookmark,
  isBookmarked = false,
  isBookmarkPending = false,
  className,
}: JobMatchCardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md h-full", className)}>
      <CardContent className="flex flex-col h-full space-y-3">
        <div className="flex-1 space-y-3">
          {/* Title + Match Percentage */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              {job.title}
            </h3>
            {job.matchPercentage > 0 && (
              <Badge
                variant="secondary"
                className="shrink-0 border-transparent bg-primary/10 text-primary"
              >
                {job.matchPercentage}%
              </Badge>
            )}
          </div>

          {/* Info tags — API-driven when columnFields are available */}
          <div className="flex flex-wrap items-center gap-2">
            {columnFields && columnFields.length > 0 ? (
              columnFields.map((field) => {
                const IconComp = COLUMN_ICONS[field.label] || Info;
                return (
                  <span
                    key={field.label}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    <IconComp className="h-3 w-3" />
                    {field.value}
                  </span>
                );
              })
            ) : (
              <>
                {job.company && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {job.company}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                {job.experience && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {job.experience}
                  </span>
                )}
                {job.salary && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <IndianRupee className="h-3 w-3" />
                    {job.salary}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Skills */}
          {Array.isArray(job.skills) && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
          >
            View Details
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={isBookmarkPending}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.();
              }}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark job"}
            >
              {isBookmarkPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            {job.applied && (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Applied"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
