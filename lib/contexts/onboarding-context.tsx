"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useOnboardingSubmit } from "@/lib/hooks/useOnboardingMutation";
import { useOnboardingForm } from "@/lib/hooks/useOnboardingForm";
import { OnboardingForm } from "@/lib/types/onboarding";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { evaluateDependsOn, isFieldFilled } from "@/lib/onboarding-utils";
const DEBOUNCE_MS = 500;

/**
 * Shape of the onboarding context value.
 */
export interface OnboardingContextType {
  /** Current step index */
  currentStep: number;
  /** Data for each step, keyed by step key */
  stepData: Record<string, Record<string, unknown>>;
  /** Set of completed step keys */
  completedSteps: Set<string>;
  /** Whether any step data has unsaved changes */
  isDirty: boolean;
  /** Whether the context is loading initial data */
  isLoading: boolean;
  /** Whether the API call failed */
  isError: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Overall onboarding status */
  status: "draft" | "submitted" | "approved" | "pushed_to_frappe";
  /** Update data for a specific step */
  setStepData: (stepKey: string, data: Record<string, unknown>) => void;
  /** Navigate to a specific step */
  goToStep: (step: number) => void;
  /** Navigate to the next step */
  nextStep: () => void;
  /** Navigate to the previous step */
  prevStep: () => void;
  /** Mark a step as completed */
  markStepComplete: (stepKey: string) => void;

  /** Submit all onboarding data */
  submitAll: (
    action: "save" | "submit",
    updatedStepKey?: string,
    updatedData?: Record<string, unknown>,
  ) => Promise<void>;
  /** Dynamic form configuration */
  formConfig?: OnboardingForm;
  /** Helper to get current value of a field across all steps */
  getFieldValue: (
    fieldname: string,
  ) => string | number | boolean | null | undefined | unknown;
  /** Register form submit handler */
  registerSubmitTrigger?: (
    trigger: (action: "save_continue" | "save_draft") => Promise<boolean | void>
  ) => () => void;
  /** Trigger form submission programmatically */
  triggerSubmit?: (
    action: "save_continue" | "save_draft"
  ) => Promise<boolean | void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

interface OnboardingProviderProps {
  children: React.ReactNode;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepDataState] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<
    "draft" | "submitted" | "approved" | "pushed_to_frappe"
  >("draft");

  const userEmail = user?.email || user?.user_metadata?.email || "";
  const {
    data: formConfig,
    isLoading: isFormConfigLoading,
    isError: isFormConfigError,
  } = useOnboardingForm(userEmail);
  const submitMutation = useOnboardingSubmit();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  const totalSteps = formConfig?.tabs ? formConfig.tabs.length + 1 : 0;

  // Load data from formConfig on mount or when formConfig changes
  useEffect(() => {
    // If formConfig is loading, keep in loading state
    if (isFormConfigLoading) return;

    // If there's an error or no formConfig, we still need to stop the loading state
    if (isFormConfigError || !formConfig) {
      if (!initialLoadDone.current) {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
      return;
    }

    if (initialLoadDone.current) return;

    const loadData = () => {
      try {
        const loadedStepData: Record<string, Record<string, unknown>> = {};

        // Initialize from formConfig tabs
        formConfig.tabs.forEach((tab) => {
          const key = tab.tab.toLowerCase().replace(/\s+/g, "_");
          loadedStepData[key] = {};
          tab.sections.forEach((section) => {
            section.fields.forEach((field) => {
              const fieldValue =
                field.value !== undefined ? field.value : field.default;

              if (fieldValue !== undefined && fieldValue !== null) {
                loadedStepData[key][field.fieldname] = fieldValue;
              } else if (field.fieldtype === "Table") {
                loadedStepData[key][field.fieldname] = [];
              } else {
                loadedStepData[key][field.fieldname] = "";
              }
            });
          });
        });

        setStepDataState(loadedStepData);

        const isSubmitted = formConfig.status === "Completed";
        setStatus(isSubmitted ? "submitted" : "draft");

        if (isSubmitted) {
          // If submitted, mark all steps as completed
          const allStepKeys = formConfig.tabs.map((t) =>
            t.tab.toLowerCase().replace(/\s+/g, "_")
          );
          setCompletedSteps(new Set(allStepKeys));
        } else {
          // Initialize completed steps based on fields that already have values in formConfig
          const initialCompleted = new Set<string>();
          const onboardingDoc = Object.values(loadedStepData).reduce<
            Record<string, unknown>
          >((document, fields) => Object.assign(document, fields), {});
          formConfig.tabs.forEach((tab) => {
            const key = tab.tab.toLowerCase().replace(/\s+/g, "_");
            let hasMandatory = false;
            let allMandatoryFilled = true;
            tab.sections.forEach((section) => {
              section.fields.forEach((field) => {
                const isMandatory = field.is_mandatory || field.reqd || (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, onboardingDoc));
                const isVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, onboardingDoc));
                
                if (isMandatory && isVisible) {
                  hasMandatory = true;
                  if (!isFieldFilled(field, onboardingDoc)) {
                    allMandatoryFilled = false;
                  }
                }
              });
            });
            const hasAnyValue = Object.values(loadedStepData[key] || {}).some(v => v !== undefined && v !== null && v !== "");
            if ((hasMandatory && allMandatoryFilled) || (!hasMandatory && hasAnyValue)) {
              initialCompleted.add(key);
            }
          });
          setCompletedSteps(initialCompleted);
        }
      } catch (error) {
        console.error("Error initializing onboarding data:", error);
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadData();
  }, [formConfig, isFormConfigLoading, isFormConfigError]);

