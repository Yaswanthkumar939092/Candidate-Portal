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
import { usePreOfferSubmit, usePreOfferForm } from "@/lib/hooks/usePreOfferForm";
import { PreOfferForm } from "@/lib/types/pre-offer";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DEBOUNCE_MS = 500;

export interface PreOfferContextType {
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
  /** Overall pre-offer status */
  status: string;
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
  /** Submit all pre-offer data */
  submitAll: () => Promise<void>;
  /** Dynamic form configuration */
  formConfig?: PreOfferForm;
  /** Helper to get current value of a field across all steps */
  getFieldValue: (
    fieldname: string,
  ) => string | number | boolean | null | undefined | unknown;
}

const PreOfferContext = createContext<PreOfferContextType | undefined>(
  undefined,
);

interface PreOfferProviderProps {
  children: React.ReactNode;
  userEmail: string;
}

export function PreOfferProvider({ children, userEmail }: PreOfferProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepDataState] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>("Sent");

  const {
    data: formConfig,
    isLoading: isFormConfigLoading,
    isError: isFormConfigError,
  } = usePreOfferForm(userEmail);
  
  const submitMutation = usePreOfferSubmit();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  const totalSteps = formConfig?.tabs ? formConfig.tabs.length + 1 : 0;

  // Load data from formConfig on mount or when formConfig changes
  useEffect(() => {
    if (isFormConfigLoading) return;

    if (isFormConfigError || !formConfig) {
      if (!initialLoadDone.current) {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
      return;
    }

    if (initialLoadDone.current) return;

    const loadData = () => {
      const storageKey = userEmail ? `pre_offer_draft:${userEmail}` : "pre_offer_draft";
      try {
        const localData = localStorage.getItem(storageKey);
        let localParsed: {
          stepData?: Record<string, Record<string, unknown>>;
          currentStep?: number;
          completedSteps?: string[];
          applicantId?: string;
        } | null = null;
        
        if (localData) {
          try {
            localParsed = JSON.parse(localData);
            if (localParsed && localParsed.applicantId && localParsed.applicantId !== formConfig.applicantId) {
              localParsed = null;
              localStorage.removeItem(storageKey);
            }
          } catch {
            localStorage.removeItem(storageKey);
          }
        }

        const loadedStepData: Record<string, Record<string, unknown>> = {};

        formConfig.tabs.forEach((tab, index) => {
          // If tab title is empty, derive key based on index or 'general'
          const rawKey = tab.tab || `Step ${index + 1}`;
          const key = rawKey.toLowerCase().replace(/\s+/g, "_");
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

        if (localParsed?.stepData) {
          const localStepData = localParsed.stepData;
          Object.keys(localStepData).forEach((key) => {
            if (loadedStepData[key]) {
              Object.keys(localStepData[key]).forEach((fieldName) => {
                const localVal = localStepData[key][fieldName];
                const loadedVal = loadedStepData[key][fieldName];
                if (localVal || (!loadedVal && localVal !== undefined)) {
                  loadedStepData[key][fieldName] = localVal;
                }
              });
            }
          });
        }

        setStepDataState(loadedStepData);

        if (localParsed?.currentStep !== undefined) {
          setCurrentStep(localParsed.currentStep);
        }

        setStatus(formConfig.status || "Sent");

        if (formConfig.status === "Submitted") {
          const allStepKeys = formConfig.tabs.map((t, index) => {
            const rawKey = t.tab || `Step ${index + 1}`;
            return rawKey.toLowerCase().replace(/\s+/g, "_");
          });
          setCompletedSteps(new Set(allStepKeys));
        } else if (localParsed?.completedSteps) {
          setCompletedSteps(new Set(localParsed.completedSteps));
        }
      } catch (error) {
        console.error("Error initializing pre-offer data:", error);
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadData();
  }, [formConfig, isFormConfigLoading, isFormConfigError]);

  // Sync step from URL search params
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

  // Auto-save
  useEffect(() => {
    if (!isDirty || isLoading) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const storageKey = userEmail ? `pre_offer_draft:${userEmail}` : "pre_offer_draft";
      try {
        const toSave = {
          stepData,
          completedSteps: Array.from(completedSteps),
          currentStep,
          applicantId: formConfig?.applicantId,
        };
        localStorage.setItem(storageKey, JSON.stringify(toSave));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [stepData, completedSteps, currentStep, isDirty, isLoading]);

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

  const markStepComplete = useCallback((stepKey: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepKey);
      return next;
    });
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (totalSteps && step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        const search = new URLSearchParams(window.location.search);
        search.set("step", step.toString());
        router.push(`/pre_offer_form?${search.toString()}`, { scroll: false });
      }
    },
    [router, totalSteps],
  );

  const nextStep = useCallback(() => {
    if (totalSteps && currentStep < totalSteps - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      const search = new URLSearchParams(window.location.search);
      search.set("step", nextIdx.toString());
      router.push(`/pre_offer_form?${search.toString()}`, { scroll: false });
    }
  }, [currentStep, router, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      const search = new URLSearchParams(window.location.search);
      search.set("step", prevIdx.toString());
      router.push(`/pre_offer_form?${search.toString()}`, { scroll: false });
    }
  }, [currentStep, router]);

  const submitAll = useCallback(async () => {
    try {
      await submitMutation.mutateAsync({
        stepData,
        userEmail,
      });

      setStatus("Submitted");
      const storageKey = userEmail ? `pre_offer_draft:${userEmail}` : "pre_offer_draft";
      localStorage.removeItem(storageKey);

      toast.success("Pre-offer form submitted successfully!");

      // Refresh cache
      void queryClient.invalidateQueries({
        queryKey: ["pre-offer-form", { userEmail }]
      });
    } catch (error) {
      console.error("Error submitting pre-offer form:", error);
      toast.error("Failed to submit pre-offer form. Please try again.");
      throw error;
    }
  }, [stepData, userEmail, submitMutation, queryClient]);

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

  const contextValue: PreOfferContextType = {
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
  };

  return (
    <PreOfferContext.Provider value={contextValue}>
      {children}
    </PreOfferContext.Provider>
  );
}

export function usePreOffer(): PreOfferContextType {
  const context = useContext(PreOfferContext);
  if (context === undefined) {
    throw new Error("usePreOffer must be used within a PreOfferProvider");
  }
  return context;
}
