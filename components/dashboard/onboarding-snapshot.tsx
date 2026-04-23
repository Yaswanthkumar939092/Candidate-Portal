"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/shared/circular-progress"

interface OnboardingSnapshotProps {
  /** Number of onboarding steps that have been completed. */
  completedSteps: number
  /** Total number of onboarding steps (default: 8). */
  totalSteps?: number
  /** ISO date string for the joining date. */
  joiningDate?: string
  dashboardPayload?: Record<string, any>
  className?: string
}

/**
 * Formats an ISO date string into a human-friendly date like "September 8th".
 */
function formatJoiningDateLong(iso: string): string {
  const date = new Date(iso)
  const month = date.toLocaleDateString("en-US", { month: "long" })
  const day = date.getDate()
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th"
  return `${month} ${day}${suffix}`
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
  const percentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const isComplete = percentage >= 100
  const displayJoiningDate = (dashboardPayload?.date_of_joining as string) || joiningDate
  return (
    <div className={cn("space-y-4 border border-[#E5E7EB] rounded-[calc(1rem+8px)] p-2 bg-white shadow-sm", className)}>
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
                  : "text-gray-600 border border-gray-200"
              )}
            >
              {isComplete && <ShieldCheck className="h-4 w-4 text-[#12B76A]" />}
              {isComplete ? "ONBOARDING COMPLETE" : "ONBOARDING IN PROGRESS"}
            </span>

            {/* Heading */}
            <h2 className="text-[30px] font-bold text-[#101828] leading-tight">
              {isComplete && displayJoiningDate
                ? `You are ready to join us on ${formatJoiningDateLong(displayJoiningDate)}!`
                : `${completedSteps} of ${totalSteps} steps completed`}
            </h2>

            {/* Subtext */}
            <p className="max-w-xl text-[16px] font-normal text-[#475467]">
              {isComplete
                ? "All mandatory tasks and document submissions have been approved. We have prepared your workstation and access cards."
                : "Complete your onboarding tasks to get ready for your first day. Upload required documents and fill in your details."}
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-black text-white font-semibold hover:bg-black/80 rounded-xl"
              >
                <Link href="/onboarding">
                  View Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
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
                    : "[&_circle:last-of-type]:text-[#026AA2]"
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
  )
}
