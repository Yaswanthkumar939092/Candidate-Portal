"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Check } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { usePreOffer } from "@/lib/contexts/pre-offer-context";
import { PreOfferStepNav } from "./pre-offer-step-nav";
import { PreOfferStep } from "./DynamicField";
import { PreOfferReviewStep } from "./pre-offer-review-step";
import { Button } from "@/components/ui/button";

export default function PreOfferForm() {
  const { tabs, allFields, isLoading, initializeAllStepsFromDraft } = usePreOffer();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ✅ Derive form values reactively from allFields (layout default or value attributes)
  const defaultValues = useMemo(() => {
    const formData: Record<string, any> = {};
    if (!allFields || allFields.length === 0) return formData;

    allFields.forEach((field: any) => {
      let val = field.value !== undefined && field.value !== null ? field.value : field.default;
      if (field.fieldtype === "Table" && !Array.isArray(val)) {
        val = [];
      }
      if (val !== undefined && val !== null && val !== "") {
        formData[field.fieldname] = val;
      }
    });
    return formData;
  }, [allFields]);

  // ✅ React Hook Form 'values' automatically resets and syncs in real-time when layout loads
  const methods = useForm({
    mode: "onChange",
    values: Object.keys(defaultValues).length > 0 ? defaultValues : undefined,
  });

  // ── Apply field values ONCE across ALL steps on initial load ──────────────
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      initializeAllStepsFromDraft(defaultValues);
    }
  }, [defaultValues, initializeAllStepsFromDraft]);

  // ── Loading / empty states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
          Details Submitted!
        </h2>
        <p className="mt-3 text-lg text-muted-foreground max-w-md">
          Thank you. Your pre-offer verification details have been successfully submitted for review.
        </p>
        <div className="mt-8">
          <Button onClick={() => window.location.href = "/"} size="lg" className="px-8 font-semibold">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!tabs.length) return null;

  // ── Helpers ─────────────────────────────────────────────────────────────

  const isReviewStep = currentStep === tabs.length;
  const currentTab = tabs[currentStep];
  const stepKey = currentTab?.tab.toLowerCase().replace(/\s+/g, "_") ?? "";

  const markStepComplete = (key: string) => {
    setCompletedSteps((prev) => new Set([...prev, key]));
  };

  /**
   * Validate required fields for the currently active step.
   * Returns a map of fieldname → error message.
   */
  const validateCurrentStep = (): Record<string, string> => {
    if (!currentTab) return {};
    const data = methods.getValues();
    const errors: Record<string, string> = {};

    currentTab.sections.forEach((section: any) => {
      section.fields?.forEach((field: any) => {
        const isRequired = field.reqd || field.is_mandatory;
        if (isRequired) {
          const val = data[field.fieldname];
          if (val === undefined || val === null || val === "") {
            errors[field.fieldname] = `${field.label} is required`;
          }
        }
      });
    });

    return errors;
  };

  // ── Step navigation ──────────────────────────────────────────────────────

  const handleNext = () => {
    markStepComplete(stepKey);
    // Allow advancing to the review step (tabs.length)
    setCurrentStep((p) => Math.min(p + 1, tabs.length));
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleStepChange = (nextIndex: number) => {
    if (!isReviewStep && nextIndex > currentStep) {
      const errors = validateCurrentStep();
      if (Object.keys(errors).length > 0) {
        return;
      }
      markStepComplete(stepKey);
    }
    setCurrentStep(nextIndex);
  };

  const totalStepsWithReview = tabs.length + 1;

  return (
    <div className="flex h-[calc(100vh-64px)] justify-center overflow-hidden">
      {/* Sidebar */}
      <PreOfferStepNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
        className="hidden w-64 shrink-0 md:flex"
      />

      {/* Main content */}
      <main className="flex-1 w-full lg:max-w-7xl overflow-y-auto">
        <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* Step header */}
          <div className="mb-6">
            <div className="md:hidden flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Step {currentStep + 1} of {totalStepsWithReview}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {Math.round(((currentStep + 1) / totalStepsWithReview) * 100)}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="md:hidden h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalStepsWithReview) * 100}%` }}
              />
            </div>

            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {isReviewStep ? "Review & Submit" : currentTab.tab}
            </h1>
          </div>

          {isReviewStep ? (
            <PreOfferReviewStep
              completedSteps={completedSteps}
              goToStep={handleStepChange}
              onPrev={handlePrev}
              onSuccess={() => setIsSubmitted(true)}
            />
          ) : (
            <FormProvider {...methods}>
              <PreOfferStep
                tab={currentTab}
                stepKey={stepKey}
                currentStep={currentStep}
                totalSteps={totalStepsWithReview}
                onNext={handleNext}
                onPrev={handlePrev}
                methods={methods}
              />
            </FormProvider>
          )}
        </div>
      </main>
    </div>
  );
}