  // Sync step from URL search params on mount
  useEffect(() => {
    if (!totalSteps) return;
    const stepParam = searchParams.get("step");
    if (stepParam !== null) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < totalSteps) {
        setCurrentStep(parsed);
      }
    }
  }, [searchParams, totalSteps]);

  // Auto-save to localStorage is disabled; saving happens on clicking "Save & Next"

  // Update data for a specific step
  const setStepData = useCallback(
    (stepKey: string, data: Record<string, unknown>) => {
      setStepDataState((prev) => ({
        ...prev,
        [stepKey]: data,
      }));
      setIsDirty(true);
    },
    [],
  );

  // Mark a step as completed
  const markStepComplete = useCallback((stepKey: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepKey);
      return next;
    });
  }, []);

  // Navigate to a specific step and update URL
  const goToStep = useCallback(
    (step: number) => {
      if (totalSteps && step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        router.push(`/onboarding?step=${step}`, { scroll: false });
      }
    },
    [router, totalSteps],
  );

  // Navigate to the next step
  const nextStep = useCallback(() => {
    if (totalSteps && currentStep < totalSteps - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      router.push(`/onboarding?step=${nextIdx}`, { scroll: false });
    }
  }, [currentStep, router, totalSteps]);

  // Navigate to the previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      router.push(`/onboarding?step=${prevIdx}`, { scroll: false });
    }
  }, [currentStep, router]);

  const submitAll = useCallback(async (
    action: "save" | "submit",
    updatedStepKey?: string,
    updatedData?: Record<string, unknown>,
  ) => {
    try {
      // Get correct user email
      const email =
        user?.email || user?.user_metadata?.email || "unknown@example.com";

      // Build the latest stepData by merging the updatedData if provided
      const currentStepData = { ...stepData };
      if (updatedStepKey && updatedData) {
        currentStepData[updatedStepKey] = updatedData;
      }

      // Find all rejected fields from formConfig
      const rejectedFields = new Set<string>();
      if (formConfig?.tabs) {
        formConfig.tabs.forEach((tab) => {
          tab.sections.forEach((section) => {
            section.fields.forEach((field) => {
              if (field.approval_status === "Rejected") {
                rejectedFields.add(field.fieldname);
              }
            });
          });
        });
      }

      // Prepare filtered stepData
      const filteredStepData: Record<string, Record<string, unknown>> = {};
      if (action === "save" && updatedStepKey) {
        const fields = currentStepData[updatedStepKey] || {};
        const filteredFields: Record<string, unknown> = {};
        for (const [fieldname, val] of Object.entries(fields)) {
          filteredFields[fieldname] = val;
        }
        filteredStepData[updatedStepKey] = filteredFields;
      } else {
        for (const [stepKey, fields] of Object.entries(currentStepData)) {
          const filteredFields: Record<string, unknown> = {};
          let hasFields = false;
          for (const [fieldname, val] of Object.entries(fields)) {
            filteredFields[fieldname] = val;
            hasFields = true;
          }
          if (hasFields) {
            filteredStepData[stepKey] = filteredFields;
          }
        }
      }

      await submitMutation.mutateAsync({
        stepData: filteredStepData,
        userEmail: email,
        action,
      });

      if (action === "submit") {
        setStatus("submitted");
      }

      toast.success(
        action === "submit"
          ? "Onboarding submitted successfully!"
          : "Progress saved successfully!"
      );

      // Invalidate the onboarding form query to fetch the latest status
      void queryClient.invalidateQueries({
        queryKey: ["onboarding-form", { userEmail: email }]
      });

      // Invalidate the onboarding dashboard query to update progress
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", { email }]
      });
    } catch (error) {
      console.error(`Error during onboarding ${action}:`, error);
      const errorMessage = error instanceof Error ? error.message : "";
      toast.error(errorMessage || `Failed to ${action} onboarding. Please try again.`);
      throw error;
    }
  }, [stepData, user, submitMutation, formConfig, queryClient]);

  const submitTriggerRef = useRef<((action: "save_continue" | "save_draft") => Promise<boolean | void>) | null>(null);

  const registerSubmitTrigger = useCallback((trigger: (action: "save_continue" | "save_draft") => Promise<boolean | void>) => {
    submitTriggerRef.current = trigger;
    return () => {
      if (submitTriggerRef.current === trigger) {
        submitTriggerRef.current = null;
      }
    };
  }, []);

  const triggerSubmit = useCallback(async (action: "save_continue" | "save_draft") => {
    if (submitTriggerRef.current) {
      return await submitTriggerRef.current(action);
    }
    return false;
  }, []);

  const getFieldValue = useCallback(
    (fieldname: string) => {
      for (const key in stepData) {
        if (stepData[key][fieldname] !== undefined) {
          return stepData[key][fieldname];
        }
      }
      return undefined;
    },
    [stepData],
  );

  const contextValue: OnboardingContextType = {
    currentStep,
    stepData,
    completedSteps,
    isDirty,
    isLoading,
    isError: isFormConfigError,
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
    registerSubmitTrigger,
    triggerSubmit,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to safely consume the OnboardingContext, returning undefined if used outside of an `<OnboardingProvider>`.
 */
export function useOptionalOnboarding(): OnboardingContextType | undefined {
  return useContext(OnboardingContext);
}

/**
 * Hook to consume the OnboardingContext.
 *
 * @throws Error if used outside of an `<OnboardingProvider>`.
 */
export function useOnboarding(): OnboardingContextType {
  const context = useOptionalOnboarding();
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
