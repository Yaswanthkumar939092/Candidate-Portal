"use client";

import React, { useState, Suspense, useEffect } from "react";
import NextImage from "next/image";
import { Loader2, AlertCircle, LogOut, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useJobOfferSummary,
  useJobOfferPdf,
  useUpdateJobOfferStatus,
  useJobOfferStatus,
  useRejectionReasons,
} from "@/lib/hooks/useJobOffer";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useCompanyLogo } from "@/lib/hooks/useCompanyLogo";
import PdfViewer from "./PdfViewer";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { PortalStepperSidebar } from "@/components/portal/portal-stepper-sidebar";

/** Download the offer letter as a file. Fetches with credentials so cookies work. */
async function downloadPdf(url: string) {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "Offer_Letter.pdf";
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    toast.error("Could not download the offer letter. Please try again.");
  }
}

export default function JobOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-[#64748b]">Loading offer...</p>
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

  // Use param if available, else fallback to userEmail
  const applicantEmail = applParam || userEmail || "";

  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useJobOfferStatus(applicantEmail);
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

  // Only fetch summary, logo, and PDF if status is awaiting response or just accepted/rejected in this session
  const isSummaryNeeded =
    statusNormalized === "awaiting response" ||
    (statusNormalized === "accepted" && justAccepted) ||
    (statusNormalized === "rejected" && justRejected);
  const { data: logoData } = useCompanyLogo(isSummaryNeeded);
  const isPdfNeeded = statusNormalized === "awaiting response";

  const { data: offerData, isLoading: isApiLoading } = useJobOfferSummary(
    applicantEmail,
    isSummaryNeeded,
  );
  const { pdfUrl } = useJobOfferPdf(applicantEmail, isPdfNeeded);
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
      await updateStatus({
        status: "Accepted",
        appl: applicantEmail,
      });
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
      <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#64748b]">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (isStatusError || !applicantEmail) {
    return (
      <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 flex flex-col items-center gap-4 max-w-md text-center">
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
            className="mt-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isApiLoading && isSummaryNeeded) {
    return (
      <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-[#64748b]">Fetching offer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-[#334155] bg-[#f8fafc] min-h-screen">
      {/* STATE: MAIN OFFER */}
      {gameState === "main" && (
        <div className="max-w-[1200px] mx-auto px-5 py-[30px]">
          {!offerData ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
              <p className="text-slate-500">
                Offer details not found for this applicant.
              </p>
            </div>
          ) : (
            <>
              {offerData?.expiry_display && (
                <div className="mb-1">
                  <span className="inline-block px-3.5 py-1 rounded-[4px] text-[11px] font-bold tracking-[1.2px] uppercase bg-[#fff3cd] text-[#856404]">
                    OFFER EXPIRES IN {offerData?.expiry_display}
                  </span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-8 items-stretch lg:items-start w-full">
                {/* Left Side: Stepper + Offer Summary Column */}
                <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-[88px]">
                  {/* Stepper Sidebar */}
                  <PortalStepperSidebar
                    currentStep="offer"
                    className="w-full md:w-full lg:w-[340px] lg:self-start"
                  />

                  {/* Offer Summary Card */}
                  <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                    <div className="text-[1.1rem] font-semibold text-[#1a2332] px-5 pt-4 pb-2.5">
                      Offer Summary
                    </div>
                    <div className="bg-[#eaf4fb] p-5 border border-[#e2e8f0] rounded-lg mx-5 mb-4 overflow-hidden">
                      <div className="flex justify-between items-center py-1.5 gap-4">
                        <span className="text-[0.85rem] text-[#64748b] shrink-0">
                          Role
                        </span>
                        <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right truncate">
                          {offerData.designation || "Intern"}
                        </span>
                      </div>
                      {offerData.duration_display && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-[#64748b]">
                            Duration
                          </span>
                          <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right">
                            {offerData.duration_display}
                          </span>
                        </div>
                      )}
                      {offerData.expected_doj_display && (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-[#64748b]">
                            Joining Date
                          </span>
                          <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right">
                            {offerData.expected_doj_display}
                          </span>
                        </div>
                      )}
                      {offerData.stipend_formatted ||
                      offerData.stipend ||
                      offerData.stipend_display ? (
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[0.85rem] text-[#64748b]">
                            Stipend
                          </span>
                          <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right">
                            {offerData.stipend_formatted ||
                              offerData.stipend_display}
                          </span>
                        </div>
                      ) : (
                        <>
                          {offerData.fixed_formatted !== undefined &&
                            offerData.fixed_formatted !== null && (
                              <div className="flex justify-between items-center py-1.5">
                                <span className="text-[0.85rem] text-[#64748b]">
                                  Fixed Pay
                                </span>
                                <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right">
                                  {offerData.fixed_formatted}
                                </span>
                              </div>
                            )}
                          {offerData.variable_formatted !== undefined &&
                            offerData.variable_formatted !== null && (
                              <div className="flex justify-between items-center py-1.5">
                                <span className="text-[0.85rem] text-[#64748b]">
                                  Variable Pay
                                </span>
                                <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right">
                                  {offerData.variable_formatted}
                                </span>
                              </div>
                            )}
                          {offerData.total_formatted !== undefined &&
                            offerData.total_formatted !== null && (
                              <div className="flex justify-between items-center py-1.5">
                                <span className="text-[0.85rem] text-[#64748b]">
                                  Total
                                </span>
                                <span className="text-[0.85rem] font-semibold text-[#1a2332] text-right">
                                  {offerData.total_formatted}
                                </span>
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="block lg:hidden">
                        <button
                          onClick={() => pdfUrl && downloadPdf(pdfUrl)}
                          disabled={!pdfUrl}
                          className="flex items-center justify-center gap-2 w-full p-2.5 bg-transparent text-[#2563eb] border-[1.5px] border-[#2563eb] rounded-lg text-[0.85rem] font-semibold mb-2.5 text-center transition-colors duration-200 hover:bg-[#2563eb]/6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          Download Offer Letter
                        </button>
                      </div>

                      <label className="flex items-start gap-2.5 text-[0.82rem] text-[#334155] cursor-pointer leading-[1.45] mb-4 bg-[#fff8e1] border border-[#ffe0b2] rounded-lg p-3">
                        <input
                          type="checkbox"
                          className="mt-[3px] shrink-0 w-4 h-4 accent-[#1a2332] cursor-pointer"
                          checked={isTermsChecked}
                          onChange={(e) => setIsTermsChecked(e.target.checked)}
                        />
                        <span>
                          I declare that I have read and understood the entire
                          offer letter and agree to the terms and conditions
                          outlined above.
                        </span>
                      </label>

                      <div className="hidden lg:block">
                        <button
                          onClick={() =>
                            pdfUrl &&
                            window.open(pdfUrl, "_blank", "noopener,noreferrer")
                          }
                          disabled={!pdfUrl}
                          className="flex items-center justify-center gap-2 w-full p-2.5 bg-transparent text-[#2563eb] border-[1.5px] border-[#2563eb] rounded-lg text-[0.85rem] font-semibold mb-2.5 text-center transition-colors duration-200 hover:bg-[#2563eb]/6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          Preview / Download Offer Letter
                        </button>
                      </div>

                      <button
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#00b48a] hover:bg-[#009e78] text-white rounded-lg text-[0.95rem] font-semibold transition-colors duration-200 mb-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isTermsChecked || isAccepting}
                        onClick={handleAccept}
                      >
                        {isAccepting && (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
                        className="flex items-center justify-center gap-2 w-full p-2.5 bg-transparent text-[#dc3545] border-2 border-[#dc3545] rounded-lg text-[0.95rem] font-semibold transition-all duration-200 hover:bg-[#dc3545]/6"
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
                  <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-md shadow-lg overflow-hidden">
                    {/* Header attached inside the card */}
                    <div className="py-3.5 px-6 sm:px-8 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold text-foreground truncate">
                          Offer of Employment
                        </h1>
                      </div>
                    </div>

                    {/* PDF Document body */}
                    {pdfUrl ? (
                      <div
                        className="bg-[#f1f5f9] dark:bg-slate-900 overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]"
                        style={{ height: "80vh", minHeight: "600px" }}
                      >
                        <PdfViewer pdfUrl={pdfUrl} />
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-card p-8 overflow-x-auto flex flex-col items-center justify-center min-h-[400px]">
                        <p className="text-[#64748b]">
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
        <div className="max-w-[700px] mx-auto px-5 py-[60px]">
          <h1 className="text-[2rem] font-semibold text-[#1a2332] mt-4 mb-2">
            Reject Offer
          </h1>
          <p className="text-[0.95rem] text-[#64748b] mb-7">
            We&apos;re sorry to see you go. Please let us know why you are
            declining this offer.
          </p>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5 text-[1.15rem] font-semibold text-[#1a2332] mb-5">
              Reason for rejection <span className="text-[#dc3545]">*</span>
            </div>
            <select
              className="w-full p-[10px_14px] border border-[#e2e8f0] rounded-lg text-[0.9rem] text-[#334155] bg-white appearance-auto mb-5 focus:outline-none focus:border-[#1a2332] focus:ring-2 focus:ring-[#1a2332]/10"
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
            <label className="text-[0.9rem] font-semibold text-[#1a2332] block mb-2">
              Additional comments
            </label>
            <textarea
              className="w-full p-[12px_14px] border border-[#e2e8f0] rounded-lg text-[0.9rem] text-[#334155] resize-vertical min-h-[120px] font-inherit focus:outline-none focus:border-[#1a2332] focus:ring-2 focus:ring-[#1a2332]/10"
              placeholder="Share any additional feedback..."
              rows={5}
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-6 gap-3">
              <button
                className="w-full sm:w-auto text-[0.9rem] font-semibold text-[#1a2332] bg-none border border-[#e2e8f0] rounded-lg px-8 py-2.5 transition-colors hover:bg-[#f8fafc]"
                onClick={() => setGameState("main")}
              >
                Cancel
              </button>
              <button
                className="w-full sm:w-auto px-8 py-2.5 bg-[#dc3545] text-white rounded-lg text-[0.95rem] font-semibold transition-colors duration-200 hover:bg-[#c82333] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRejecting}
                onClick={handleConfirmReject}
              >
                {isRejecting ? "Confirming..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE: ACCEPTED CONFIRMATION */}
      {gameState === "accepted" && (
        <div className="max-w-[700px] mx-auto px-5 py-[60px] text-center">
          <div className="mb-4">
            <div className="w-[70px] h-[70px] bg-[#4caf50] rounded-full flex items-center justify-center mx-auto shadow-[0_8px_32px_rgba(76,175,80,0.3)] animate-[jo-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
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
          <span className="inline-block px-7 py-2.5 rounded-sm text-[1.3rem] font-semibold tracking-[2px] uppercase bg-[#e8f5e9] text-[#2e7d32] mb-4">
            OFFER ACCEPTED
          </span>
          <h1 className="text-[2.5rem] font-semibold text-[#1a2332] mt-3 mb-4">
            Welcome to the team, {offerData?.applicant_name}!
          </h1>
          <p className="text-[1rem] text-[#64748b] max-w-[500px] mx-auto mb-8 leading-[1.6]">
            We are absolutely thrilled to have you join us. Your offer has been
            successfully accepted.
          </p>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 max-w-[520px] mx-auto mb-5 text-left shadow-sm">
            {/* <div className="text-[0.95rem] text-[#334155] leading-[1.6]">
              Keep checking your email for further updates on your onboarding
              and LMS journey.
            </div> */}
            <div className="text-[0.95rem] text-[#334155] leading-[1.6]">
              Please click below &quot;Go to Dashboard&quot; to complete your
              employee onboarding formalities
            </div>
          </div>
          <div className="mt-7 flex flex-col items-center gap-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-[#4caf50] text-white rounded-lg font-semibold hover:bg-[#43a047] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 h-11"
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
            <p className="text-[12px] text-gray-400 mt-2">
              You can also close this browser window
            </p>
          </div>
        </div>
      )}

      {/* STATE: REJECTED CONFIRMATION */}
      {gameState === "rejected" && (
        <div className="max-w-[700px] mx-auto px-5 py-[60px] text-center">
          <div className="mb-4">
            <div className="w-[70px] h-[70px] bg-[#ef4444] rounded-full flex items-center justify-center mx-auto shadow-[0_8px_32px_rgba(239,68,68,0.3)] animate-[jo-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
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
          <span className="inline-block px-7 py-2.5 rounded-sm text-[1.3rem] font-semibold tracking-[2px] uppercase bg-[#fef2f2] text-[#ef4444] mb-4">
            OFFER DECLINED
          </span>
          <h1 className="text-[2.5rem] font-semibold text-[#1a2332] mt-3 mb-4">
            Offer Letter Declined
          </h1>
          <p className="text-[1rem] text-[#64748b] max-w-[500px] mx-auto mb-8 leading-[1.6]">
            You have declined the offer letter. If this was a mistake or you
            wish to raise a request regarding your decision, please proceed
            below.
          </p>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 max-w-[520px] mx-auto mb-5 text-left shadow-sm">
            <div className="text-[0.95rem] text-[#334155] leading-[1.6]">
              <div className="font-semibold text-[#1a2332] mb-1">
                Reason for Rejection:
              </div>
              <div className="text-[#64748b] mb-3">{rejectionReason}</div>
              {rejectionMessage && (
                <>
                  <div className="font-semibold text-[#1a2332] mb-1">
                    Additional Message:
                  </div>
                  <div className="text-[#64748b] italic">
                    &ldquo;{rejectionMessage}&rdquo;
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-7 flex flex-row flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => router.push("/action-center?tab=requests")}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 h-11"
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
              className="px-6 py-2.5 border border-[#e2e8f0] text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 h-11"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STATE: ALREADY PROCESSED */}
      {gameState === "processed" && (
        <div className="max-w-[600px] mx-auto px-5 py-[100px] text-center">
          <div className="w-20 h-20 bg-[#eaf4fb] rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-[1.5rem] font-semibold text-[#1a2332] mb-3">
            You have already accepted or rejected the Offer Letter.
          </h2>
          <p className="text-[0.95rem] text-[#64748b] leading-[1.6] mb-8">
            If you believe this is an error, please contact our HR department
            for assistance.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 h-11"
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
        <div className="max-w-[600px] mx-auto px-5 py-[100px] text-center">
          <div className="w-20 h-20 bg-[#eaf4fb] rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc3545"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-[1.5rem] font-bold text-[#1a2332] mb-3">
            Your Offer Letter Has Expired
          </h2>
          <p className="text-[0.95rem] text-[#64748b] leading-[1.6]">
            Please contact the HR department for assistance.
          </p>
        </div>
      )}

      {/* POPUP: OFFER DECLINED */}
      {showDeclinedPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center px-4">
          <div className="relative bg-white rounded-[20px] p-[48px_36px_36px] max-w-[420px] w-full text-center shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <button
              onClick={() => {
                setShowDeclinedPopup(false);
                router.push("/dashboard");
              }}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#64748b] hover:text-[#1a2332]"
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
            <div className="w-14 h-14 rounded-full bg-[#e8edf5] flex items-center justify-center mx-auto mb-6">
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
            <h2 className="text-[1.5rem] font-bold text-[#1a2332] mb-4">
              Offer Rejected
            </h2>
            <p className="text-[0.9rem] text-[#64748b] mb-8 leading-[1.7]">
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
          <div className="bg-white rounded-[20px] p-9 max-w-[400px] w-full text-center shadow-[0_8px_32_rgba(0,0,0,0.15)]">
            <div className="w-14 h-14 rounded-full bg-[#fff3cd] flex items-center justify-center mx-auto mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#856404"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-[1.4rem] font-semibold text-[#1a2332] mb-3">
              Reason Required
            </h2>
            <p className="text-[0.95rem] text-[#64748b] mb-6 leading-[1.6]">
              Please select a rejection reason to proceed.
            </p>
            <button
              onClick={() => setShowMissingReasonPopup(false)}
              className="bg-[#1a2332] text-white border-none px-6 py-2.5 rounded-lg font-semibold cursor-pointer hover:bg-[#1a2332]/90"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
