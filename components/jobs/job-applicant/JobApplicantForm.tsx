"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { useJobApp } from "@/lib/contexts/job-application-context";
import { JobApplicationStepNav } from "./job-applicationstep-nav";
import { JobApplicationStep } from "./DynamicField";
import { useGetDraftJobApplicant } from "@/lib/hooks/useJobOpening";
import { useAuth } from "@/lib/contexts/auth-context";

interface JobApplicationPageProps {
  jobID: string;
}

export default function JobApplicationPage({
  jobID,
}: JobApplicationPageProps) {
  const { tabs, isLoading, initializeAllStepsFromDraft } = useJobApp();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set()
  );

  const userEmail = user?.email || user?.user_metadata?.email || "";
  const { data: draftData } = useGetDraftJobApplicant(userEmail, jobID);
  const draftAppliedRef = useRef(false);
  const [draftName, setDraftName] = useState<string | null>(null);

  const methods = useForm({
    mode: "onChange",
  });

  // ── Apply draft data ONCE across ALL steps on initial load ──────────────
  useEffect(() => {
    if (jobID) {
      draftAppliedRef.current = false;

      const pendingKeys = [
        `resume_reload_pending_${jobID}`,
        `apply_reload_pending_${jobID}`,
      ];

      const shouldReload = pendingKeys.some((key) =>
        sessionStorage.getItem(key)
      );

      if (shouldReload) {
        pendingKeys.forEach((key) => sessionStorage.removeItem(key));

        setTimeout(() => { window.location.reload(); }, 10);
      }
    }
  }, [jobID]);

  useEffect(() => {
    if (!draftData?.success || !draftData?.data) return;
    if (draftAppliedRef.current) return;

    const draft = Array.isArray(draftData.data) ? draftData.data[0] : draftData.data;
    if (!draft) return;

    setDraftName(draft.name);

    const formData =
      typeof draft.form_data === "string"
        ? JSON.parse(draft.form_data || "{}")
        : draft.form_data || {};

    if (Object.keys(formData).length) {
      initializeAllStepsFromDraft(formData);
      // Sync form with draft data
      methods.reset(formData);
    }

    draftAppliedRef.current = true;
    toast.info("Draft data restored successfully.");
  }, [draftData, initializeAllStepsFromDraft, methods]);

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

  const currentTab = tabs[currentStep];
  const stepKey = currentTab.tab.toLowerCase().replace(/\s+/g, "_");

  const markStepComplete = (key: string) => {
    setCompletedSteps((prev) => new Set([...prev, key]));
  };

  /**
   * Validate required fields for the currently active step.
   * Returns a map of fieldname → error message.
   */
  const validateCurrentStep = (): Record<string, string> => {
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
    markStepComplete(stepKey);
    setCurrentStep((p) => Math.min(p + 1, tabs.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleStepChange = (nextIndex: number) => {
    if (nextIndex > currentStep) {
      const errors = validateCurrentStep();
      if (Object.keys(errors).length > 0) {
        toast.warning("Please fill all required fields before proceeding.");
        return;
      }
      markStepComplete(stepKey);
    }
    setCurrentStep(nextIndex);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)] justify-center  overflow-hidden">
      {/* Sidebar */}
      <JobApplicationStepNav
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
        className="hidden w-64 shrink-0 md:flex"
      />

      {/* Main content */}
      <main className="flex-1 w-full lg:max-w-7xl  overflow-y-auto">
        <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* Step header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Step {currentStep + 1} of {tabs.length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {Math.round(((currentStep + 1) / tabs.length) * 100)}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / tabs.length) * 100}%` }}
              />
            </div>

            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {currentTab.tab}
            </h1>
          </div>

          <FormProvider {...methods}>
            <JobApplicationStep
              tab={currentTab}
              stepKey={stepKey}
              currentStep={currentStep}
              totalSteps={tabs.length}
              jobID={jobID}
              onNext={handleNext}
              onPrev={handlePrev}
              methods={methods}
              draftName={draftName}
              setDraftName={setDraftName}
            />
          </FormProvider>
        </div>
      </main>
    </div>
  );
}