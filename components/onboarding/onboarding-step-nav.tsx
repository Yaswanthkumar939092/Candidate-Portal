"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Check, ArrowLeft, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { evaluateDependsOn, isFieldFilled } from "@/lib/onboarding-utils";

interface OnboardingStepNavProps {
  className?: string;
}

/**
 * Sidebar navigation for the onboarding wizard.
 *
 * Features a blue header with title, subtitle, and progress bar,
 * followed by dynamic step items with status indicators
 * (active/completed/pending), and a "Back to Dashboard" link at the bottom.
 */
export function OnboardingStepNav({ className }: OnboardingStepNavProps) {
  const {
    currentStep,
    completedSteps,
    goToStep,
    formConfig,
    status,
    stepData,
  } = useOnboarding();

  const tabs = formConfig?.tabs || [];

  // Flattened doc of all current onboarding fields
  const doc = useMemo(() => {
    const merged: Record<string, any> = {};
    if (stepData) {
      Object.keys(stepData).forEach((key) => {
        Object.assign(merged, stepData[key]);
      });
    }
    return merged;
  }, [stepData]);

  // Compute real-time counts on the frontend
  const tabCounts = useMemo(() => {
    return tabs.map((tab) => {
      let total = 0;
      let filled = 0;
      let approved = 0;

      tab.sections.forEach((section) => {
        section.fields.forEach((field) => {
          let isVisible =
            !field.hidden &&
            (!field.depends_on || evaluateDependsOn(field.depends_on, doc));

          if (field.fieldname === "custom_communication_address_proof" && doc["custom_same_as_permanent"]) {
            isVisible = false;
          }
          if (field.fieldname === "custom_jf_employment" && doc["is_fresher"]) {
            isVisible = false;
          }

          if (!isVisible) return;

          if (field.fieldtype === "Table") {
            let rows = Array.isArray(doc[field.fieldname]) ? doc[field.fieldname] : [];
            const isMandatory = field.is_mandatory || field.reqd || (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, doc));
            if (rows.length === 0 && isMandatory) {
              rows = [{}];
            }
            rows.forEach((row: any) => {
              field.child_fields?.forEach((childField) => {
                const childVisible = !childField.hidden && (!childField.depends_on || evaluateDependsOn(childField.depends_on, row));
                if (childVisible) {
                  total++;
                  const val = row[childField.fieldname];
                  let isFilled = false;
                  if (childField.fieldname === "custom_age" && (val === 0 || val === "0")) {
                    isFilled = false;
                  } else if (childField.fieldtype === "Check") {
                    isFilled = Boolean(val);
                  } else {
                    isFilled = val !== undefined && val !== null && String(val).trim() !== "";
                  }
                  
                  if (isFilled || childField.approval_status === "Approved") {
                    if (childField.approval_status === "Approved") {
                      approved++;
                    } else {
                      filled++;
                    }
                  }
                }
              });
            });
          } else {
            total++;
            const val = doc[field.fieldname];
            let isFilled = false;

            if (field.fieldname === "custom_age" && (val === 0 || val === "0")) {
              isFilled = false;
            } else if (field.fieldtype === "Check") {
              isFilled = Boolean(val);
            } else {
              isFilled = val !== undefined && val !== null && String(val).trim() !== "";
            }

            if (isFilled || field.approval_status === "Approved") {
              if (field.approval_status === "Approved") {
                approved++;
              } else {
                filled++;
              }
            }
          }
        });
      });

      return { total, filled, approved };
    });
  }, [tabs, doc]);

  const hasRealTimeFields = tabCounts.some((c) => c.total > 0);

  const steps = [
    ...tabs.map((t, idx) => ({
      key: t.tab.toLowerCase().replace(/\s+/g, "_"),
      label: t.tab,
      counts: hasRealTimeFields ? tabCounts[idx] : t.field_counts,
    })),
    { key: "review", label: "Review", counts: undefined },
  ];

  const totalSteps = steps.length;

  const totalFields = hasRealTimeFields
    ? tabCounts.reduce((sum, c) => sum + c.total, 0)
    : (formConfig?.field_status_counts?.total ??
       tabs.reduce((sum, t) => sum + (t.field_counts?.total || 0), 0));

  const filledFields = hasRealTimeFields
    ? tabCounts.reduce((sum, c) => sum + c.filled + c.approved, 0)
    : (formConfig?.field_status_counts
       ? formConfig.field_status_counts.filled + formConfig.field_status_counts.approved
       : tabs.reduce(
           (sum, t) =>
             sum +
             ((t.field_counts?.filled || 0) + (t.field_counts?.approved || 0)),
           0,
         ));

  const progressPercentage = hasRealTimeFields
    ? (totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0)
    : (formConfig?.field_status_counts && formConfig.field_status_counts.total > 0
       ? Math.round(
           ((formConfig.field_status_counts.filled +
             formConfig.field_status_counts.approved) /
             formConfig.field_status_counts.total) *
             100,
         )
       : totalSteps > 0
         ? Math.round((completedSteps.size / totalSteps) * 100)
         : 0);

  return (
    <nav
      className={cn(
        "flex h-full flex-col bg-card border-r border-border rounded-xl",
        className,
      )}
      aria-label="Onboarding steps"
    >
      {/* Blue header section */}
      <div className="bg-primary px-5 py-5 rounded-t-xl relative overflow-hidden">
        <div className="size-32 bg-primary-foreground/10 rounded-full absolute -top-5 -right-5"></div>
        <h2 className="text-lg font-bold text-primary-foreground">
          Onboarding
        </h2>
        <p className="mt-0.5 text-xs text-primary-foreground/80">
          Complete your profile to get started.
        </p>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        {/* Progress Meta */}
        <div className="flex justify-between items-center mt-2 text-[11px] font-semibold text-primary-foreground/90 font-mono select-none">
          <span>{progressPercentage}% complete</span>
          {totalFields > 0 && (
            <span>
              {filledFields}/{totalFields} fields
            </span>
          )}
        </div>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          {steps.map((step, index) => {
            const isSubmitted = status !== "draft";
            const isTabCompleted = step.counts
              ? step.counts.total === step.counts.filled + step.counts.approved
              : completedSteps.has(step.key);
            const isCompleted = isSubmitted || isTabCompleted;
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const isNextStep = index === currentStep + 1;

            const currentTabMandatoryFieldsAreFilled = (() => {
              if (currentStep >= tabs.length) return false;
              const currentTab = tabs[currentStep];
              if (!currentTab) return false;

              let allFilled = true;
              currentTab.sections.forEach((section) => {
                section.fields.forEach((field) => {
                  let isVisible =
                    !field.hidden &&
                    (!field.depends_on ||
                      evaluateDependsOn(field.depends_on, doc));

                  if (field.fieldname === "custom_communication_address_proof" && doc["custom_same_as_permanent"]) {
                    isVisible = false;
                  }
                  if (field.fieldname === "custom_jf_employment" && doc["is_fresher"]) {
                    isVisible = false;
                  }

                  if (!isVisible) return;

                  const isMandatory =
                    field.is_mandatory ||
                    field.reqd ||
                    (field.mandatory_depends_on &&
                      evaluateDependsOn(field.mandatory_depends_on, doc));

                  if (!isMandatory) return;

                  if (!isFieldFilled(field, doc)) {
                    allFilled = false;
                  }
                });
              });
              return allFilled;
            })();

            const isClickable = true;

            const isTabFullyFilled = isTabCompleted || isSubmitted;

            return (
              <button
                key={step.key}
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all border border-transparent select-none relative",
                  isCurrent 
                    ? "bg-primary/5 border-primary/20 border-l-4 border-l-primary font-bold text-foreground" 
                    : "hover:bg-muted text-muted-foreground",
                  !isClickable && "cursor-not-allowed opacity-50",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step indicator checkmark circle */}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    isTabFullyFilled
                      ? "bg-success text-success-foreground"
                      : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCurrent && !isTabFullyFilled ? (
                    <Pencil className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <Check className="h-4 w-4 stroke-[3]" />
                  )}
                </span>

                {/* Step label */}
                <span className="truncate flex-1 font-semibold text-foreground">
                  {step.label}
                </span>
                
                {/* Step dynamic counts badge */}
                {step.counts && (
                  <span className={cn(
                    "text-[11px] font-bold font-mono px-2 py-0.5 rounded-full transition-all duration-300 select-none",
                    isTabFullyFilled
                      ? "bg-success-bg text-success-text"
                      : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {step.counts.filled + step.counts.approved}/{step.counts.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Back to Dashboard link */}
      <div className="border-t border-border px-5 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </nav>
  );
}
