"use client";

import {
  MapPin,
  Building2,
  Clock,
  IndianRupee,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface JobDetailDialogProps {
  job: {
    upper_range: number | string | null;
    lower_range: number | string | null;
    custom_qualifications: string[];
    id: string;
    title: string;
    company: string;
    location: string;
    experience: string;
    salary: string;
    type: string;
    skills: string[];
    matchPercentage: number;
    description?: string;
    requirements?: string[];
    applied?: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (open: boolean) => void;
  openApplyForm?: boolean;
}

/**
 * @param job - The job object with detail fields
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to toggle dialog
 * @param onApply - Callback when user clicks Apply
 */
export function JobDetailDialog({
  job,
  open,
  onOpenChange,
}: JobDetailDialogProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg md:max-w-3xl w-full lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{job.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {job.type}
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {job.lower_range || 0} - {job.upper_range} LPA
            </span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Job Description */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Job Description
          </h4>
          <>
            <style>{`
    .ql-editor li[data-list="bullet"] {
      list-style-type: disc;
      margin-left: 1.25rem;
     
    }

    .ql-editor li[data-list="ordered"] {
      list-style-type: decimal;
      margin-left: 1.25rem;
     
    }

    .ql-editor .ql-ui {
      display: none;
    }

    .ql-editor ol,
    .ql-editor ul {
      padding-left: 1.25rem;
    }

    .ql-editor h1,
    .ql-editor h2,
    .ql-editor h3,
    .ql-editor h4,
    .ql-editor h5,
    .ql-editor h6 {
      font-weight: bold;
    }
  `}</style>

            <div
              className="ql-editor prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: job.description || "" }}
            />
          </>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {job.applied ? (
            <Button size="sm" asChild className="gap-1">
              <Link href="/my-jobs">
                Applied
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" asChild className="hover:cursor-pointer gap-1 ">
              <Link href={`/open-jobs/${job.id}/apply-job`}>
                Apply
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
