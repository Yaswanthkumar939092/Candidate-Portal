"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
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
  className,
}: OnboardingSnapshotProps) {
  const percentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const isComplete = percentage >= 100

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main onboarding card */}
      <div className="relative overflow-hidden rounded-xl border bg-[#1A1A2E] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left content */}
          <div className="flex-1 space-y-4">
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                isComplete
                  ? "border-green-400/30 bg-green-500/20 text-green-400"
                  : "border-white/20 bg-white/10 text-white"
              )}
            >
              {isComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
              {isComplete ? "Onboarding Complete" : "Onboarding In Progress"}
            </span>

            {/* Heading */}
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {isComplete && joiningDate
                ? `You are ready to join us on ${formatJoiningDateLong(joiningDate)}!`
                : `${completedSteps} of ${totalSteps} steps completed`}
            </h2>

            {/* Subtext */}
            <p className="max-w-lg text-sm text-white/70">
              {isComplete
                ? "All mandatory tasks and document submissions have been approved. We have prepared your workstation and access cards."
                : "Complete your onboarding tasks to get ready for your first day. Upload required documents and fill in your details."}
            </p>

            {/* CTA Button */}
            <Button
              asChild
              size="lg"
              className={cn(
                "mt-2",
                isComplete
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : ""
              )}
            >
              <Link href="/onboarding">
                View Your Journey
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right side: Circular progress */}
          <div className="relative flex shrink-0 flex-col items-center">
            <div className="relative">
              <CircularProgress
                value={percentage}
                size={140}
                strokeWidth={10}
                className={cn(
                  "[&_span]:text-white",
                  isComplete
                    ? "[&_circle:last-of-type]:text-green-500"
                    : ""
                )}
              />
              {/* "Ready" label below percentage inside the circle */}
              {isComplete && (
                <span className="absolute inset-0 flex items-center justify-center pt-8 text-xs font-medium text-white/70">
                  Ready
                </span>
              )}
            </div>
            {/* Small green check badge at bottom-right of circle */}
            {isComplete && (
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
