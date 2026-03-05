"use client"

import Link from 'next/link'
import {
  Check,
  ArrowLeft,
  User,
  MapPin,
  Shield,
  Building2,
  Phone,
  GraduationCap,
  Briefcase,
  FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ONBOARDING_STEPS } from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'

/**
 * Icon map for each onboarding step for the sidebar display.
 */
const STEP_ICONS: Record<number, React.ElementType> = {
  0: User,
  1: MapPin,
  2: Shield,
  3: Building2,
  4: Phone,
  5: GraduationCap,
  6: Briefcase,
  7: FileCheck,
}

interface OnboardingStepNavProps {
  className?: string
}

/**
 * Sidebar navigation for the onboarding wizard.
 *
 * Features a blue header with title, subtitle, and progress bar,
 * followed by 8 numbered step items with status indicators
 * (active/completed/pending), and a "Back to Dashboard" link at the bottom.
 */
export function OnboardingStepNav({ className }: OnboardingStepNavProps) {
  const { currentStep, completedSteps, goToStep } = useOnboarding()

  const progressPercentage = Math.round(
    (completedSteps.size / ONBOARDING_STEPS.length) * 100
  )

  return (
    <nav
      className={cn(
        "flex h-full flex-col bg-card border-r border-border",
        className
      )}
      aria-label="Onboarding steps"
    >
      {/* Blue header section */}
      <div className="bg-primary px-5 py-5">
        <h2 className="text-lg font-bold text-primary-foreground">
          Onboarding
        </h2>
        <p className="mt-0.5 text-xs text-primary-foreground/80">
          Complete your profile to get started.
        </p>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.key)
            const isCurrent = index === currentStep
            const isPast = index < currentStep
            const isClickable = isCompleted || isCurrent || isPast

            return (
              <button
                key={step.key}
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isCurrent && "bg-primary/10 text-primary font-medium",
                  isCompleted && !isCurrent && "text-green-700 dark:text-green-400 hover:bg-muted",
                  isPast && !isCompleted && !isCurrent && "text-muted-foreground hover:bg-muted",
                  !isClickable && "cursor-not-allowed text-muted-foreground/60"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step indicator circle */}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isCompleted &&
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    isCurrent &&
                      !isCompleted &&
                      "bg-primary text-primary-foreground",
                    !isCompleted &&
                      !isCurrent &&
                      "border border-border bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Step label */}
                <span className="truncate">{step.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Back to Dashboard link */}
      <div className="border-t border-border px-5 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </nav>
  )
}
