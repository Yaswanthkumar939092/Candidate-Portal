"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, ChevronDown, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/shared/circular-progress";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useJobOfferPdf, useJobOfferLetters, useJobOfferSummary } from "@/lib/hooks/useJobOffer";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Download the offer letter as a file. Fetches with credentials so cookies work. */
async function downloadPdf(url: string, filename = "Offer_Letter.pdf") {
  try {
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      return;
    }
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    toast.error("Could not download the offer letter. Please try again.");
  }
}

function openPdfPreview(url: string) {
  if (url.startsWith("data:")) {
    // For base64, open in an iframe in a new window or just write it
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

import { DashboardData } from "@/types/dashboard";

interface OnboardingSnapshotProps {
  /** Number of onboarding steps that have been completed. */
  completedSteps: number;
  /** Total number of onboarding steps (default: 8). */
  totalSteps?: number;
  /** ISO date string for the joining date. */
  joiningDate?: string;
  dashboardPayload?: DashboardData;
  className?: string;
}

/**
 * Formats an ISO date string into a human-friendly date like "September 8th".
 */
function formatJoiningDateLong(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  return `${month} ${day}${suffix}`;
}

/**
 * Onboarding snapshot card for the candidate dashboard.
 *
 * Renders a large card with a light gradient background showing onboarding
 * status, a contextual message, a circular progress indicator, and a
 * call-to-action button. The circular progress ring turns green when
 * onboarding reaches 100 percent, and shows primary blue otherwise.
 */
export function OnboardingSnapshot({
  completedSteps,
  totalSteps = 8,
  joiningDate,
  dashboardPayload,
  className,
}: OnboardingSnapshotProps) {
  const { profile } = useAuth();
  const { userEmail } = useCurrentUser();
  const { data: offerData } = useJobOfferSummary(userEmail || "");
  const isTraineeOrBoth = offerData?.employment_type === "Trainee" || offerData?.compensation_type === "both";

  const { data: lettersData, isLoading: isLettersLoading } = useJobOfferLetters(
    userEmail || "",
    true, // always fetch to check if multiple letters exist
  );

  const hasMultipleLetters = lettersData?.letters && lettersData.letters.length > 1;
  const isSeparate = hasMultipleLetters || isTraineeOrBoth;

  const { pdfUrl, isLoading: isPdfLoading } = useJobOfferPdf(
    userEmail || "",
    !isSeparate,
  );

  const isProfileActive = Boolean(profile);

  const form_completion = dashboardPayload?.form_completion;
  const onboardingStage = dashboardPayload?.onboarding_stage;

  const percentage =
    form_completion?.percentage != null
      ? Math.round(form_completion.percentage)
      : totalSteps > 0
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0;

  const isComplete =
    onboardingStage?.toLowerCase() === "onboarding complete" ||
    onboardingStage?.toLowerCase() === "complete" ||
    onboardingStage?.toLowerCase() === "completed" ||
    dashboardPayload?.onboarding_status === true ||
    percentage >= 100;

  const displayJoiningDate = dashboardPayload?.date_of_joining || joiningDate;
  return (
    <div
      className={cn(
        "space-y-4 border border-[#E5E7EB] rounded-3xl p-2 bg-white shadow-sm",
        className,
      )}
    >
      {/* Main onboarding card */}

      <div className="relative overflow-hidden rounded-xl bg-linear-to-b from-[#F0F9FF] to-[#E0F2FE]  p-6  sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left content */}
          <div className="flex-1 space-y-4">
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-bold uppercase tracking-wider shadow-[0_2px_10px_rgb(0,0,0,0.02)]",
                isComplete
                  ? "text-[#026AA2] border border-[#026AA2]/10"
                  : "text-gray-600 border border-gray-200",
              )}
            >
              {isComplete && <ShieldCheck className="h-4 w-4 text-[#12B76A]" />}
              {onboardingStage ||
                (isComplete ? "ONBOARDING COMPLETE" : "ONBOARDING IN PROGRESS")}
            </span>

            {/* Heading */}
            <h2 className="text-[30px] font-bold text-[#101828] leading-tight">
              {isComplete && displayJoiningDate
                ? `You are ready to join us on ${formatJoiningDateLong(displayJoiningDate)}!`
                : `${completedSteps} of ${totalSteps} steps completed`}
            </h2>

            {/* Subtext */}
            {/* <p className="max-w-xl text-[16px] font-normal text-[#475467]">
              {isComplete
                ? "All mandatory tasks and document submissions have been approved. We have prepared your workstation and access cards."
                : "Complete your onboarding tasks to get ready for your first day. Upload required documents and fill in your details."}
            </p> */}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="bg-black text-white font-semibold hover:bg-black/80 rounded-xl text-center"
              >
                <Link href="/onboarding">
                  {/* View Your Journey */}
                  Complete your onboarding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {isProfileActive && (
                <>
                  {isSeparate && lettersData?.letters && lettersData.letters.length > 1 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-black bg-transparent text-black hover:bg-black/10 hover:text-black rounded-xl font-semibold justify-center flex items-center gap-2"
                        >
                          Preview / Download Offer
                          <span className="flex items-center justify-center bg-black text-white text-[10px] font-bold h-5 w-5 rounded-full ml-1">
                            {lettersData.letters.length}
                          </span>
                          <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-slate-200">
                        {lettersData.letters.map((letter) => (
                          <div key={letter.index} className="flex items-center justify-between group px-2 py-1.5 hover:bg-slate-50 rounded-lg">
                            <DropdownMenuItem
                              className="flex-1 cursor-pointer font-medium p-2 text-sm"
                              onClick={() => {
                                const url = `data:application/pdf;base64,${letter.pdf_base64}`;
                                openPdfPreview(url);
                              }}
                            >
                              <span className="truncate">{letter.print_format}</span>
                            </DropdownMenuItem>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = `data:application/pdf;base64,${letter.pdf_base64}`;
                                downloadPdf(url, `${letter.filename || letter.print_format}.pdf`);
                              }}
                              title="Download"
                            >
                              <Download className="h-4 w-4 text-slate-500" />
                            </Button>
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      {/* Mobile: download directly */}
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          const url = isSeparate && lettersData?.letters?.[0]?.pdf_base64 
                            ? `data:application/pdf;base64,${lettersData.letters[0].pdf_base64}` 
                            : pdfUrl;
                          if (url) downloadPdf(url);
                        }}
                        disabled={isLettersLoading || (!pdfUrl && (!isSeparate || !lettersData?.letters?.[0]))}
                        className={cn(
                          "flex sm:hidden border-black text-black hover:bg-black/10 hover:text-black rounded-xl font-semibold justify-center",
                        )}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Preview / Download Offer
                      </Button>

                      {/* Desktop: open PDF in new tab */}
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          const url = isSeparate && lettersData?.letters?.[0]?.pdf_base64 
                            ? `data:application/pdf;base64,${lettersData.letters[0].pdf_base64}` 
                            : pdfUrl;
                          if (url) openPdfPreview(url);
                        }}
                        disabled={isLettersLoading || (!pdfUrl && (!isSeparate || !lettersData?.letters?.[0]))}
                        className={cn(
                          "hidden sm:flex border border-black bg-transparent text-black hover:bg-black/10 hover:text-black rounded-xl font-semibold justify-center",
                        )}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Preview / Download Offer
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right side: Circular progress */}
          <div className="relative flex shrink-0 items-center justify-center pt-8 sm:pt-0">
            <div className="relative flex items-center justify-center rounded-full bg-white p-8 shadow-[0_10px_10px_rgb(0,0,0,0.08)]">
              <CircularProgress
                value={percentage}
                size={140}
                strokeWidth={10}
                className={cn(
                  "[&_span]:text-[#101828] [&_span]:text-3xl [&_span]:font-bold",
                  isComplete
                    ? "[&_circle:last-of-type]:text-[#12B76A]"
                    : "[&_circle:last-of-type]:text-[#026AA2]",
                )}
              />
              {/* "Ready" label below percentage inside the circle */}
              {isComplete && (
                <span className="absolute inset-0 flex items-center justify-center pt-12 text-[12px] font-medium text-[#475467]">
                  Ready
                </span>
              )}
            </div>
            {/* Small green check badge at bottom-right of circle */}
            {isComplete && (
              <div className="absolute bottom-1 right-5 flex size-10 items-center justify-center rounded-full bg-[#12B76A] border-[3px] border-white text-white shadow-sm">
                <CheckCircle2 className="size-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
