"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DpdpConsentCardProps {
  className?: string;
  consentUrl?: string;
}

/**
 * DPDP Consent Pending card shown on the dashboard when consent has not been submitted.
 * Features a shield icon with a rotating dotted border, matching the dpdp.png reference design.
 */
export function DpdpConsentCard({ className, consentUrl }: DpdpConsentCardProps) {
  return (
    <div
      className={`w-full rounded-3xl border border-[#E5E7EB] bg-white p-8 sm:p-12 text-center shadow-sm ${className || ""}`}
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
        <Link href={consentUrl || "/job_offer/consent"}>
          Go to Consent Form
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
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
