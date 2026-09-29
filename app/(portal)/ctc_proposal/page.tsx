"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CtcProposalView from "@/components/ctc-proposal/CtcProposalView";

// Opened from the Action Center card of a "CTC Proposal":
// /ctc_proposal?proposal=<CTC Proposal name>.
function CtcProposalContent() {
  const searchParams = useSearchParams();
  return <CtcProposalView access={{ proposal: searchParams.get("proposal") || "" }} />;
}

export default function CtcProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CtcProposalContent />
    </Suspense>
  );
}
