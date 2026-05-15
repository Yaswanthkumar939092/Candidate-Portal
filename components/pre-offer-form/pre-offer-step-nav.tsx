"use client"

import Link from 'next/link'
import {
  Check,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePreOffer } from '@/lib/contexts/pre-offer-context'

interface PreOfferStepNavProps {
  className?: string
}

export function PreOfferStepNav({ className }: PreOfferStepNavProps) {
  const { currentStep, completedSteps, goToStep, formConfig, status } = usePreOffer()

  const tabs = formConfig?.tabs || []
  const steps = [
    ...tabs.map((t, index) => ({
      key: (t.tab || `Step ${index + 1}`).toLowerCase().replace(/\s+/g, '_'),
      label: t.tab || `Form Details`,
      counts: t.field_counts
    })),
    { key: 'review', label: 'Review', counts: undefined }
  ]

  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0
    ? Math.round((completedSteps.size / (tabs.length + 1)) * 100)
    : 0

  return (
    <nav
      className={cn(
        "flex h-full flex-col bg-card border-r border-border",
        className
      )}
      aria-label="Pre-offer form steps"
    >
      <div className="bg-primary px-5 py-5 text-primary-foreground">
        <h2 className="text-lg font-bold">
          Pre-Offer Details
        </h2>
        <p className="mt-0.5 text-xs opacity-80">
          Provide all required credentials.
        </p>
        
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          {steps.map((step, index) => {
            const isSubmitted = status === 'Submitted' || status === 'Filled'
            const isCompleted = isSubmitted || completedSteps.has(step.key)
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

                <span className="truncate flex-1">{step.label}</span>
                {step.counts && (
                  <span className="text-xs font-medium tabular-nums opacity-60">
                    {step.counts.filled}/{step.counts.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Link
          href="/action-center"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Action Center
        </Link>
      </div>
    </nav>
  )
}
