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
import { useAuth } from '@/lib/contexts/auth-context'
import { useOnboardingSubmit } from '@/lib/hooks/useOnboardingMutation'
import { useOnboardingForm } from '@/lib/hooks/useOnboardingForm'
import { OnboardingFormResponse } from '@/lib/types/onboarding'



const STORAGE_KEY = 'onboarding_draft'
const DEBOUNCE_MS = 500

/**
 * Shape of the onboarding context value.
 */
export interface OnboardingContextType {
  /** Current step index */
  currentStep: number
  /** Data for each step, keyed by step key */
  stepData: Record<string, Record<string, unknown>>
  /** Set of completed step keys */
  completedSteps: Set<string>
  /** Whether any step data has unsaved changes */
  isDirty: boolean
  /** Whether the context is loading initial data */
  isLoading: boolean
  /** Whether the API call failed */
  isError: boolean
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

  /** Submit all onboarding data */
  submitAll: () => Promise<void>
  /** Dynamic form configuration */
  formConfig?: OnboardingFormResponse
  /** Helper to get current value of a field across all steps */
  getFieldValue: (fieldname: string) => string | number | boolean | null | undefined | unknown
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
  const [status, setStatus] = useState<'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'>('draft')
  
  const userEmail = user?.email || user?.user_metadata?.email || ''
  const { 
    data: formConfig, 
    isLoading: isFormConfigLoading, 
    isError: isFormConfigError,
  } = useOnboardingForm(userEmail)
  
  const submitMutation = useOnboardingSubmit()

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadDone = useRef(false)

  const totalSteps = formConfig?.tabs ? formConfig.tabs.length + 1 : 0

  // Load data from formConfig on mount or when formConfig changes
  useEffect(() => {
    // If formConfig is loading, keep in loading state
    if (isFormConfigLoading) return

    // If there's an error or no formConfig, we still need to stop the loading state
    if (isFormConfigError || !formConfig) {
      if (!initialLoadDone.current) {
        setIsLoading(false)
        initialLoadDone.current = true
      }
      return
    }

    if (initialLoadDone.current) return

    const loadData = () => {
      try {
        // First check localStorage for any unsaved changes
        const localData = localStorage.getItem(STORAGE_KEY)
        let localParsed: { stepData?: Record<string, Record<string, unknown>>, currentStep?: number, completedSteps?: string[] } | null = null
        if (localData) {
          try {
            localParsed = JSON.parse(localData)
          } catch {
            localStorage.removeItem(STORAGE_KEY)
          }
        }

        const loadedStepData: Record<string, Record<string, unknown>> = {}

        // Initialize from formConfig tabs
        formConfig.tabs.forEach((tab) => {
          const key = tab.tab.toLowerCase().replace(/\s+/g, '_')
          loadedStepData[key] = {}
          tab.sections.forEach((section) => {
            section.fields.forEach((field) => {
              if (field.fieldtype === 'Table') {
                loadedStepData[key][field.fieldname] = []
              } else {
                loadedStepData[key][field.fieldname] = ''
              }
            })
          })
        })

        // Merge local data on top
        if (localParsed?.stepData) {
          const localStepData = localParsed.stepData
          Object.keys(localStepData).forEach((key) => {
            if (loadedStepData[key]) {
              loadedStepData[key] = { ...loadedStepData[key], ...localStepData[key] }
            }
          })
        }

        setStepDataState(loadedStepData)
        
        if (localParsed?.currentStep !== undefined) {
          setCurrentStep(localParsed.currentStep)
        }
        
        if (localParsed?.completedSteps) {
          setCompletedSteps(new Set(localParsed.completedSteps))
        }

        setStatus((formConfig as OnboardingFormResponse).boarding_status === 'Pending' ? 'draft' : 'submitted')
        
      } catch (error) {
        console.error('Error initializing onboarding data:', error)
      } finally {
        setIsLoading(false)
        initialLoadDone.current = true
      }
    }

    loadData()
  }, [formConfig, isFormConfigLoading, isFormConfigError])

  // Sync step from URL search params on mount
  useEffect(() => {
    if (!totalSteps) return
    const stepParam = searchParams.get('step')
    if (stepParam !== null) {
      const parsed = parseInt(stepParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed < totalSteps) {
        setCurrentStep(parsed)
      }
    }
  }, [searchParams, totalSteps])

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
      if (totalSteps && step >= 0 && step < totalSteps) {
        setCurrentStep(step)
        router.push(`/onboarding?step=${step}`, { scroll: false })
      }
    },
    [router, totalSteps]
  )

  // Navigate to the next step
  const nextStep = useCallback(() => {
    if (totalSteps && currentStep < totalSteps - 1) {
      const nextIdx = currentStep + 1
      setCurrentStep(nextIdx)
      router.push(`/onboarding?step=${nextIdx}`, { scroll: false })
    }
  }, [currentStep, router, totalSteps])

  // Navigate to the previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1
      setCurrentStep(prevIdx)
      router.push(`/onboarding?step=${prevIdx}`, { scroll: false })
    }
  }, [currentStep, router])


  const submitAll = useCallback(async () => {
    try {
      // Get correct user email
      const email = user?.email || user?.user_metadata?.email || 'unknown@example.com'

      await submitMutation.mutateAsync({
        stepData,
        userEmail: email,
      })

      setStatus('submitted')
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error submitting onboarding:', error)
      throw error
    }
  }, [stepData, user, submitMutation])

  const getFieldValue = useCallback((fieldname: string) => {
    for (const key in stepData) {
      if (stepData[key][fieldname] !== undefined) {
        return stepData[key][fieldname]
      }
    }
    return undefined
  }, [stepData])

  const contextValue: OnboardingContextType = {
    currentStep,
    stepData,
    completedSteps,
    isDirty,
    isLoading: isLoading || isFormConfigLoading,
    isError: isFormConfigError || (!isLoading && !isFormConfigLoading && !formConfig),
    isSaving: submitMutation.isPending,
    status,
    setStepData,
    goToStep,
    nextStep,
    prevStep,
    markStepComplete,

    submitAll,
    formConfig,
    getFieldValue,
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
