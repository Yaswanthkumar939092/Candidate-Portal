"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsentSessionStatus } from "@/lib/hooks/useJobOffer";
import { useExternalConsentHandoff } from "@/lib/hooks/useExternalConsentHandoff";
import {
  buildConsentPath,
  resolveConsentOnwardUrl,
  CONSENT_ONWARD_PATH,
} from "@/lib/utils/dpdp-consent";

/**
 * How long we wait quietly before admitting the callback is late. The portal's
 * callback normally lands within a second or two of the redirect; past this the
 * candidate deserves an explanation and something to click.
 */
const SLOW_CALLBACK_MS = 45_000;

/** Countdown before forwarding a candidate whose consent has landed. */
const ONWARD_DELAY_SECONDS = 3;

export default function DpdpConsentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans text-foreground bg-background min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Confirming your consent...
            </p>
          </div>
        </div>
      }
    >
      <ConsentReturnContent />
    </Suspense>
  );
}

function ConsentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appl = searchParams.get("appl") || "";
  const token = searchParams.get("token") || "";

  const {
    data: status,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useConsentSessionStatus(appl, token || undefined);

  const { handoff: handoffToExternalConsent, failed: handoffFailed } =
    useExternalConsentHandoff(appl, token || undefined);

  const [callbackIsSlow, setCallbackIsSlow] = useState(false);
  const [countdown, setCountdown] = useState(ONWARD_DELAY_SECONDS);

  const consentGiven = status?.consent_given === true;
  const sessionState = status?.session_status?.trim().toLowerCase();
  const isDeclined = sessionState === "declined" || sessionState === "rejected";
  const isExpired = sessionState === "expired" || sessionState === "timed out";

  const onward = useMemo(
    () => resolveConsentOnwardUrl(status?.redirect_url, appl, token),
    [status?.redirect_url, appl, token],
  );

  // Give the callback a quiet grace period before showing the slow-path UI.
  useEffect(() => {
    if (consentGiven || isDeclined || isExpired) return;
    const timer = setTimeout(() => setCallbackIsSlow(true), SLOW_CALLBACK_MS);
    return () => clearTimeout(timer);
  }, [consentGiven, isDeclined, isExpired]);

  // Consent has landed - forward the candidate.
  useEffect(() => {
    if (!consentGiven) return;

    if (countdown <= 0) {
      if (onward.isExternal) {
        window.location.assign(onward.url);
      } else {
        router.push(onward.url);
      }
      return;
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [consentGiven, countdown, onward, router]);

  const goToOnboarding = () =>
    router.push(buildConsentPath(CONSENT_ONWARD_PATH, appl, token));

  if (!appl) {
    return (
      <ReturnCard
        tone="error"
        icon={<AlertCircle className="h-10 w-10 stroke-2" />}
        title="We couldn't identify your application"
        body="This link is missing the details we need to check your consent. Please reopen it from your email, or head to your dashboard."
      >
        <Button onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </ReturnCard>
    );
  }

  if (isLoading) {
    return (
      <ReturnCard
        tone="neutral"
        icon={<Loader2 className="h-10 w-10 animate-spin stroke-2" />}
        title="Confirming your consent"
        body="Just a moment while we check with our records."
      />
    );
  }

  // Consent is switched off entirely - nothing here should block the candidate.
  if (status && status.enabled === false) {
    return (
      <ReturnCard
        tone="success"
        icon={<ShieldCheck className="h-10 w-10 stroke-2" />}
        title="Nothing further needed"
        body="No consent is outstanding on your application. You can carry on with your onboarding."
      >
        <Button onClick={goToOnboarding}>Continue to Onboarding</Button>
      </ReturnCard>
    );
  }

  if (consentGiven) {
    return (
      <ReturnCard
        tone="success"
        icon={<ShieldCheck className="h-10 w-10 stroke-2" />}
        title="Consent recorded"
        body="Thank you. Your DPDP consent has been received and recorded against your application."
      >
        <div className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm text-muted-foreground bg-muted border border-border/60">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
          Continuing in {countdown} {countdown === 1 ? "second" : "seconds"}...
        </div>
        {status?.consent_log ? (
          <p className="text-[11px] text-muted-foreground mt-3">
            Reference: {status.consent_log}
          </p>
        ) : null}
      </ReturnCard>
    );
  }

  if (isDeclined) {
    return (
      <ReturnCard
        tone="error"
        icon={<ShieldAlert className="h-10 w-10 stroke-2" />}
        title="Consent was declined"
        body="Your onboarding stays on hold until the DPDP consent is given. You can start the consent journey again whenever you are ready."
      >
        <ResumeButton
          onResume={() => void handoffToExternalConsent(status?.consent_url)}
          failed={handoffFailed}
          label="Start consent again"
        />
      </ReturnCard>
    );
  }

  if (isExpired) {
    return (
      <ReturnCard
        tone="warning"
        icon={<Clock className="h-10 w-10 stroke-2" />}
        title="That consent link has expired"
        body="Consent links are short-lived for your security. We can issue you a fresh one right now."
      >
        <ResumeButton
          onResume={() => void handoffToExternalConsent(null)}
          failed={handoffFailed}
          label="Get a new consent link"
        />
      </ReturnCard>
    );
  }

  if (isError && !status) {
    return (
      <ReturnCard
        tone="error"
        icon={<AlertCircle className="h-10 w-10 stroke-2" />}
        title="We couldn't check your consent"
        body={
          error instanceof Error
            ? error.message
            : "Something went wrong while checking your consent status."
        }
      >
        <Button onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? "Checking..." : "Try again"}
        </Button>
      </ReturnCard>
    );
  }

  // Still waiting on the callback. The redirect can beat it home, so this is a
  // normal state for the first moments - it only escalates once it drags on.
  return (
    <ReturnCard
      tone="neutral"
      icon={<Loader2 className="h-10 w-10 animate-spin stroke-2" />}
      title="Confirming your consent"
      body={
        callbackIsSlow
          ? "This is taking longer than usual. Your consent may still be on its way to us - you can keep waiting, check again, or pick this up later from your dashboard."
          : "We're waiting for the consent portal to confirm. This usually takes a few seconds."
      }
    >
      {callbackIsSlow ? (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="w-full sm:w-auto"
          >
            {isFetching ? "Checking..." : "Check again"}
          </Button>
        </div>
      ) : null}
    </ReturnCard>
  );
}

function ResumeButton({
  onResume,
  failed,
  label,
}: {
  onResume: () => void;
  failed: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <Button onClick={onResume} className="w-full sm:w-auto">
        {label}
      </Button>
      {failed ? (
        <p className="text-xs text-destructive">
          We couldn&apos;t reach the consent portal. Please try again in a moment.
        </p>
      ) : null}
    </div>
  );
}

const TONE_STYLES = {
  success: "bg-emerald-50 text-emerald-600 border-emerald-100",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  neutral: "bg-primary/10 text-primary border-primary/20",
} as const;

function ReturnCard({
  tone,
  icon,
  title,
  body,
  children,
}: {
  tone: keyof typeof TONE_STYLES;
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="font-sans text-foreground bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border/60 shadow-sm p-6 sm:p-8 text-center flex flex-col items-center">
        <div className={`p-4 rounded-full mb-5 border ${TONE_STYLES[tone]}`}>
          {icon}
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
          {body}
        </p>
        {children}
      </div>
    </div>
  );
}
