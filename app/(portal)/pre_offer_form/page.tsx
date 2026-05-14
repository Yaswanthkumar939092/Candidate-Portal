"use client"

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, ClipboardX, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { PreOfferProvider, usePreOffer } from '@/lib/contexts/pre-offer-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PreOfferStepNav } from '@/components/pre-offer-form/pre-offer-step-nav'
import { PreOfferFormStep } from '@/components/pre-offer-form/pre-offer-form-step'
import { Progress } from '@/components/ui/progress'
import { ReviewStep } from '@/components/pre-offer-form/review-step'

function PreOfferContent() {
  const { 
    currentStep, 
    completedSteps, 
    isLoading, 
    formConfig, 
    status, 
    isError 
  } = usePreOffer()
  const router = useRouter()

  if (isLoading || (!formConfig && !isError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Fetching pre-offer configuration...</p>
          <p className="text-xs text-slate-400">Setting up your dynamic workspace</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-red-500/10 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
                <ClipboardX className="h-12 w-12 text-red-500" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#101828] dark:text-white">
            Configuration Failed
          </h1>
          <p className="mt-4 text-lg text-[#475467] dark:text-slate-400 leading-relaxed">
            We couldn&apos;t fetch your dynamic Pre-Offer credentials. It might not be fully initialized yet.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => router.push('/action-center')}
              size="lg"
              className="h-12 rounded-xl px-8 bg-[#0F172A] text-white hover:bg-[#0F172A]/90 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Action Center
            </Button>
          </div>

          <p className="mt-6 text-xs text-slate-500 italic">
            If you keep seeing this, please ask your HR coordinator to re-trigger the task.
          </p>
        </div>
      </div>
    )
  }

  const tabs = formConfig?.tabs || []
  const totalSteps = tabs.length + 1
  const progressPercentage = (completedSteps.size / totalSteps) * 100

  let stepTitle = ''
  let StepComponent: React.ReactNode = null

  if (currentStep < tabs.length) {
    const currentTab = tabs[currentStep]
    stepTitle = currentTab?.tab || `Details Step ${currentStep + 1}`
    
    const stepKey = currentTab 
      ? (currentTab.tab || `Step ${currentStep + 1}`).toLowerCase().replace(/\s+/g, '_')
      : ''
      
    StepComponent = (
      <PreOfferFormStep
        key={currentStep}
        tab={currentTab}
        stepKey={stepKey}
      />
    )
  } else {
    stepTitle = 'Review & Submit'
    StepComponent = <ReviewStep />
  }

  const isSubmitted = status === 'Submitted'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      {/* Mobile Progress */}
      {!isSubmitted && (
        <div className="fixed left-0 right-0 top-16 z-10 border-b border-border bg-card px-4 py-3 lg:hidden shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Section {currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="mt-2 h-1.5 bg-slate-100" />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-[280px] shrink-0 lg:block bg-card">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          <PreOfferStepNav />
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 pt-24 md:px-6 lg:pt-8">
          
          {/* Success Banner */}
          {isSubmitted && (
            <div className="mb-8 flex items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300 shadow-sm">
              <div className="mt-0.5 rounded-full bg-green-100 p-1.5 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Form Submitted Successfully!</h3>
                <p className="mt-1 text-sm opacity-90 leading-relaxed">
                  Thank you for filling out your details. The HR team will review them shortly. Your information is now locked in read-only mode.
                </p>
                <div className="mt-4">
                  <Link 
                    href="/action-center"
                    className="inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4 hover:opacity-80"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Return to Action Center
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Top Headers */}
          {!isSubmitted && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                {stepTitle}
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentStep < tabs.length
                  ? 'Please fill out all required credentials carefully to proceed with your recruitment process.'
                  : 'Please review all your entries before final declaration and submission.'}
              </p>
            </div>
          )}

          {/* Rendering Step Content */}
          {StepComponent}
        </div>
      </main>
    </div>
  )
}

function PreOfferPageWrapper() {
  const searchParams = useSearchParams()
  const applicantEmail = searchParams.get('appl')

  if (!applicantEmail) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <ClipboardX className="h-10 w-10 text-slate-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Missing Candidate Context</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            This page requires a valid applicant parameter to initialize safely.
          </p>
          <div className="mt-6">
            <Link href="/action-center">
              <Button className="rounded-xl">Back to Action Center</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PreOfferProvider userEmail={decodeURIComponent(applicantEmail)}>
      <PreOfferContent />
    </PreOfferProvider>
  )
}

export default function PreOfferFormPage() {
  console.log("🚀 PreOfferFormPage loaded!");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Initializing workspace...</p>
          </div>
        </div>
      }
    >
      <PreOfferPageWrapper />
    </Suspense>
  )
}

// FS CHANGE TRIGGER: Force hot reload

