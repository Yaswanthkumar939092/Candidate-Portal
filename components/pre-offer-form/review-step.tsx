"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Info,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePreOffer } from '@/lib/contexts/pre-offer-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import {
  reviewDeclarationSchema,
  type ReviewDeclarationData,
} from '@/lib/validation/onboarding-schemas'

interface ReviewSection {
  key: string
  label: string
  stepIndex: number
  getSummary: () => string
}

export function ReviewStep() {
  const {
    stepData,
    completedSteps,
    submitAll,
    prevStep,
    goToStep,
    isSaving,
    status,
    formConfig,
  } = usePreOffer()

  const isReadOnly = status === "Submitted" || status === "Filled"

  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewDeclarationData>({
    resolver: zodResolver(reviewDeclarationSchema),
    defaultValues: {
      declaration_accepted: undefined as unknown as true,
    },
  })

  const declarationAccepted = watch('declaration_accepted')

  const onSubmit = handleSubmit(async () => {
    try {
      setSubmitError(null)
      await submitAll()
      router.push('/action-center')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit. Please try again.'
      )
    }
  })

  const tabs = formConfig?.tabs || []

  const incompleteSteps = tabs
    .map((tab, idx) => ({ tab, originalIdx: idx }))
    .filter(({ tab, originalIdx }) => {
      const rawKey = tab.tab || `Step ${originalIdx + 1}`
      const key = rawKey.toLowerCase().replace(/\s+/g, '_')
      return !completedSteps.has(key)
    })

  const sections: ReviewSection[] = tabs.map((tab, idx) => {
    const rawKey = tab.tab || `Step ${idx + 1}`
    const key = rawKey.toLowerCase().replace(/\s+/g, '_')

    return {
      key,
      label: tab.tab || `Details Step ${idx + 1}`,
      stepIndex: idx,
      getSummary: () => {
        const data = stepData[key]
        if (!data) return ''

        const tableField = tab.sections.flatMap(s => s.fields).find(f => f.fieldtype === 'Table')
        if (tableField) {
          const items = data[tableField.fieldname] as unknown[]
          if (Array.isArray(items) && items.length > 0) {
            return `${items.length} ${tableField.label} Added`
          }
          return `No ${tableField.label} Added`
        }

        const values = Object.values(data).filter(v => v && typeof v === 'string').slice(0, 2)
        return values.join(', ')
      }
    }
  })

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key)
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-base font-bold text-foreground">Review All Details</h3>
        <Separator className="mt-2 mb-4" />

        {incompleteSteps.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Please complete all steps before submitting.
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {incompleteSteps.map(({ tab, originalIdx }) => {
                  const rawKey = tab.tab || `Step ${originalIdx + 1}`
                  const key = rawKey.toLowerCase().replace(/\s+/g, '_')
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => goToStep(originalIdx)}
                      className="text-xs text-primary underline hover:no-underline mr-2"
                    >
                      {tab.tab || `Step ${originalIdx + 1}`}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-border rounded-lg border border-border bg-white dark:bg-card">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.key
            const summary = section.getSummary()

            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="text-[15px] font-bold text-foreground">
                    {section.label}
                  </span>
                  <div className="flex items-center gap-3">
                    {summary && (
                      <span className="text-xs text-muted-foreground max-w-xs truncate">
                        {summary}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      {tabs[section.stepIndex].sections.map((s, sIdx) => (
                        <div key={sIdx}>
                          <p className="font-extrabold text-sm text-foreground uppercase tracking-wider mb-2">{s.section}</p>
                          <div className="space-y-1 ml-1">
                            {s.fields.map(f => {
                              const val = (stepData[section.key] || {})[f.fieldname]
                              if (f.hidden) return null

                              if (f.fieldtype === 'Table') {
                                const items = val as Record<string, unknown>[]
                                if (!Array.isArray(items) || items.length === 0) return (
                                  <p key={f.fieldname} className="italic text-xs">No {f.label} added</p>
                                )
                                return (
                                  <div key={f.fieldname} className="mt-2 space-y-2">
                                    {items.map((item, i) => (
                                      <div key={i} className="pl-3 border-l-2 border-primary/20 py-1 text-xs">
                                        {f.child_fields?.map(cf => {
                                          const cVal = item[cf.fieldname]
                                          if (!cVal || cf.hidden) return null
                                          return (
                                            <p key={cf.fieldname}>
                                              <span className="font-semibold text-foreground mr-1">{cf.label}:</span> {String(cVal)}
                                            </p>
                                          )
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                )
                              }

                              if (val === undefined || val === null || val === "") return null
                              return (
                                <p key={f.fieldname} className="text-xs">
                                  <span className="font-semibold text-foreground mr-1">{f.label}:</span> {String(val)}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => goToStep(section.stepIndex)}
                        className="mt-4 text-xs text-primary underline hover:no-underline font-medium"
                      >
                        Edit this section
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold text-foreground">Declaration</h3>
        <Separator className="mt-2 mb-5" />

        <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            I confirm all information is accurate and agree to background verification terms.
            I understand that any false information may lead to termination of my employment offer.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="declaration_accepted"
              checked={declarationAccepted === true}
              onCheckedChange={(checked) =>
                setValue(
                  'declaration_accepted',
                  checked === true ? true : (undefined as unknown as true),
                  { shouldValidate: true }
                )
              }
              disabled={isReadOnly || isSaving}
            />
            <Label
              htmlFor="declaration_accepted"
              className="cursor-pointer text-sm leading-relaxed text-foreground"
            >
              I have read and agree to the above declaration. I confirm that all information
              provided is accurate and complete.
            </Label>
          </div>
          {errors.declaration_accepted && (
            <p className="text-xs text-destructive">{errors.declaration_accepted.message}</p>
          )}

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          {!isReadOnly && (
            <>
              <Separator />
              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="ghost" onClick={prevStep} disabled={isSaving}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || incompleteSteps.length > 0}
                >
                  {isSaving ? 'Submitting...' : 'Submit'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </form>
      </section>
    </div>
  )
}
