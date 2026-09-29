"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import DirectApplicantForm from "@/components/direct-applicant-form/DirectApplicantForm";
import { PublicShell } from "@/components/direct-applicant-form/PublicShell";

// The emailed form link: /direct-applicant-form?t=<token>. No login — the token
// is the candidate's access (recruitment.api.direct_applicant_portal).
function Content() {
  const searchParams = useSearchParams();
  return <DirectApplicantForm access={{ token: searchParams.get("t") || "" }} />;
}

export default function DirectApplicantFormLinkPage() {
  return (
    <PublicShell>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <Content />
      </Suspense>
    </PublicShell>
  );
}
