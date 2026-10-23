"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResumeDropzone } from "@/components/careers/resume-dropzone";

export default function AiMatchPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Resume / Job Match</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume and our AI matches it with suitable open jobs. Even if nothing fits today, recruiters can
          find you as an unassigned candidate.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="px-5 py-5">
          <ResumeDropzone />
        </CardContent>
      </Card>
    </div>
  );
}
