"use client"

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { OnboardingProvider, useOnboarding } from '@/lib/contexts/onboarding-context'
import { OnboardingStepNav } from '@/components/onboarding/onboarding-step-nav'
import { PersonalInfoStep } from '@/components/onboarding/steps/personal-info-step'
import { AddressDetailsStep } from '@/components/onboarding/steps/address-details-step'
import { IdentityVerificationStep } from '@/components/onboarding/steps/identity-verification-step'
import { BankDetailsStep } from '@/components/onboarding/steps/bank-details-step'
import { EmergencyContactStep } from '@/components/onboarding/steps/emergency-contact-step'
import { EducationStep } from '@/components/onboarding/steps/education-step'
import { EmploymentStep } from '@/components/onboarding/steps/employment-step'
import { ReviewStep } from '@/components/onboarding/steps/review-step'
import { ONBOARDING_STEPS } from '@/lib/validation/onboarding-schemas'
import { Progress } from '@/components/ui/progress'

/** Map step index to the correct component. */
const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  0: PersonalInfoStep,
  1: AddressDetailsStep,
  2: IdentityVerificationStep,
  3: BankDetailsStep,
  4: EmergencyContactStep,
  5: EducationStep,
  6: EmploymentStep,
  7: ReviewStep,
}

/** Step names for the page title (matching the screenshot naming). */
const STEP_TITLES: Record<number, string> = {
  0: 'Personal Info',
  1: 'Address Details',
  2: 'Identity Verification',
  3: 'Bank Details',
  4: 'Emergency Contact',
  5: 'Education',
  6: 'Employment',
  7: 'Review',
}

/**
 * Inner onboarding content that consumes the onboarding context.
 *
 * Renders a sidebar navigation (desktop) alongside the currently
 * active step component with a page title and subtitle header.
 */
function OnboardingContent() {
  const { currentStep, completedSteps, isLoading } = useOnboarding()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your onboarding data...</p>
        </div>
      </div>
    )
  }

  const StepComponent = STEP_COMPONENTS[currentStep] ?? PersonalInfoStep
  const progressPercentage = (completedSteps.size / ONBOARDING_STEPS.length) * 100
  const stepTitle = STEP_TITLES[currentStep] || ONBOARDING_STEPS[currentStep]?.label || 'Onboarding'

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobile progress indicator */}
      <div className="fixed left-0 right-0 top-16 z-10 border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>
          <span>{Math.round(progressPercentage)}% complete</span>
        </div>
        <Progress value={progressPercentage} className="mt-2" />
        <p className="mt-1 text-sm font-medium text-foreground">
          {stepTitle}
        </p>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          <OnboardingStepNav />
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-6 py-8 pt-20 lg:pt-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{stepTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Please fill in the details below accurately.
            </p>
          </div>

          {/* Current step */}
          <StepComponent />
        </div>
      </main>
    </div>
  )
}

/**
 * Onboarding page.
 *
 * Wraps the content in the OnboardingProvider (which reads searchParams)
 * inside a Suspense boundary as required by Next.js for components that
 * use `useSearchParams`.
 */
export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingProvider>
        <OnboardingContent />
      </OnboardingProvider>
    </Suspense>
  )
}
