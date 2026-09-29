"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import DirectApplicantForm from "@/components/direct-applicant-form/DirectApplicantForm";

// Opened from the Action Center card of a "Direct Applicant Form Request":
// /direct_applicant_form?request=<Form Request name>.
function DirectApplicantFormContent() {
  const searchParams = useSearchParams();
  return <DirectApplicantForm access={{ request: searchParams.get("request") || "" }} />;
}

export default function DirectApplicantFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DirectApplicantFormContent />
    </Suspense>
  );
}
