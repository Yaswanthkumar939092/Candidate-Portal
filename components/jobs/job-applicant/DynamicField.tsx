/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { SectionCard } from "@/components/onboarding/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { cn } from "@/lib/utils";
import { useJobApp } from "@/lib/contexts/job-application-context";
import {
  useCreateDraftJobApplicant,
  useUpdateDraftJobApplicant,
  useCreateJobApplicant,
  useGetDraftJobApplicant,
} from "@/lib/hooks/useJobOpening";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { JobApplicationTableField } from "./ChildTable";
import { useAuth } from "@/lib/contexts/auth-context";

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
  const { mutate: draftMutate, isPending: isDraftPending } = useCreateDraftJobApplicant();
  const { mutate: draftUpdateMutate, isPending: isDraftUpdatePending } = useUpdateDraftJobApplicant();
  const router = useRouter();
  const { user } = useAuth();
  // ✅ Logged-in user email — used for all draft operations
  const userEmail = user?.email || user?.user_metadata?.email || "";

  const [draftName, setDraftName] = useState<string | null>(null);

  const isLastStep = currentStep === totalSteps - 1;

  // ✅ Fetch draft using logged-in user email directly — no need to watch form
  const { data: draftData } = useGetDraftJobApplicant(userEmail, jobID);

  const existingData = useMemo(
    () => (stepData[stepKey] ?? {}) as Record<string, unknown>,
    [stepData, stepKey]
  );

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

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // ✅ When draft data is fetched — prefill form and store draft name
  useEffect(() => {
    if (draftData?.success && draftData?.data) {
      const draft = draftData.data;

      // Store draft name for future updates
      setDraftName(draft.name);

      // Parse form_data — it may come as string or object
      const formData: Record<string, unknown> =
        typeof draft.form_data === "string"
          ? JSON.parse(draft.form_data)
          : draft.form_data ?? {};

      // Distribute parsed form_data back into stepData context
      setStepData(stepKey, formData);

      // Reset form with draft values — only fields belonging to this tab
      const tabFieldNames = new Set(
        tab.sections.flatMap((s) => s.fields.map((f) => f.fieldname))
      );

      const tabValues: Record<string, unknown> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (tabFieldNames.has(key)) {
          tabValues[key] = value ?? "";
        }
      });

      reset((prev) => ({ ...prev, ...tabValues }));

      toast.info("Draft data restored successfully.");
    }
  }, [draftData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleFileUpload =
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url ?? "", { shouldValidate: false });
    };

  const buildFinalPayload = (currentData: Record<string, unknown>) => {
    const merged = { ...stepData, [stepKey]: currentData };
    const final: Record<string, unknown> = {};

    Object.values(merged).forEach((step) => {
      Object.entries(step as Record<string, unknown>).forEach(([key, value]) => {
        final[key] = value === "" || value === undefined ? null : value;
      });
    });

    final.job_opening = jobID;
    return final;
  };

  const buildDraftPayload = (data: Record<string, unknown>) => {
    const merged = { ...stepData, [stepKey]: data };
    const formData: Record<string, unknown> = {};

    Object.values(merged).forEach((step) => {
      Object.entries(step as Record<string, unknown>).forEach(([key, value]) => {
        formData[key] = value === "" || value === undefined ? null : value;
      });
    });

    return {
      job_applicant_email: userEmail, 
      status: "Pending",
      form_data: JSON.stringify(formData),
      job_opening: jobID,
    };
  };

  // ── FINAL SUBMIT (WITH VALIDATION) ────────────────────────────────────────

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

  // ── SAVE DRAFT (NO VALIDATION) ────────────────────────────────────────────

  const onDraftSave = () => {
    const data = watch();

    setStepData(stepKey, data);

    const draftPayload = buildDraftPayload(data);

    if (draftName) {
      // ✅ Draft exists — UPDATE using logged-in user email
      draftUpdateMutate(
        { name: draftName, payload: draftPayload },
        {
          onSuccess: () => {
            toast.success("Draft updated successfully!");
          },
          onError: () => {
            toast.error("Draft update failed.");
          },
        }
      );
    } else {
      // ✅ No draft yet — CREATE using logged-in user email
      draftMutate(draftPayload as any, {
        onSuccess: (responseData) => {
          setDraftName(responseData?.name ?? null);
          toast.success("Draft saved successfully!");
        },
        onError: () => {
          toast.error("Draft save failed.");
        },
      });
    }
  };

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
              setValue(field.fieldname, val, { shouldValidate: false })
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
          setValue(field.fieldname, val, { shouldValidate: false })
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
          disabled={currentStep === 0 || isPending || isDraftPending || isDraftUpdatePending}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {/* SAVE DRAFT */}
          <Button
            type="button"
            variant="secondary"
            onClick={onDraftSave}
            disabled={isDraftPending || isDraftUpdatePending}
          >
            Save Draft
          </Button>

          {/* SUBMIT / NEXT */}
          <Button type="submit" disabled={isPending}>
            {isLastStep ? "Submit Application" : "Next Step"}
            {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}