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
import { toast } from 'sonner'
import { useJobApp } from '@/lib/contexts/job-application-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { useCreateJobApplicant, useDeleteDraftJobApplicant } from '@/lib/hooks/useJobOpening'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  reviewDeclarationSchema,
  type ReviewDeclarationData,
} from '@/lib/validation/onboarding-schemas'

interface JobApplicationReviewStepProps {
  completedSteps: Set<string>
  goToStep: (index: number) => void
  onPrev: () => void
  jobID: string
  draftName: string | null
}

export function JobApplicationReviewStep({
  completedSteps,
  goToStep,
  onPrev,
  jobID,
  draftName,
}: JobApplicationReviewStepProps) {
  const { tabs, stepData } = useJobApp()
  const { user } = useAuth()
  const { mutate: createApplicant, isPending } = useCreateJobApplicant()
  const { mutate: deleteDraft } = useDeleteDraftJobApplicant()
  const router = useRouter()
  const userEmail = user?.email || user?.user_metadata?.email || ''
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

  const incompleteSteps = tabs
    .map((tab: any, idx: number) => ({ tab, originalIdx: idx }))
    .filter(({ tab, originalIdx }: { tab: any; originalIdx: number }) => {
      const rawKey = tab.tab || `Step ${originalIdx + 1}`
      const key = rawKey.toLowerCase().replace(/\s+/g, '_')
      return !completedSteps.has(key)
    })

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key)
  }

  const onSubmit = handleSubmit(async () => {
    try {
      setSubmitError(null)

      const mergedData: Record<string, unknown> = {}
      tabs.forEach((tab: any) => {
        const key = tab.tab.toLowerCase().replace(/\s+/g, '_')
        const data = stepData[key] || {}
        Object.entries(data).forEach(([fieldName, value]) => {
          mergedData[fieldName] = value === '' || value === undefined ? null : value
        })
      })

      const payload = {
        opening: jobID,
        data: {
          ...mergedData,
          email_id: userEmail || null,
        },
      }

      createApplicant(payload, {
        onSuccess: () => {
          toast.success('Application submitted successfully!')
          if (draftName) {
            deleteDraft({ email: userEmail, jobId: jobID })
          }
          router.push(`/open-jobs/${jobID}/apply-job/thank-you`)
        },
        onError: (err: any) => {
          const errMsg = err?.message || 'Submission failed. Please try again.'
          toast.error(errMsg)
          setSubmitError(errMsg)
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit. Please try again.'
      )
    }
  })

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
                {incompleteSteps.map(({ tab, originalIdx }: { tab: any; originalIdx: number }) => {
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
          {tabs.map((tab: any, idx: number) => {
            const rawKey = tab.tab || `Step ${idx + 1}`
            const key = rawKey.toLowerCase().replace(/\s+/g, '_')
            const isExpanded = expandedSection === key
            const data = stepData[key]

            const getSummary = () => {
              if (!data) return ''
              const tableField = tab.sections.flatMap((s: any) => s.fields).find((f: any) => f.fieldtype === 'Table')
              if (tableField) {
                const items = data[tableField.fieldname] as unknown[]
                if (Array.isArray(items) && items.length > 0) {
                  return `${items.length} ${tableField.label} Added`
                }
                return `No ${tableField.label} Added`
              }
              const values = Object.values(data).filter(v => v && typeof v === 'string').slice(0, 2)
              return (values as string[]).join(', ')
            }

            const summary = getSummary()

            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="text-[15px] font-bold text-foreground">
                    {tab.tab || `Step ${idx + 1}`}
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
                      {tab.sections.map((s: any, sIdx: number) => (
                        <div key={sIdx}>
                          <p className="font-extrabold text-sm text-foreground uppercase tracking-wider mb-2">
                            {s.section}
                          </p>
                          <div className="space-y-1 ml-1">
                            {s.fields.map((f: any) => {
                              const val = (data || {})[f.fieldname]
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
                                        {f.child_fields?.map((cf: any) => {
                                          const cVal = item[cf.fieldname]
                                          if (!cVal || cf.hidden) return null
                                          return (
                                            <p key={cf.fieldname}>
                                              <span className="font-semibold text-foreground mr-1">{cf.label}:</span>{String(cVal)}
                                            </p>
                                          )
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                )
                              }

                              if (val === undefined || val === null || val === '') return null
                              return (
                                <p key={f.fieldname} className="text-xs">
                                  <span className="font-semibold text-foreground mr-1">{f.label}:</span>{String(val)}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(idx)}
                      className="mt-4 text-xs text-primary underline hover:no-underline font-medium"
                    >
                      Edit this section
                    </button>
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
            I confirm all information provided is accurate and complete.
            I understand that any false information may result in disqualification from the application process.
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
              disabled={isPending}
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

          <Separator />
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={onPrev} disabled={isPending}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending || incompleteSteps.length > 0}
            >
              {isPending ? 'Submitting...' : 'Submit Application'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}