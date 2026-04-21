"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { SectionCard } from "@/components/onboarding/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { cn } from "@/lib/utils";
import { useJobApp } from "@/lib/contexts/job-application-context";
import { useCreateJobApplicant } from "@/lib/hooks/useJobOpening";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { JobApplicationTableField } from "./ChildTable";


// ─── Types ────────────────────────────────────────────────────────────────────

interface JobField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: number | boolean;
  is_mandatory?: number | boolean;
  read_only?: number | boolean;
  hidden?: number | boolean;
  child_doctype?: string;
  child_fields?: JobField[];
}

interface JobSection {
  section: string;
  fields: JobField[];
}

interface JobTab {
  tab: string;
  sections: JobSection[];
}

interface JobApplicationStepProps {
  tab: JobTab;
  stepKey: string;
  currentStep: number;
  totalSteps: number;
  jobID: string;
  onNext: () => void;
  onPrev: () => void;
  className?: string;
}

type OverrideComponentProps = {
  field: JobField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function JobApplicationStep({
  tab,
  stepKey,
  currentStep,
  totalSteps,
  jobID,
  onNext,
  onPrev,
  className,
}: JobApplicationStepProps) {
  const { stepData, setStepData } = useJobApp();
  const { mutate, isPending } = useCreateJobApplicant();
  const router = useRouter();

  const isLastStep = currentStep === totalSteps - 1;

  const existingData = useMemo(
    () => (stepData[stepKey] ?? {}) as Record<string, unknown>,
    [stepData, stepKey]
  );

  // Build default values: merge saved data + empty defaults per field type
  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = { ...existingData };
    tab.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (values[field.fieldname] === undefined) {
          values[field.fieldname] = field.fieldtype === "Table" ? [] : "";
        }
      });
    });
    return values;
  }, [tab, existingData]);

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  // Re-sync form when step changes
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleFileUpload =
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url ?? "", { shouldValidate: true });
    };

  const buildFinalPayload = (currentData: Record<string, unknown>) => {
    const merged = { ...stepData, [stepKey]: currentData };
    const final: Record<string, unknown> = {};

    Object.values(merged).forEach((step) => {
      Object.entries(step as Record<string, unknown>).forEach(
        ([key, value]) => {
          final[key] = value === "" || value === undefined ? null : value;
        }
      );
    });

    final.job_opening = jobID;
    return final;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = handleSubmit((data) => {
    setStepData(stepKey, data);

    if (isLastStep) {
      const payload = buildFinalPayload(data);
      mutate(payload as Parameters<typeof mutate>[0], {
        onSuccess: () => {
          toast.success("Application submitted successfully!");
          reset({});
          router.push(`/open-jobs/${jobID}/apply-job/thank-you`);
        },
        onError: () => {
          toast.error("Submission failed. Please try again.");
        },
      });
      return;
    }

    onNext();
  });

  // ── Field overrides ───────────────────────────────────────────────────────

  const fieldOverrides = {
    Attach: {
      component: ({
        field,
        value,
        error,
        disabled,
        className,
      }: OverrideComponentProps) => (
        <FileUploadField
          label={field.label}
          required={!!(field.is_mandatory || field.reqd)}
          value={value as string}
          onChange={handleFileUpload(field.fieldname)}
          disabled={disabled || !!field.read_only}
          error={error}
          className={className}
        />
      ),
    },
    "Attach Image": {
      component: ({
        field,
        value,
        error,
        disabled,
        className,
      }: OverrideComponentProps) => (
        <FileUploadField
          label={field.label}
          required={!!(field.is_mandatory || field.reqd)}
          value={value as string}
          onChange={handleFileUpload(field.fieldname)}
          disabled={disabled || !!field.read_only}
          error={error}
          className={className}
        />
      ),
    },
    Table: {
      component: (props: OverrideComponentProps) => (
        <JobApplicationTableField
          field={props.field}
          value={props.value}
          onChange={props.onChange}
          onAttachChange={handleFileUpload}
        />
      ),
    },
  };

  // ── Render field ──────────────────────────────────────────────────────────

  const renderField = (field: JobField) => {
    if (field.hidden) return null;

    if (field.fieldtype === "Table") {
      return (
        <div key={field.fieldname} className="md:col-span-full">
          <JobApplicationTableField
            field={field}
            value={watch(field.fieldname)}
            onChange={(val) =>
              setValue(field.fieldname, val, { shouldValidate: true })
            }
            onAttachChange={handleFileUpload}
          />
        </div>
      );
    }

    return (
      <DynamicFieldRenderer
        key={field.fieldname}
        field={field}
        value={watch(field.fieldname)}
        onChange={(val) =>
          setValue(field.fieldname, val, { shouldValidate: true })
        }
        error={errors[field.fieldname]?.message as string}
        disabled={!!field.read_only}
        onAttachChange={handleFileUpload}
        overrides={fieldOverrides}
      />
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={onSubmit} className={cn("space-y-8", className)}>
      {tab.sections.map((section, idx) => (
        <React.Fragment key={idx}>
          <SectionCard
            title={section.section === tab.tab ? undefined : section.section}
          >
            <div
              className={cn(
                "grid grid-cols-1 gap-x-4 gap-y-5",
                section.section === "Basic Details"
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2"
              )}
            >
              {section.fields.map((field) => renderField(field))}
            </div>
          </SectionCard>
        </React.Fragment>
      ))}

      {/* Navigation */}
      <Separator />
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={currentStep === 0 || isPending}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <Button type="submit" disabled={isPending}>
          {isLastStep ? "Submit Application" : "Next Step"}
          {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}