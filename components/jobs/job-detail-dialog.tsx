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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation"; 

interface JobDetailDialogProps {
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
    description?: string;
    requirements?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (open: boolean) => void;
  openApplyForm?: boolean;
}

/**
 * Full dialog showing job details with a "Why you're a match" section,
 * job description, requirements list, and Cancel/Apply action buttons.
 *
 * @param job - The job object with detail fields
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to toggle dialog
 * @param onApply - Callback when user clicks Apply
 */
export function JobDetailDialog({
  job,
  open,
  onOpenChange,
  onApply,
}: JobDetailDialogProps) {
  if (!job) return null;
  const router = useRouter();

  const requirements = job.requirements ?? [
    "5+ years of product design experience",
    "Strong portfolio demonstrating user-centered design process",
    "Proficiency in Figma, Sketch, or similar design tools",
    "Experience with Design Systems, Prototyping",
    "Excellent communication skills",
    "Bachelor's degree in relevant field",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
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
              {job.experience}
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              {job.salary}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Why you're a match */}
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Why you&apos;re a match
            </h4>
            <span className="text-sm font-bold text-primary">
              {job.matchPercentage}%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your resume matches key requirements for this role in{" "}
            <span className="font-medium">Figma</span>,{" "}
            <span className="font-medium">Product Strategy</span>, and{" "}
            <span className="font-medium">UX/UI</span>.
          </p>
        </div>

        <Separator />

        {/* Job Description */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Job Description
          </h4>
          <div
            className="list-disc space-y-1 pl-5 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: job.description || "" }}
          />
        </div>

        {/* Requirements */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Requirements
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
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
