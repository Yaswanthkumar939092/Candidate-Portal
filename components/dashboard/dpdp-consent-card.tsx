"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isExternalConsentMode } from "@/types/consent";
import {
  CONSENT_FORM_PATH,
  buildConsentPath,
  isSafeExternalConsentUrl,
} from "@/lib/utils/dpdp-consent";

interface DpdpConsentCardProps {
  className?: string;
  consentUrl?: string;
  /** `External Portal` sends the candidate off-site; anything else stays in-app. */
  consentMode?: string | null;
  /** Applicant id, so the in-app fallback link can identify the candidate. */
  appl?: string | null;
}

/**
 * DPDP Consent Pending card shown on the dashboard when consent has not been submitted.
 * Features a shield icon with a rotating dotted border, matching the dpdp.png reference design.
 */
export function DpdpConsentCard({
  className,
  consentUrl,
  consentMode,
  appl,
}: DpdpConsentCardProps) {
  // An absolute consent URL leaves the site, whatever the mode says - that has
  // always been true of this card and stays true for a backend that reports no
  // mode. What changes is how we get there: a real navigation rather than a
  // client-side route, and only for a well-formed http(s) URL, so a relative or
  // scheme-bearing value can never be handed to the browser as a destination.
  const goesOffSite = isSafeExternalConsentUrl(consentUrl);
  const isExternalJourney = isExternalConsentMode(consentMode);

  // Without a usable external link we fall back to the in-app consent route,
  // which re-issues a session of its own rather than dead-ending. Only an
  // in-portal path is honoured here - an absolute or scheme-bearing URL that
  // reached this branch is by definition one we decided not to navigate to.
  const inAppHref =
    consentUrl && consentUrl.startsWith("/")
      ? consentUrl
      : buildConsentPath(CONSENT_FORM_PATH, appl);

  return (
    <div
      className={`w-full rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-sm ${className || ""}`}
    >
      {/* Shield icon with rotating dotted border */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Rotating dotted square border */}
          <div
            className="absolute inset-0 rounded-2xl border-[2.5px] border-dashed border-[#C5D4E8] animate-[dpdp-spin_12s_linear_infinite]"
          />
          {/* Inner solid shield background */}
          <div className="relative w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm text-primary">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L3 7V12C3 17.25 6.75 22.15 12 23C17.25 22.15 21 17.25 21 12V7L12 2Z"
                fill="currentColor"
              />
              <path
                d="M10 15.5L7.5 13L8.91 11.59L10 12.67L14.59 8.08L16 9.5L10 15.5Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Decorative blurred line */}
      <div className="flex justify-center mb-6">
        <div className="w-40 h-3 bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent rounded-full" />
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-[#101828] mb-3">
        Consent Pending
      </h2>

      {/* Description */}
      <p className="text-[15px] text-[#475467] max-w-sm mx-auto leading-relaxed mb-8">
        To continue onboarding and ensure your data is protected under
        the{" "}
        <span className="font-semibold text-[#1B3A5C]">
          Digital Personal Data Protection (DPDP) Act
        </span>
        , we need your consent. It only takes a minute to review and sign.
      </p>

      {/* CTA Button */}
      <Button
        asChild
        size="lg"
        className="font-semibold px-8 py-3 text-base shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
      >
        {goesOffSite ? (
          <a href={consentUrl} rel="noopener noreferrer">
            {isExternalJourney ? "Continue to Consent Portal" : "Go to Consent Form"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        ) : (
          <Link href={inAppHref}>
            Go to Consent Form
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </Button>

      {/* Keyframe animation for rotating dotted border */}
      <style jsx>{`
        @keyframes dpdp-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
