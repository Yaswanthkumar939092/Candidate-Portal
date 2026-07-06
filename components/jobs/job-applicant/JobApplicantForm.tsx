"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { useJobApp } from "@/lib/contexts/job-application-context";
import { JobApplicationStepNav } from "./job-applicationstep-nav";
import { JobApplicationStep } from "./DynamicField";
import { useAuth } from "@/lib/contexts/auth-context";
import { JobApplicationReviewStep } from "./job-application-review-step";
import { validateJobAppField } from "@/lib/validation/job-application-validation";

interface JobApplicationPageProps {
  jobID: string;
}

export default function JobApplicationPage({
  jobID,
}: JobApplicationPageProps) {
  const { tabs = [], allFields = [], isLoading, initializeAllStepsFromDraft } = useJobApp();
  const { user } = useAuth();
  const userEmail = user?.email || user?.user_metadata?.email || "";
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set()
  );

  
  // ✅ Derive form values reactively from allFields (layout default or value attributes)
  const defaultValues = useMemo(() => {
    const formData: Record<string, any> = {};
    if (!allFields || allFields.length === 0) return formData;

    allFields.forEach((field: any) => {
      const val = field.value !== undefined && field.value !== null ? field.value : field.default;
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

  // ── Pre-fill user fields from auth on mount ──────────────────────────────
  useEffect(() => {
    if (!user || !allFields.length) return;
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const email = user.email || user.user_metadata?.email || "";
    const fullName = user.full_name || [firstName, lastName].filter(Boolean).join(" ") || email;

    allFields.forEach((field: any) => {
      const label = (field.label || "").toLowerCase();
      const fname = field.fieldname || "";
      let val: string | undefined;

      if (label.includes("first name") || fname === "first_name") val = firstName;
      else if (label.includes("last name") || fname === "last_name") val = lastName;
      else if (label.includes("full name") || fname === "full_name") val = fullName;
      else if (label.includes("email") || fname === "email") val = email;

      if (val) methods.setValue(fname, val, { shouldValidate: false });
    });
  }, [user, methods, allFields]);

  // ── Auto-complete steps based on real-time field validation ──────────────
  // A step gets the ✓ check mark ONLY when ALL visible fields in that tab
  // are filled and pass pattern validation (e.g. phone format).
  // Layout-only field types that don't hold user data are skipped.
  const LAYOUT_FIELD_TYPES = new Set([
    "Section Break", "Column Break", "Tab Break", "HTML",
  ]);

  const checkStepCompletion = useCallback(
    (formValues: Record<string, any>) => {
      if (!tabs.length) return;

      setCompletedSteps((prev) => {
        const next = new Set(prev);

        tabs.forEach((tab: any) => {
          const key = tab.tab.toLowerCase().replace(/\s+/g, "_");
          const allFields = tab.sections.flatMap((s: any) => s.fields || []);
          let stepValid = true;

          for (const field of allFields) {
            // Skip hidden and layout-only fields
            if (field.hidden) continue;
            if (LAYOUT_FIELD_TYPES.has(field.fieldtype)) continue;

            const val = formValues[field.fieldname];

            // ALL fields must be filled (not just required ones)
            const isEmpty =
              val === undefined ||
              val === null ||
              val === "" ||
              (Array.isArray(val) && val.length === 0);

            if (isEmpty) {
              stepValid = false;
              break;
            }

            // Filled values must also pass pattern validation (e.g. phone number)
            const patternError = validateJobAppField(field, val);
            if (patternError) {
              stepValid = false;
              break;
            }
          }

          if (stepValid) {
            next.add(key);
          } else {
            next.delete(key);
          }
        });

        // Only update state if the set actually changed
        if (next.size !== prev.size || ![...next].every((k) => prev.has(k))) {
          return next;
        }
        return prev;
      });
    },
    [tabs]
  );

  // ── Field-level progress for real-time progress bar ──────────────────────
  const LAYOUT_FIELD_TYPES_PROGRESS = useMemo(
    () => new Set(["Section Break", "Column Break", "Tab Break", "HTML"]),
    []
  );

  const computeFieldProgress = useCallback(
    (formValues: Record<string, any>): number => {
      if (!tabs.length) return 0;

      let totalFields = 0;
      let filledFields = 0;

      tabs.forEach((tab: any) => {
        const fields = tab.sections.flatMap((s: any) => s.fields || []);
        for (const field of fields) {
          if (field.hidden) continue;
          if (LAYOUT_FIELD_TYPES_PROGRESS.has(field.fieldtype)) continue;

          totalFields++;

          const val = formValues[field.fieldname];
          const isEmpty =
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0);

          if (!isEmpty) {
            filledFields++;
          }
        }
      });

      return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    },
    [tabs, LAYOUT_FIELD_TYPES_PROGRESS]
  );

  const [fieldProgress, setFieldProgress] = useState(0);

  useEffect(() => {
    if (!tabs.length) return;

    const subscription = methods.watch((formValues: Record<string, any>) => {
      setFieldProgress(computeFieldProgress(formValues));
    });

    // Initial computation
    setFieldProgress(computeFieldProgress(methods.getValues()));

    return () => subscription.unsubscribe();
  }, [tabs, methods, computeFieldProgress]);

  useEffect(() => {
    if (!tabs.length) return;

    const subscription = methods.watch((formValues) => {
      checkStepCompletion(formValues as Record<string, any>);
    });

    // Also run an initial check with current values
    checkStepCompletion(methods.getValues());

    return () => subscription.unsubscribe();
  }, [tabs, methods, checkStepCompletion]);


  // ── Loading / empty states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tabs.length) return null;

  // ── Helpers ─────────────────────────────────────────────────────────────

  const isReviewStep = currentStep === tabs.length;
  const currentTab = tabs[currentStep];
  const stepKey = currentTab?.tab.toLowerCase().replace(/\s+/g, "_") ?? "";

  /**
   * Validate required fields for the currently active step.
   * Returns a map of fieldname → error message.
   */
  const validateCurrentStep = (): Record<string, string> => {
    if (!currentTab) return {};
    const data = methods.getValues();
    const errors: Record<string, string> = {};

    currentTab.sections.forEach((section: { fields: Array<{ fieldname: string; label: string; reqd?: number | boolean; is_mandatory?: number | boolean }> }) => {
      section.fields?.forEach((field) => {
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
    // Allow advancing to the review step (tabs.length)
    setCurrentStep((p) => Math.min(p + 1, tabs.length));
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleStepChange = (nextIndex: number) => {
    setCurrentStep(nextIndex);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const totalStepsWithReview = tabs.length + 1;

  return (
    <div className="flex h-[calc(100vh-64px)] justify-center  overflow-hidden">
      {/* Sidebar */}
      <JobApplicationStepNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
        fieldProgress={fieldProgress}
        className="hidden w-64 shrink-0 md:flex"
      />

      {/* Main content */}
      <main className="flex-1 w-full lg:max-w-7xl  overflow-y-auto">
        <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* Step header */}
          <div className="mb-6">
            <div className="md:hidden flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Step {currentStep + 1} of {totalStepsWithReview}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {fieldProgress}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="md:hidden h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${fieldProgress}%` }}
              />
            </div>

            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {isReviewStep ? "Review & Submit" : currentTab.tab}
            </h1>
          </div>

          {isReviewStep ? (
            <JobApplicationReviewStep
              completedSteps={completedSteps}
              goToStep={handleStepChange}
              onPrev={handlePrev}
              jobID={jobID}
            />
          ) : (
            <FormProvider {...methods}>
              <JobApplicationStep
                tab={currentTab}
                stepKey={stepKey}
                currentStep={currentStep}
                totalSteps={totalStepsWithReview}
                jobID={jobID}
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