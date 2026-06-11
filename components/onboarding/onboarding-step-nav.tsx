"use client"

import Link from 'next/link'
import {
  Check,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { evaluateDependsOn } from '@/lib/onboarding-utils'

interface OnboardingStepNavProps {
  className?: string
}

/**
 * Sidebar navigation for the onboarding wizard.
 *
 * Features a blue header with title, subtitle, and progress bar,
 * followed by dynamic step items with status indicators
 * (active/completed/pending), and a "Back to Dashboard" link at the bottom.
 */
export function OnboardingStepNav({ className }: OnboardingStepNavProps) {
  const { currentStep, completedSteps, goToStep, formConfig, status, stepData } = useOnboarding()

  const tabs = formConfig?.tabs || []
  const steps = [
    ...tabs.map(t => ({
      key: t.tab.toLowerCase().replace(/\s+/g, '_'),
      label: t.tab,
      counts: t.field_counts
    })),
    { key: 'review', label: 'Review', counts: undefined }
  ]

  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0
    ? Math.round((completedSteps.size / totalSteps) * 100)
    : 0

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
          {steps.map((step, index) => {
            const isSubmitted = status !== 'draft'
            const isTabCompleted = step.counts
              ? (step.counts.total === (step.counts.filled + step.counts.approved))
              : completedSteps.has(step.key)
            const isCompleted = isSubmitted || isTabCompleted
            const isCurrent = index === currentStep
            const isPast = index < currentStep
            const isNextStep = index === currentStep + 1

            const doc: Record<string, any> = {}
            if (stepData) {
              Object.keys(stepData).forEach((key) => {
                Object.assign(doc, stepData[key])
              })
            }

            const currentTabMandatoryFieldsAreFilled = (() => {
              if (currentStep >= tabs.length) return false
              const currentTab = tabs[currentStep]
              if (!currentTab) return false

              let allFilled = true
              currentTab.sections.forEach(section => {
                section.fields.forEach(field => {
                  const isVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc))
                  if (!isVisible) return

                  const isMandatory =
                    field.is_mandatory ||
                    field.reqd ||
                    (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, doc))

                  if (!isMandatory) return

                  const fieldValue = doc[field.fieldname]
                  const normalizedValue =
                    typeof fieldValue === "string" ? fieldValue.trim() : fieldValue

                  const isTable = field.fieldtype === "Table"
                  if (isTable) {
                    const rows = Array.isArray(normalizedValue) ? (normalizedValue as Record<string, unknown>[]) : []
                    const visibleChildFields = field.child_fields?.filter(f => !f.hidden) || []
                    const mandatoryChildFields = visibleChildFields.filter(f => f.is_mandatory || f.reqd)

                    const isRowEmpty = (row: Record<string, unknown>) => {
                      return !visibleChildFields.some(cf => {
                        const val = row[cf.fieldname]
                        return val !== undefined && val !== null && String(val).trim() !== ""
                      })
                    }

                    const isRowValid = (row: Record<string, unknown>) => {
                      return mandatoryChildFields.every(cf => {
                        const val = row[cf.fieldname]
                        return val !== undefined && val !== null && String(val).trim() !== ""
                      })
                    }

                    const nonEmptyRows = rows.filter(row => !isRowEmpty(row))
                    if (nonEmptyRows.length === 0) {
                      allFilled = false
                    } else if (!nonEmptyRows.every(isRowValid)) {
                      allFilled = false
                    }
                  } else {
                    const isCheck = field.fieldtype === "Check"
                    if (isCheck) {
                      if (!Boolean(normalizedValue)) {
                        allFilled = false
                      }
                    } else {
                      if (
                        normalizedValue === undefined ||
                        normalizedValue === null ||
                        normalizedValue === ""
                      ) {
                        allFilled = false
                      }
                    }
                  }
                })
              })
              return allFilled
            })()

            const isClickable = isCompleted || isCurrent || isPast || (isNextStep && currentTabMandatoryFieldsAreFilled)

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
                <span className="truncate flex-1">{step.label}</span>
                {step.counts && (
                  <span className="text-xs font-medium tabular-nums opacity-60">
                    {step.counts.filled + step.counts.approved}/{step.counts.total}
                  </span>
                )}
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
