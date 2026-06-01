"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PreOfferProvider } from "@/lib/contexts/pre-offer-context";
import PreOfferForm from "@/components/pre-offer-form/PreOfferForm";
import { Loader2 } from "lucide-react";

function PreOfferContent() {
  const searchParams = useSearchParams();

  // Get applicant ID from query params (appl or job_applicant)
  const jobApplicant = searchParams.get("appl") || searchParams.get("job_applicant") || "";

  return (
    <PreOfferProvider applicantId={jobApplicant}>
      <PreOfferForm />
    </PreOfferProvider>
  );
}

export default function PreOfferFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PreOfferContent />
    </Suspense>
  );
}
