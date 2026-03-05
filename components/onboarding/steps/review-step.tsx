"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import {
  reviewDeclarationSchema,
  type ReviewDeclarationData,
  ONBOARDING_STEPS,
} from '@/lib/validation/onboarding-schemas'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * Review section accordion item definition.
 */
interface ReviewSection {
  key: string
  label: string
  stepIndex: number
  getSummary: () => string
}

/**
 * Step 8: Review & Submit.
 *
 * Displays a "Review All Details" header with collapsible accordion
 * sections for each completed step, a declaration info box,
 * a declaration acceptance checkbox, and a Submit button.
 */
export function ReviewStep() {
  const {
    stepData,
    completedSteps,
    saveDraft,
    submitAll,
    prevStep,
    goToStep,
    isSaving,
    status,
  } = useOnboarding()

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
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit. Please try again.'
      )
    }
  })

  // Success state
  if (status === 'submitted') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Onboarding Submitted!</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your onboarding information has been submitted successfully. Our HR team will review your
          details and get back to you shortly.
        </p>
      </div>
    )
  }

  const personalInfo = stepData.personal_info as Record<string, unknown> | undefined
  const address = stepData.address as Record<string, unknown> | undefined
  const identity = stepData.identity_documents as Record<string, unknown> | undefined
  const bank = stepData.bank_details as Record<string, unknown> | undefined
  const education = stepData.education as Record<string, unknown> | undefined
  const employment = stepData.employment_history as Record<string, unknown> | undefined

  const requiredSteps = ONBOARDING_STEPS.slice(0, 7)
  const incompleteSteps = requiredSteps.filter((step) => !completedSteps.has(step.key))

  /** Review sections configuration */
  const sections: ReviewSection[] = [
    {
      key: 'personal_info',
      label: 'Personal Info',
      stepIndex: 0,
      getSummary: () => {
        if (!personalInfo) return ''
        const name = `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim()
        return name || ''
      },
    },
    {
      key: 'address',
      label: 'Address',
      stepIndex: 1,
      getSummary: () => {
        if (!address) return ''
        const curr = address.current_address as Record<string, string> | undefined
        if (curr) {
          return [curr.city, curr.state].filter(Boolean).join(', ')
        }
        return ''
      },
    },
    {
      key: 'identity_documents',
      label: 'Identity',
      stepIndex: 2,
      getSummary: () => {
        if (!identity) return ''
        const parts: string[] = []
        if (identity.pan_number) parts.push('PAN')
        if (identity.aadhaar_number) parts.push('Aadhaar')
        return parts.join('... ') || ''
      },
    },
    {
      key: 'bank_details',
      label: 'Bank',
      stepIndex: 3,
      getSummary: () => {
        if (!bank) return ''
        return (bank.bank_name as string) || ''
      },
    },
    {
      key: 'education',
      label: 'Education',
      stepIndex: 5,
      getSummary: () => {
        if (!education) return ''
        const quals = education.qualifications as Array<Record<string, string>> | undefined
        if (quals && quals.length > 0) {
          return `${quals.length} Qualification${quals.length > 1 ? 's' : ''} Added`
        }
        return ''
      },
    },
    {
      key: 'employment_history',
      label: 'Employment',
      stepIndex: 6,
      getSummary: () => {
        if (!employment) return ''
        if (employment.has_experience === false) return 'Fresher'
        const exps = employment.experiences as Array<Record<string, unknown>> | undefined
        if (exps && exps.length > 0) {
          return `${exps.length} Experience${exps.length > 1 ? 's' : ''}`
        }
        return 'Years Experience'
      },
    },
  ]

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key)
  }

  return (
    <div className={cn("space-y-8")}>
      {/* Review All Details */}
      <section>
        <h3 className="text-base font-bold text-foreground">Review All Details</h3>
        <Separator className="mt-2 mb-4" />

        {/* Incomplete steps warning */}
        {incompleteSteps.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Please complete all steps before submitting.
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {incompleteSteps.map((step) => {
                  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === step.key)
                  return (
                    <button
                      key={step.key}
                      onClick={() => goToStep(idx)}
                      className="text-xs text-primary underline hover:no-underline"
                    >
                      {step.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Accordion sections */}
        <div className="divide-y divide-border rounded-lg border border-border">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.key
            const isComplete = completedSteps.has(section.key)
            const summary = section.getSummary()

            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {summary && (
                      <span className="text-xs text-muted-foreground">
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
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {section.key === 'personal_info' && personalInfo && (
                        <>
                          <p>Name: {`${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim()}</p>
                          {personalInfo.gender && <p>Gender: {personalInfo.gender as string}</p>}
                          {personalInfo.date_of_birth && <p>DOB: {personalInfo.date_of_birth as string}</p>}
                          {personalInfo.personal_email && <p>Email: {personalInfo.personal_email as string}</p>}
                          {personalInfo.phone && <p>Phone: {personalInfo.phone as string}</p>}
                        </>
                      )}
                      {section.key === 'address' && address && (
                        <>
                          {address.current_address && (
                            <p>Current: {formatAddress(address.current_address as Record<string, string>)}</p>
                          )}
                          {address.permanent_address && (
                            <p>Permanent: {formatAddress(address.permanent_address as Record<string, string>)}</p>
                          )}
                        </>
                      )}
                      {section.key === 'identity_documents' && identity && (
                        <>
                          {identity.pan_number && <p>PAN: {identity.pan_number as string}</p>}
                          {identity.aadhaar_number && <p>Aadhaar: {identity.aadhaar_number as string}</p>}
                        </>
                      )}
                      {section.key === 'bank_details' && bank && (
                        <>
                          {bank.bank_name && <p>Bank: {bank.bank_name as string}</p>}
                          {bank.ifsc_code && <p>IFSC: {bank.ifsc_code as string}</p>}
                          {bank.account_number && (
                            <p>A/C: ****{(bank.account_number as string).slice(-4)}</p>
                          )}
                        </>
                      )}
                      {section.key === 'education' && education && (
                        <>
                          {Array.isArray(education.qualifications) &&
                            (education.qualifications as Array<Record<string, string>>).map((q, i) => (
                              <p key={i}>{q.degree} - {q.institution}</p>
                            ))}
                        </>
                      )}
                      {section.key === 'employment_history' && employment && (
                        <>
                          {employment.has_experience === false && <p>No prior work experience (Fresher)</p>}
                          {employment.has_experience && Array.isArray(employment.experiences) &&
                            (employment.experiences as Array<Record<string, unknown>>).map((exp, i) => (
                              <p key={i}>{String(exp.designation || '')} at {String(exp.company || '')}</p>
                            ))}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(section.stepIndex)}
                      className="mt-2 text-xs text-primary underline hover:no-underline"
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

      {/* Declaration */}
      <section>
        <h3 className="text-base font-bold text-foreground">Declaration</h3>
        <Separator className="mt-2 mb-5" />

        {/* Blue info box */}
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

          {/* Navigation */}
          <Separator />
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={prevStep}>
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
        </form>
      </section>
    </div>
  )
}

/** Format an address object into a single line. */
function formatAddress(addr: Record<string, string>): string {
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pin_code, addr.country].filter(
    Boolean
  )
  return parts.join(', ')
}
