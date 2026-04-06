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
import { ONBOARDING_STEPS } from '@/lib/validation/onboarding-schemas'
import { useAuth } from '@/lib/contexts/auth-context'

function mapOnboardingDataToFrappe(onboardingData: Record<string, unknown>, userEmail: string) {
  const p = (onboardingData.personal_info as Record<string, unknown>) || {}
  const a = (onboardingData.address as Record<string, unknown>) || {}
  const currAddr = (a.current_address as Record<string, unknown>) || {}
  const permAddr = (a.permanent_address as Record<string, unknown>) || {}
  const i = (onboardingData.identity_documents as Record<string, unknown>) || {}
  const b = (onboardingData.bank_details as Record<string, unknown>) || {}
  const e = (onboardingData.emergency_contacts as Record<string, unknown>) || {}
  const edu = (onboardingData.education as Record<string, unknown>) || {}
  const emp = (onboardingData.employment_history as Record<string, unknown>) || {}

  const mappedData = {
    boarding_status: "Pending",
    date_of_joining: p.date_of_joining || new Date().toISOString().split('T')[0],
    boarding_begins_on: new Date().toISOString().split('T')[0],
    notify_users_by_email: 1,
    amended_from: "",
    custom_is_rehire: 0,
    custom_other_reason: "",
    custom_select_inactive_employee: "",
    custom_migrate_payroll_data: 0,
    custom_assign_back_reportees: 0,

    custom_gender: p.gender || "",
    custom_blood_group: p.blood_group || "",
    custom_marital_status: p.marital_status || "",
    custom_languages_known: p.languages_known || "",
    custom_fathers_full_name: p.fathers_full_name || "",
    custom_spouse_name: p.spouse_name || "",
    custom_mothers_full_name: p.mothers_full_name || "",
    custom_children: p.children || "",

    custom_upload_resume: p.resume_url || "",
    custom_upload_passport_size_photo: p.photo_url || "",

    custom_enable_web_clockin: 1,
    custom_ip_restrictions: "",
    custom_use_shift_blocks: 0,
    custom_enable_check_in: 1,
    custom_break_entry: 1,
    custom_ctc: "",
    custom_monthly: 0,
    custom_currency: "INR",
    custom_self_service: "Yes",
    custom_email: userEmail,
    custom_first_name: p.first_name || "",
    custom_personal_email_id: p.personal_email || "",
    custom_middle_name: p.middle_name || "",
    custom_primary_contact_number: p.primary_contact_number || "",
    custom_date_of_birth: p.date_of_birth || "",
    custom_date_of_joining: p.date_of_joining || "",
    custom_last_name: p.last_name || "",
    custom_office_mobile_number: p.office_mobile_number || "",
    custom_auto_activate: "Yes",

    custom_current_flat__house__wing: currAddr.flat_house_wing || "",
    custom_current_landmark: currAddr.landmark || "",
    custom_current_state: currAddr.state || "",
    custom_current_pincode: currAddr.pin_code || "",
    custom_current_street__locality__area: currAddr.street_locality_area || "",
    custom_current_city: currAddr.city || "",
    custom_current_country: currAddr.country || "",
    custom_upload_address_proof: a.address_proof_url || "",

    custom_permanent_flat__house__wing: permAddr.flat_house_wing || "",
    custom_permanent_landmark: permAddr.landmark || "",
    custom_permanent_state: permAddr.state || "",
    custom_permanent_pincode: permAddr.pin_code || "",
    custom_permanent_street__locality__area: permAddr.street_locality_area || "",
    custom_permanent_city: permAddr.city || "",
    custom_permanent_country: permAddr.country || "",

    custom_pan_number: i.pan_number || "",
    custom_name_as_per_pan: i.name_as_per_pan || "",
    custom_upload_pan_card: i.pan_document_url || "",
    custom_guardian_name: i.guardian_name || "",
    custom_date_of_birthpan: i.dob_pan || "",
    custom_aadhaar_number: i.aadhaar_number || "",
    custom_upload_aadhaarfront: i.aadhaar_document_url || "",
    custom_upload_aadhaarback: i.aadhaar_document_back_url || "",

    custom_bank_name: b.bank_name || "",
    custom_account_number: b.account_number || "",
    custom_upload_cancelled_cheque_passbook_statement: b.cheque_document_url || "",
    custom_ifsc_code: b.ifsc_code || "",
    custom_uan_numberoptional: b.uan_number || "",

    custom_emergency_contact_name: (e.contacts && Array.isArray(e.contacts) && e.contacts[0]) ? e.contacts[0].name : "",
    custom_relationship: (e.contacts && Array.isArray(e.contacts) && e.contacts[0]) ? e.contacts[0].relationship : "",
    custom_contact_number: (e.contacts && Array.isArray(e.contacts) && e.contacts[0]) ? e.contacts[0].phone_number : "",

    custom_education_details: (Array.isArray(edu.qualifications) ? edu.qualifications : []).map((q: Record<string, unknown>) => ({
      school_univ: q.institution || "",
      custom_university: q.university || "",
      qualification: q.degree || "",
      custom_educational_details: q.specialization || "",
      level: "",
      year_of_passing: q.year_of_passing ? parseInt(q.year_of_passing as string) : null,
      custom_passing_year: (q.year_of_passing as string) || "",
      class_per: q.percentage_or_cgpa || "",
      maj_opt_subj: q.specialization || "",
      custom_attachmentt: q.document_url || "",
      custom_activities: "",
      custom_this_is_my_highest_education_qualification: 1,
      custom_mode_of_learning: q.mode_of_learning || "Regular",
      custom_education_degree_naukri: q.degree || "",
      custom_education_category_naukri: "",
      custom_field_of_specialization_naukri: q.specialization || "",
      custom_percentage_naukri: q.percentage_or_cgpa || "",
      custom_employee_education: "",
      custom_educational_category: q.educational_category || "",
      custom_education_degree: q.degree || "",
      custom_field_of_specialisation: q.specialization || "",
      custom_course_typedegree_type_: q.course_type || "",
      custom_max_gpapercentage: parseFloat(q.percentage_or_cgpa as string) || null,
      custom_i_am_currently_a_student: 0,
      custom_start_date: q.start_date || "",
      custom_completion_date: q.end_date || "",
      custom_educational_documents_proofs: q.document_url || "",
      custom_notes: "",
      custom_please_enter_your_marks_obtained: q.percentage_or_cgpa || "",
      custom_month__year_of_passing: (q.year_of_passing as string) || "",
      custom_course_typedegree_type: "Full Time",
      custom_registration_number: q.registration_number || "",
      custom_educational_proof_degree: q.document_url || "",
      custom_to_date: "",
      custom_have_you_done_your_masters_from_iim: "No",
      custom_i_am_currently_pursuing_this_course: q.is_currently_pursuing ? 1 : 0
    })),

    custom_employment_details_custom: (Array.isArray(emp.experiences) ? emp.experiences : []).map((exp: Record<string, unknown>) => ({
      company_name: exp.company || "",
      designation: exp.designation || "",
      from_date: exp.from_date || "",
      to_date: exp.to_date || "",
      address: "",
      custom_total_experience_years: emp.total_experience_years || "",
      custom_are_you_fresher: emp.has_experience ? 0 : 1,
      custom_previous_annual_ctc: emp.previous_annual_ctc || ""
    })),

    custom_do_you_have__any_relatives_working_at_pw: "No"
  };

  return { email: userEmail, data: mappedData };
}

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

  const submitAll = useCallback(async () => {
    setIsSaving(true)
    try {
      // Get correct user email
      const userEmail = user?.email || user?.user_metadata?.email || 'unknown@example.com'

      // Map data for Frappe directly
      const payload = mapOnboardingDataToFrappe(stepData, userEmail)

      const frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://localhost:8000'
      const endpoint = `${frappeUrl}/api/method/recruitment.api.employee_onboarding.update_onboarding_details`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Frappe API error:', errorText)
        throw new Error('Failed to submit onboarding to Frappe: ' + errorText)
      }

      setStatus('submitted')
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error submitting onboarding:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [stepData, user])

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
