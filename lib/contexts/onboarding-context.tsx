"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ONBOARDING_STEPS, type OnboardingStepKey } from '@/lib/validation/onboarding-schemas'
import { useAuth } from '@/lib/contexts/auth-context'

const STORAGE_KEY = 'onboarding_draft'
const DEBOUNCE_MS = 500

/**
 * Shape of the onboarding context value.
 */
export interface OnboardingContextType {
  /** Current step index (0-7) */
  currentStep: number
  /** Data for each step, keyed by step key */
  stepData: Record<string, Record<string, unknown>>
  /** Set of completed step keys */
  completedSteps: Set<string>
  /** Whether any step data has unsaved changes */
  isDirty: boolean
  /** Whether the context is loading initial data */
  isLoading: boolean
  /** Whether a save operation is in progress */
  isSaving: boolean
  /** Overall onboarding status */
  status: 'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'
  /** Update data for a specific step */
  setStepData: (stepKey: string, data: Record<string, unknown>) => void
  /** Navigate to a specific step */
  goToStep: (step: number) => void
  /** Navigate to the next step */
  nextStep: () => void
  /** Navigate to the previous step */
  prevStep: () => void
  /** Mark a step as completed */
  markStepComplete: (stepKey: string) => void
  /** Save all current data as a draft */
  saveDraft: () => Promise<void>
  /** Submit all onboarding data */
  submitAll: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

interface OnboardingProviderProps {
  children: React.ReactNode
}

/**
 * Provides onboarding wizard state management.
 *
 * Features:
 * - Loads existing data from the API on mount.
 * - Persists draft data to localStorage with debouncing.
 * - Syncs the current step with the URL search params (?step=N).
 * - Provides save-draft and submit-all operations via API routes.
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [stepData, setStepDataState] = useState<Record<string, Record<string, unknown>>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'>('draft')

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadDone = useRef(false)

  // Load data from API on mount
  useEffect(() => {
    if (!user || initialLoadDone.current) return

    const loadData = async () => {
      try {
        // First check localStorage for any unsaved changes
        const localData = localStorage.getItem(STORAGE_KEY)
        let localParsed: Record<string, unknown> | null = null
        if (localData) {
          try {
            localParsed = JSON.parse(localData)
          } catch {
            localStorage.removeItem(STORAGE_KEY)
          }
        }

        // Fetch from API
        const response = await fetch('/api/onboarding', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            const apiData = result.data
            const loadedStepData: Record<string, Record<string, unknown>> = {}

            for (const step of ONBOARDING_STEPS) {
              const key = step.key
              if (apiData[key] && typeof apiData[key] === 'object') {
                loadedStepData[key] = apiData[key] as Record<string, unknown>
              }
            }

            // Merge local data on top of API data (local takes precedence if it exists)
            if (localParsed && typeof localParsed === 'object' && 'stepData' in localParsed) {
              const localStepData = (localParsed as { stepData: Record<string, Record<string, unknown>> }).stepData
              for (const key of Object.keys(localStepData)) {
                if (localStepData[key] && Object.keys(localStepData[key]).length > 0) {
                  loadedStepData[key] = { ...loadedStepData[key], ...localStepData[key] }
                }
              }
            }

            setStepDataState(loadedStepData)
            setCurrentStep(apiData.current_step || 0)
            setStatus(apiData.status || 'draft')

            if (apiData.completed_steps && Array.isArray(apiData.completed_steps)) {
              setCompletedSteps(new Set(apiData.completed_steps))
            }
          }
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error)

        // Fall back to localStorage only
        const localData = localStorage.getItem(STORAGE_KEY)
        if (localData) {
          try {
            const parsed = JSON.parse(localData)
            if (parsed.stepData) setStepDataState(parsed.stepData)
            if (parsed.completedSteps) setCompletedSteps(new Set(parsed.completedSteps))
            if (typeof parsed.currentStep === 'number') setCurrentStep(parsed.currentStep)
          } catch {
            // Ignore corrupted localStorage
          }
        }
      } finally {
        setIsLoading(false)
        initialLoadDone.current = true
      }
    }

    loadData()
  }, [user])

  // Sync step from URL search params on mount
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam !== null) {
      const parsed = parseInt(stepParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed < ONBOARDING_STEPS.length) {
        setCurrentStep(parsed)
      }
    }
  }, [searchParams])

  // Auto-save to localStorage on change (debounced)
  useEffect(() => {
    if (!isDirty || isLoading) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const toSave = {
          stepData,
          completedSteps: Array.from(completedSteps),
          currentStep,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [stepData, completedSteps, currentStep, isDirty, isLoading])

  // Update data for a specific step
  const setStepData = useCallback(
    (stepKey: string, data: Record<string, unknown>) => {
      setStepDataState((prev) => ({
        ...prev,
        [stepKey]: data,
      }))
      setIsDirty(true)
    },
    []
  )

  // Mark a step as completed
  const markStepComplete = useCallback((stepKey: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(stepKey)
      return next
    })
  }, [])

  // Navigate to a specific step and update URL
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < ONBOARDING_STEPS.length) {
        setCurrentStep(step)
        router.push(`/onboarding?step=${step}`, { scroll: false })
      }
    },
    [router]
  )

  // Navigate to the next step
  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextIdx = currentStep + 1
      setCurrentStep(nextIdx)
      router.push(`/onboarding?step=${nextIdx}`, { scroll: false })
    }
  }, [currentStep, router])

  // Navigate to the previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1
      setCurrentStep(prevIdx)
      router.push(`/onboarding?step=${prevIdx}`, { scroll: false })
    }
  }, [currentStep, router])

  // Save all current data as a draft via the API
  const saveDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {}

      // Include each step's data under its key
      for (const step of ONBOARDING_STEPS) {
        if (stepData[step.key]) {
          body[step.key] = stepData[step.key]
        }
      }

      body.current_step = currentStep
      body.completed_steps = Array.from(completedSteps)

      const response = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save draft')
      }

      setIsDirty(false)
      // Clear localStorage after successful API save
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error saving draft:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [stepData, currentStep, completedSteps])

  // Submit all onboarding data
  const submitAll = useCallback(async () => {
    setIsSaving(true)
    try {
      // First save the latest draft
      await saveDraft()

      // Then submit
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit onboarding')
      }

      setStatus('submitted')
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error submitting onboarding:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [saveDraft])

  const contextValue: OnboardingContextType = {
    currentStep,
    stepData,
    completedSteps,
    isDirty,
    isLoading,
    isSaving,
    status,
    setStepData,
    goToStep,
    nextStep,
    prevStep,
    markStepComplete,
    saveDraft,
    submitAll,
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}

/**
 * Hook to consume the OnboardingContext.
 *
 * @throws Error if used outside of an `<OnboardingProvider>`.
 */
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
