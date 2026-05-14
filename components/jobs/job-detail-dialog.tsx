/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { MapPin, Building2, Clock, IndianRupee } from "lucide-react";
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
import { useRouter } from "next/navigation";

interface JobDetailDialogProps {
  job: {
    upper_range: string | null;
    lower_range: string | null;
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
  const router = useRouter();

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
          <div
  className="prose prose-sm max-w-none text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
  dangerouslySetInnerHTML={{ __html: job.description || "" }}
/>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push(`/open-jobs/${job.id}/apply-job`);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
