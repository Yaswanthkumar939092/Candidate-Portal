"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CtcProposalView from "@/components/ctc-proposal/CtcProposalView";
import { PublicShell } from "@/components/direct-applicant-form/PublicShell";

// The emailed CTC proposal link: /ctc-proposal?t=<token>. No login — the token
// is the candidate's access (recruitment.api.ctc_proposal_portal).
function Content() {
  const searchParams = useSearchParams();
  return <CtcProposalView access={{ token: searchParams.get("t") || "" }} />;
}

export default function CtcProposalLinkPage() {
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
