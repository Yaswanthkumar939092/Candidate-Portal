"use client"

import { Suspense } from 'react'
import { Loader2, ClipboardX, ArrowLeft } from 'lucide-react'
import { OnboardingProvider, useOnboarding } from '@/lib/contexts/onboarding-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OnboardingStepNav } from '@/components/onboarding/onboarding-step-nav'
import { ReviewStep } from '@/components/onboarding/steps/review-step'
import { OnboardingFormStep } from '@/components/onboarding/onboarding-form-step'
import { Progress } from '@/components/ui/progress'

/**
 * Inner onboarding content that consumes the onboarding context.
 *
 * Renders a sidebar navigation (desktop) alongside the currently
 * active step component with a page title and subtitle header.
 */
function OnboardingContent() {
  const { currentStep, completedSteps, isLoading, formConfig, status, isError } = useOnboarding()
  const router = useRouter()

  if (isLoading || (!formConfig && !isError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your onboarding data...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-red-500/10 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl shadow-red-500/10">
                <ClipboardX className="h-12 w-12 text-red-500" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#101828]">
              Onboarding not yet started
            </h1>
            <p className="text-lg text-[#475467]">
              It seems your onboarding journey hasn't been initialized yet. This usually happens while we're setting up your profile.
            </p>
          </div>

          <div className="pt-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl px-8 bg-[#101828] text-white hover:bg-[#101828]/90"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <p className="text-sm text-[#475467]">
            If you believe this is an error, please reach out to your HR coordinator.
          </p>
        </div>
      </div>
    )
  }

  // Use dynamic tabs from API
  const tabs = formConfig?.tabs || []
  
  // Total steps: one for each tab + one final review step
  const totalSteps = tabs.length + 1
  const progressPercentage = (completedSteps.size / totalSteps) * 100
  
  let stepTitle = ''
  let StepComponent: React.ReactNode = null

  if (currentStep < tabs.length) {
    const currentTab = tabs[currentStep]
    stepTitle = currentTab.tab
    StepComponent = (
      <OnboardingFormStep 
        tab={currentTab} 
        stepKey={currentTab.tab.toLowerCase().replace(/\s+/g, '_')} 
      />
    )
  } else {
    stepTitle = 'Review'
    StepComponent = <ReviewStep />
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobile progress indicator */}
      {status !== 'submitted' && (
        <div className="fixed left-0 right-0 top-16 z-10 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="mt-2" />
          <p className="mt-1 text-sm font-medium text-foreground">
            {stepTitle}
          </p>
        </div>
      )}

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
          {status !== 'submitted' && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">{stepTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Please fill in the details below accurately.
              </p>
            </div>
          )}

          {/* Current step */}
          {StepComponent}
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
