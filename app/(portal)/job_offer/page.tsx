"use client";

import React, { useState, Suspense, useEffect } from "react";
import { Loader2, AlertCircle, LogOut, ClipboardList, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useJobOfferSummary,
  useJobOfferPdf,
  useJobOfferLetters,
  useUpdateJobOfferStatus,
  useJobOfferStatus,
  useRejectionReasons,
} from "@/lib/hooks/useJobOffer";
import { useCurrentUser } from "@/lib/hooks/useUser";
import PdfViewer from "./PdfViewer";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { PortalStepperSidebar } from "@/components/portal/portal-stepper-sidebar";

async function downloadPdf(url: string, filename: string = "Offer_Letter.pdf") {
  try {
    if (url.startsWith("data:")) {
      const arr = url.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
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
    try {
      const arr = url.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open the preview.");
    }
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function JobOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans text-foreground bg-background min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading offer...</p>
          </div>
        </div>
      }
    >
      <JobOfferContent />
    </Suspense>
  );
}

function JobOfferContent() {
  const router = useRouter();
  const { userEmail, isLoading: isUserLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const applParam = searchParams.get("appl");
  const tokenParam = searchParams.get("token") || undefined;

  // Use param if available, else fallback to userEmail
  const applicantEmail = applParam || userEmail || "";

  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useJobOfferStatus(applicantEmail, tokenParam);
  const statusNormalized = statusData?.status?.toLowerCase();

  const [gameState, setGameState] = useState<
    | "loading"
    | "main"
    | "rejection"
    | "accepted"
    | "processed"
    | "expired"
    | "rejected"
  >("main");
  const [justAccepted, setJustAccepted] = useState(false);
  const [justRejected, setJustRejected] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [consentRequiredAfterAccept, setConsentRequiredAfterAccept] =
    useState(false);
  const [countdown, setCountdown] = useState(5);

  // Only fetch summary and PDF if status is awaiting response or just accepted/rejected in this session
  const isSummaryNeeded =
    statusNormalized === "awaiting response" ||
    (statusNormalized === "accepted" && justAccepted) ||
    (statusNormalized === "rejected" && justRejected);
  const isPdfNeeded = statusNormalized === "awaiting response";

  const {
    data: offerData,
    isLoading: isApiLoading,
    isError: isOfferError,
    isFetching: isOfferFetching
  } = useJobOfferSummary(
    applicantEmail,
    isSummaryNeeded,
    tokenParam,
  );

  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const [viewedLetters, setViewedLetters] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    setViewedLetters((prev) => {
      if (prev.has(selectedLetterIndex)) return prev;
      const next = new Set(prev);
      next.add(selectedLetterIndex);
      return next;
    });
  }, [selectedLetterIndex]);

  const isSeparate = (offerData?.count && offerData.count > 1) || offerData?.employment_type === "Trainee" || offerData?.compensation_type === "both";

  const { pdfUrl } = useJobOfferPdf(applicantEmail, isPdfNeeded && !isSeparate, tokenParam);

  const { data: lettersData, isLoading: isLettersLoading, isFetching: isLettersFetching } = useJobOfferLetters(
    applicantEmail,
    isPdfNeeded && isSeparate,
    tokenParam
  );

  const hasViewedAllLetters = !isSeparate || !lettersData?.letters || viewedLetters.size === lettersData.letters.length;

  const activePdfUrl = isSeparate && lettersData?.letters?.[selectedLetterIndex]?.pdf_base64
    ? `data:application/pdf;base64,${lettersData.letters[selectedLetterIndex].pdf_base64}`
    : pdfUrl;

  const { mutateAsync: updateStatus } = useUpdateJobOfferStatus();
  const { data: reasonsData, isLoading: isReasonsLoading } =
    useRejectionReasons();

  useEffect(() => {
    if (statusNormalized) {
      if (statusNormalized === "accepted") {
        // Show welcome screen 'only once' after acceptance. Refresh/Revisit shows processed screen.
        if (justAccepted) {
          setGameState("accepted");
        } else {
          setGameState("processed");
        }
      } else if (statusNormalized === "rejected") {
        // Show rejection screen 'only once' after rejection in this session.
        if (justRejected) {
          setGameState("rejected");
        } else {
          setGameState("processed");
        }
      } else if (statusNormalized === "expired") {
        setGameState("expired");
      } else if (statusNormalized === "awaiting response") {
        setGameState("main");
      }
    }
  }, [statusNormalized, justAccepted, justRejected]);

  useEffect(() => {
    if (gameState === "accepted" && consentRequiredAfterAccept) {
      if (process.env.NODE_ENV === "test") {
        const params = new URLSearchParams();
        if (applicantEmail) params.append("appl", applicantEmail);
        if (tokenParam) params.append("token", tokenParam);
        router.push(`/job_offer/consent?${params.toString()}`);
        return;
      }

      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            const params = new URLSearchParams();
            if (applicantEmail) params.append("appl", applicantEmail);
            if (tokenParam) params.append("token", tokenParam);
            router.push(`/job_offer/consent?${params.toString()}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [
    gameState,
    consentRequiredAfterAccept,
    applicantEmail,
    tokenParam,
    router,
  ]);

  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [showMissingReasonPopup, setShowMissingReasonPopup] = useState(false);
  const [showDeclinedPopup, setShowDeclinedPopup] = useState(false);

  const handleAccept = async () => {
    if (!isTermsChecked || isAccepting) return;
    setIsAccepting(true);

    try {
      const response = await updateStatus({
        status: "Accepted",
        appl: applicantEmail,
        ...(tokenParam ? { token: tokenParam } : {}),
      });

      if (response?.dpdp_consent_required) {
        setConsentRequiredAfterAccept(true);
      } else {
        setConsentRequiredAfterAccept(false);
      }

      setJustAccepted(true);
      setGameState("accepted");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "An error occurred while accepting the offer.";
      toast.error(errorMessage);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason) {
      setShowMissingReasonPopup(true);
      return;
    }
    setIsRejecting(true);

    try {
      await updateStatus({
        status: "Rejected",
        appl: applicantEmail,
        reason: rejectionReason,
        message: rejectionMessage,
        ...(tokenParam ? { token: tokenParam } : {}),
      });
      toast.success("Offer rejected.");
      setJustRejected(true);
      setGameState("rejected");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "An error occurred while rejecting the offer.";
      toast.error(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isUserLoading || isStatusLoading) {
    return (
      <div className="font-sans text-foreground bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (isStatusError || !applicantEmail) {
    return (
      <div className="font-sans text-foreground bg-background min-h-screen flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl shadow-sm border border-destructive/20 flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-800">
            Oops! Something went wrong
          </h2>
          <p className="text-slate-600">
            {isStatusError
              ? (statusError as Error)?.message ||
                "We couldn't fetch the offer status. Please try again later."
              : "No applicant email provided. Please check the link in your email."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isApiLoading && isSummaryNeeded) {
    return (
      <div className="font-sans text-foreground bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching offer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-foreground bg-background min-h-screen">
      {/* STATE: MAIN OFFER */}
      {gameState === "main" && (
        <div className="max-w-300 mx-auto px-5 py-7.5">
          {!offerData ? (
            isOfferFetching ? (
              <div className="flex flex-col items-center justify-center min-h-100 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-slate-500">Loading offer details...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-100 text-center">
                <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-slate-500">
                  Offer details not found for this applicant.
                </p>
              </div>
            )
          ) : (
            <>
              {offerData?.expiry_display && (
                <div className="mb-1">
                  <span className="inline-block px-3.5 py-1 rounded-lg text-[11px] font-bold tracking-[1.2px] uppercase bg-warning-bg text-warning">
                    OFFER EXPIRES IN {offerData?.expiry_display}
                  </span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-8 items-stretch lg:items-start w-full">
                {/* Left Side: Stepper + Offer Summary Column */}
                <div className="w-full lg:w-85 shrink-0 flex flex-col gap-6 lg:sticky lg:top-22">
                  {/* Stepper Sidebar */}
                  <PortalStepperSidebar
                    currentStep="offer"
                    className="w-full md:w-full lg:w-85 lg:self-start"
                    expandedItems={
                      isSeparate && lettersData?.letters
                        ? lettersData.letters.map((l, i) => ({
                            id: `letter-${i}`,
                            label: l.print_format || `Document ${i + 1}`,
                          }))
                        : undefined
                    }
                    activeItemIndex={selectedLetterIndex}
                    onItemSelect={setSelectedLetterIndex}
                  />

                  {/* Offer Summary Card */}
                  <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                    <div className="text-[1.1rem] font-semibold text-foreground px-5 pt-4 pb-2.5">
                      Offer Summary
                    </div>
                    <div className="bg-muted p-5 border border-border/60 rounded-lg mx-5 mb-4 overflow-hidden">
                      <div className="flex justify-between items-center py-1.5 gap-4">
                        <span className="text-[0.85rem] text-muted-foreground shrink-0">
                          Role
                        </span>
                        <span className="text-[0.85rem] font-semibold text-foreground text-right truncate">
                          {offerData.designation || "Intern"}
                        </span>
                      </div>
                      {offerData.duration_display && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-muted-foreground">
                            Duration
                          </span>
                          <span className="text-[0.85rem] font-semibold text-foreground text-right">
                            {offerData.duration_display}
                          </span>
                        </div>
                      )}
                      {offerData.expected_doj_display && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-muted-foreground">
                            Joining Date
                          </span>
                          <span className="text-[0.85rem] font-semibold text-foreground text-right">
                            {offerData.expected_doj_display}
                          </span>
                        </div>
                      )}
                      {offerData.trainee_doj_display && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-muted-foreground">
                            Trainee DOJ
                          </span>
                          <span className="text-[0.85rem] font-semibold text-foreground text-right">
                            {offerData.trainee_doj_display}
                          </span>
                        </div>
                      )}
                      {(offerData.stipend_formatted ||
                        offerData.stipend ||
                        offerData.stipend_display) && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-muted-foreground">
                            Stipend
                          </span>
                          <span className="text-[0.85rem] font-semibold text-foreground text-right">
                            {offerData.stipend_formatted ||
                              offerData.stipend_display}
                          </span>
                        </div>
                      )}
                      
                      {offerData.fixed_formatted !== undefined &&
                        offerData.fixed_formatted !== null && (
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-[0.85rem] text-muted-foreground">
                              Fixed Pay
                            </span>
                            <span className="text-[0.85rem] font-semibold text-foreground text-right">
                              {offerData.fixed_formatted}
                            </span>
                          </div>
                        )}
                      {offerData.variable_formatted !== undefined &&
                        offerData.variable_formatted !== null && (
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-[0.85rem] text-muted-foreground">
                              Variable Pay
                            </span>
                            <span className="text-[0.85rem] font-semibold text-foreground text-right">
                              {offerData.variable_formatted}
                            </span>
                          </div>
                        )}
                      {offerData.location_allowance_formatted !== undefined &&
                        offerData.location_allowance_formatted !== null && (
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-[0.85rem] text-muted-foreground">
                              Location Allowance
                            </span>
                            <span className="text-[0.85rem] font-semibold text-foreground text-right">
                              {offerData.location_allowance_formatted}
                            </span>
                          </div>
                        )}
                      {offerData.total_formatted !== undefined &&
                        offerData.total_formatted !== null && (
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-[0.85rem] text-muted-foreground">
                              Total
                            </span>
                            <span className="text-[0.85rem] font-semibold text-foreground text-right">
                              {offerData.total_formatted}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="p-5">
                      <div className="block lg:hidden">
                        <button
                          onClick={() => activePdfUrl && downloadPdf(
                            activePdfUrl,
                            isSeparate && lettersData?.letters?.[selectedLetterIndex]?.print_format 
                              ? `${lettersData.letters[selectedLetterIndex].print_format}.pdf` 
                              : "Offer_Letter.pdf"
                          )}
                          disabled={!activePdfUrl}
                          className="flex items-center justify-center gap-2 w-full p-2.5 bg-background text-foreground border border-foreground/40 shadow-xs rounded-lg text-[0.85rem] font-semibold mb-2.5 text-center transition-colors duration-200 hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download {isSeparate && lettersData?.letters?.[selectedLetterIndex]?.print_format ? lettersData.letters[selectedLetterIndex].print_format : "Offer Letter"}
                        </button>
                      </div>

                      {!hasViewedAllLetters && (
                        <div className="text-[0.85rem] text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Please view all the documents in the Job Offer Preview section to accept the offer letter.
                          </span>
                        </div>
                      )}

                      <label className="flex items-start gap-2.5 text-[0.82rem] text-foreground cursor-pointer leading-[1.45] mb-4 bg-warning-bg border border-warning/30 rounded-lg p-3">
                        <input
                          type="checkbox"
                          className="mt-0.75 shrink-0 w-4 h-4 accent-[#1a2332] cursor-pointer"
                          checked={isTermsChecked}
                          onChange={(e) => setIsTermsChecked(e.target.checked)}
                          disabled={!hasViewedAllLetters}
                        />
                        <span className={!hasViewedAllLetters ? "opacity-70" : ""}>
                          I declare that I have read and understood the entire
                          offer letter and agree to the terms and conditions
                          outlined above.
                        </span>
                      </label>

                      <div className="hidden lg:block">
                        <button
                          onClick={() => activePdfUrl && openPdfPreview(activePdfUrl)}
                          disabled={!activePdfUrl}
                          className="flex items-center justify-center gap-2 w-full p-2.5 bg-background text-foreground border border-foreground/40 shadow-xs rounded-lg text-[0.85rem] font-semibold mb-2.5 text-center transition-colors duration-200 hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Preview / Download {isSeparate && lettersData?.letters?.[selectedLetterIndex]?.print_format ? lettersData.letters[selectedLetterIndex].print_format : "Offer Letter"}
                        </button>
                      </div>

                      <button
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-success hover:bg-success/90 text-success-foreground rounded-lg text-[0.95rem] font-semibold transition-colors duration-200 mb-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isTermsChecked || isAccepting || !hasViewedAllLetters}
                        onClick={handleAccept}
                      >
                        {isAccepting && (
                          <span className="inline-block w-4 h-4 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin"></span>
                        )}
                        {!isAccepting && (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {isAccepting ? "Accepting..." : "Accept Offer"}
                      </button>

                      <button
                        className="flex items-center justify-center gap-2 w-full p-2.5 bg-transparent text-destructive border-2 border-destructive rounded-lg text-[0.95rem] font-semibold transition-all duration-200 hover:bg-destructive/10"
                        onClick={() => {
                          setGameState("rejection");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Reject Offer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Offer Document (PDF Preview Card) */}
                <div className="w-full lg:flex-1 lg:min-w-0 overflow-hidden hidden sm:block">
                  <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
                    {/* Header attached inside the card */}
                    <div className="py-3.5 px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h1 className="text-lg font-bold text-foreground truncate">
                            {isSeparate && lettersData?.letters && lettersData.letters[selectedLetterIndex]?.print_format 
                              ? lettersData.letters[selectedLetterIndex].print_format 
                              : "Offer of Employment"}
                          </h1>
                        </div>
                      </div>
                    </div>

                    {/* PDF Document body */}
                    {activePdfUrl ? (
                      <div
                        className="bg-muted overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]"
                        style={{ height: "80vh", minHeight: "600px" }}
                      >
                        <PdfViewer pdfUrl={activePdfUrl} />
                      </div>
                    ) : (isLettersLoading || isLettersFetching) ? (
                      <div className="bg-muted flex flex-col items-center justify-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]" style={{ height: "80vh", minHeight: "600px" }}>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading offer letter...</p>
                      </div>
                    ) : (
                      <div className="bg-card p-8 overflow-x-auto flex flex-col items-center justify-center min-h-100">
                        <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
                        <p className="text-muted-foreground">
                          Offer letter content could not be loaded.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* STATE: REJECTION FLOW */}
      {gameState === "rejection" && (
        <div className="max-w-175 mx-auto px-5 py-15">
          <h1 className="text-[2rem] font-semibold text-foreground mt-4 mb-2">
            Reject Offer
          </h1>
          <p className="text-[0.95rem] text-muted-foreground mb-7">
            We&apos;re sorry to see you go. Please let us know why you are
            declining this offer.
          </p>
          <div className="bg-card border border-border/60 rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5 text-[1.15rem] font-semibold text-foreground mb-5">
              Reason for rejection <span className="text-destructive">*</span>
            </div>
            <select
              className="w-full p-[10px_14px] border border-border rounded-lg text-[0.9rem] text-foreground bg-background appearance-auto mb-5 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            >
              <option value="">
                {isReasonsLoading ? "Loading reasons..." : "Select a reason..."}
              </option>
              {reasonsData?.map((r) => (
                <option key={r.reason} value={r.reason}>
                  {r.name}
                </option>
              ))}
            </select>
            <label className="text-[0.9rem] font-semibold text-foreground block mb-2">
              Additional comments
            </label>
            <textarea
              className="w-full p-[12px_14px] border border-border rounded-lg text-[0.9rem] text-foreground bg-background placeholder:text-muted-foreground resize-vertical min-h-30 font-inherit focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Share any additional feedback..."
              rows={5}
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-6 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 font-semibold"
                onClick={() => setGameState("main")}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto px-8 font-semibold"
                disabled={isRejecting}
                onClick={handleConfirmReject}
              >
                {isRejecting ? "Confirming..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STATE: ACCEPTED CONFIRMATION */}
      {gameState === "accepted" && (
        <div className="max-w-175 mx-auto px-5 py-15 text-center">
          <div className="mb-4">
            <div className="w-17.5 h-17.5 bg-success rounded-full flex items-center justify-center mx-auto shadow-[0_8px_32px_rgba(76,175,80,0.3)] animate-[jo-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <span className="inline-block px-7 py-2.5 rounded-sm text-[1.3rem] font-semibold tracking-[2px] uppercase bg-success-bg text-success-text mb-4">
            OFFER ACCEPTED
          </span>
          <h1 className="text-[2.5rem] font-semibold text-foreground mt-3 mb-4">
            Welcome to the team, {offerData?.applicant_name}!
          </h1>
          <p className="text-[1rem] text-muted-foreground max-w-125 mx-auto mb-8 leading-[1.6]">
            We are absolutely thrilled to have you join us. Your offer has been
            successfully accepted.
          </p>
          <div className="bg-card border border-border/60 rounded-xl p-6 max-w-130 mx-auto mb-5 text-left shadow-sm">
            {/* <div className="text-[0.95rem] text-foreground leading-[1.6]">
              Keep checking your email for further updates on your onboarding
              and LMS journey.
            </div> */}
            <div className="text-[0.95rem] text-foreground leading-[1.6]">
              {consentRequiredAfterAccept ? (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <span className="font-medium text-warning flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-warning" />
                    Redirecting to the DPDP Consent Form in {countdown} {countdown === 1 ? "second" : "seconds"}...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Please do not close or refresh this window.
                  </span>
                </div>
              ) : (
                <span>
                  Please click below &quot;Go to Dashboard&quot; to complete
                  your employee onboarding formalities
                </span>
              )}
            </div>
          </div>
          {!consentRequiredAfterAccept && (
            <div className="mt-7 flex flex-col items-center gap-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-success text-success-foreground font-semibold hover:bg-success/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 h-11"
              >
                Go to Dashboard
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Button>
              <p className="text-[12px] text-muted-foreground mt-2">
                You can also close this browser window
              </p>
            </div>
          )}
        </div>
      )}

      {/* STATE: REJECTED CONFIRMATION */}
      {gameState === "rejected" && (
        <div className="max-w-175 mx-auto px-5 py-15 text-center">
          <div className="mb-4">
            <div className="w-17.5 h-17.5 bg-destructive rounded-full flex items-center justify-center mx-auto shadow-[0_8px_32px_rgba(239,68,68,0.3)] animate-[jo-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-white"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
          <span className="inline-block px-7 py-2.5 rounded-sm text-[1.3rem] font-semibold tracking-[2px] uppercase bg-destructive/10 text-destructive mb-4">
            OFFER DECLINED
          </span>
          <h1 className="text-[2.5rem] font-semibold text-foreground mt-3 mb-4">
            Offer Letter Declined
          </h1>
          <p className="text-[1rem] text-muted-foreground max-w-125 mx-auto mb-8 leading-[1.6]">
            You have declined the offer letter. If this was a mistake or you
            wish to raise a request regarding your decision, please proceed
            below.
          </p>
          <div className="bg-card border border-border/60 rounded-xl p-6 max-w-130 mx-auto mb-5 text-left shadow-sm">
            <div className="text-[0.95rem] text-foreground leading-[1.6]">
              <div className="font-semibold text-foreground mb-1">
                Reason for Rejection:
              </div>
              <div className="text-muted-foreground mb-3">{rejectionReason}</div>
              {rejectionMessage && (
                <>
                  <div className="font-semibold text-foreground mb-1">
                    Additional Message:
                  </div>
                  <div className="text-muted-foreground italic">
                    &ldquo;{rejectionMessage}&rdquo;
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-7 flex flex-row flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => router.push("/action-center?tab=requests")}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 h-11"
            >
              Raise Request
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="px-6 py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2 h-11"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STATE: ALREADY PROCESSED */}
      {gameState === "processed" && (
        <div className="max-w-150 mx-auto px-5 py-25 text-center">
          <div className="w-20 h-20 bg-muted rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="text-[1.5rem] font-semibold text-foreground mb-3">
            You have already accepted or rejected the Offer Letter.
          </h2>
          <p className="text-[0.95rem] text-muted-foreground leading-[1.6] mb-8">
            If you believe this is an error, please contact our HR department
            for assistance.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 h-11"
            >
              Go to Dashboard
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* STATE: EXPIRED */}
      {gameState === "expired" && (
        <div className="max-w-150 mx-auto px-5 py-25 text-center">
          <div className="w-20 h-20 bg-muted rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <Clock className="h-9 w-9 text-destructive" />
          </div>
          <h2 className="text-[1.5rem] font-bold text-foreground mb-3">
            Your Offer Letter Has Expired
          </h2>
          <p className="text-[0.95rem] text-muted-foreground leading-[1.6]">
            Please contact the HR department for assistance.
          </p>
        </div>
      )}

      {/* POPUP: OFFER DECLINED */}
      {showDeclinedPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center px-4">
          <div className="relative bg-card rounded-[20px] p-[48px_36px_36px] max-w-105 w-full text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <button
              onClick={() => {
                setShowDeclinedPopup(false);
                router.push("/dashboard");
              }}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3d4f7c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-[1.5rem] font-bold text-foreground mb-4">
              Offer Rejected
            </h2>
            <p className="text-[0.9rem] text-muted-foreground mb-8 leading-[1.7]">
              Thank you for letting us know. We appreciate the time and effort
              you invested in our interview process. We wish you the very best
              in your future endeavors.
            </p>
          </div>
        </div>
      )}

      {/* POPUP: MISSING REASON */}
      {showMissingReasonPopup && (
        <div className="fixed inset-0 bg-black/40 z-9999 flex items-center justify-center px-4">
          <div className="bg-card rounded-[20px] p-9 max-w-100 w-full text-center shadow-[0_8px_32_rgba(0,0,0,0.15)]">
            <div className="w-14 h-14 rounded-full bg-warning-bg flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="text-[1.4rem] font-semibold text-foreground mb-3">
              Reason Required
            </h2>
            <p className="text-[0.95rem] text-muted-foreground mb-6 leading-[1.6]">
              Please select a rejection reason to proceed.
            </p>
            <button
              onClick={() => setShowMissingReasonPopup(false)}
              className="bg-primary text-primary-foreground border-none px-6 py-2.5 rounded-lg font-semibold cursor-pointer hover:bg-primary-hover"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
