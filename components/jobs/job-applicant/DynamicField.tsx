/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  useDeleteDraftJobApplicant,
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
  const { mutate: draftMutate, isPending: isDraftPending } =
    useCreateDraftJobApplicant();
  const { mutate: draftUpdateMutate, isPending: isDraftUpdatePending } =
    useUpdateDraftJobApplicant();
  const { mutate: deleteDraftMutate } = useDeleteDraftJobApplicant();
  const router = useRouter();
  const { user } = useAuth();

  const userEmail = user?.email || user?.user_metadata?.email || "";

  // ── Draft name persisted across renders ──────────────────────────────────
  // Use ref so it never triggers re-renders but is always current
  const draftNameRef = useRef<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);

  // Track which steps have already had draft data applied to avoid overwriting user input
  const lastAppliedStepRef = useRef<string | null>(null);

  // Per-field manual validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLastStep = currentStep === totalSteps - 1;

  const { data: draftData } = useGetDraftJobApplicant(userEmail, jobID);

  // ── All fields in this tab ────────────────────────────────────────────────
  const allTabFields = useMemo(
    () => tab.sections.flatMap((s) => s.fields),
    [tab]
  );

  const allTabFieldNames = useMemo(
    () => new Set(allTabFields.map((f) => f.fieldname)),
    [allTabFields]
  );

  // ── Default values: existing stepData context → fallback to empty ─────────
  const defaultValuesRef = useRef<Record<string, unknown>>({});

  const existingData = useMemo(
    () => (stepData[stepKey] ?? {}) as Record<string, unknown>,
    [stepData, stepKey]
  );

  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = { ...existingData };

    allTabFields.forEach((field) => {
      if (values[field.fieldname] === undefined || values[field.fieldname] === null) {
        values[field.fieldname] = field.fieldtype === "Table" ? [] : "";
      }
    });

    defaultValuesRef.current = values; // persist
    return values;
  }, [allTabFields, existingData]);
  
  // intentionally exclude stepData to avoid loop

  // removed separate reset effect to avoid race conditions with data application


  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  // Initial reset when tab changes or data updates
  useEffect(() => {
    reset(defaultValues);
    setFieldErrors({});
  }, [defaultValues, reset]);


  // ── Apply draft data once per session per step ───────────────────────────
  useEffect(() => {
    if (!draftData?.success || !draftData?.data) return;
    
    // Only apply if we haven't applied for this specific step yet
    if (lastAppliedStepRef.current === stepKey) return;

    // The API returns a list of drafts, take the first one
    const draft = Array.isArray(draftData.data) ? draftData.data[0] : draftData.data;
    if (!draft) return;

    draftNameRef.current = draft.name;
    setDraftName(draft.name);

    const formData =
      typeof draft.form_data === "string"
        ? JSON.parse(draft.form_data || "{}")
        : draft.form_data || {};

    if (!Object.keys(formData).length) return;

    // ✅ IMPORTANT: first update context
    // This will trigger defaultValues update and form reset via useEffect
    setStepData(stepKey, formData);

    lastAppliedStepRef.current = stepKey;
    toast.info("Draft data restored successfully.");
  }, [draftData, stepKey, setStepData]);

  // ── Manual required-field validation ─────────────────────────────────────
  const validateRequiredFields = (): boolean => {
    const currentValues = watch();
    const newErrors: Record<string, string> = {};

    allTabFields.forEach((field) => {
      if (field.hidden) return;
      if (!(field.reqd || field.is_mandatory)) return;

      const val = currentValues[field.fieldname];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);

      if (isEmpty) {
        newErrors[field.fieldname] = `${field.label} is required`;
      }
    });

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.warning("Please fill all required fields before proceeding.");
      return false;
    }

    return true;
  };

  // ── Clear a single field error on change ─────────────────────────────────
  const clearFieldError = (fieldname: string) => {
    if (fieldErrors[fieldname]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldname];
        return next;
      });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleFileUpload =
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url ?? "", { shouldValidate: false });
      clearFieldError(fieldname);
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

    return {
      ...final,
      job_opening: jobID,
      email_id: userEmail || null,
    };
  };

  const buildDraftPayload = (data: Record<string, unknown>) => {
    const merged = { ...stepData, [stepKey]: data };
    const formData: Record<string, unknown> = {};

    Object.values(merged).forEach((step) => {
      Object.entries(step as Record<string, unknown>).forEach(
        ([key, value]) => {
          formData[key] = value === "" || value === undefined ? null : value;
        }
      );
    });

    return {
      job_applicant_email: userEmail,
      status: "Pending",
      form_data: JSON.stringify(formData),
      job_opening: jobID,
    };
  };

  // ── FINAL SUBMIT (untouched) ──────────────────────────────────────────────

  const onSubmit = handleSubmit((data) => {
    setStepData(stepKey, data);

    if (isLastStep) {
      const payload = buildFinalPayload(data);
      mutate(payload as Parameters<typeof mutate>[0], {
        onSuccess: () => {
          toast.success("Application submitted successfully!");
          // ✅ Delete draft after successful submission
          deleteDraftMutate({ email: userEmail, jobId: jobID });
          reset({});
          router.push(`/open-jobs/${jobID}/apply-job/thank-you`);
        },
        onError: () => {
          toast.error("Submission failed. Please try again.");
        },
      });
      return;
    }

    if (!validateRequiredFields()) return;
    onNext();
  });

  // ── SAVE DRAFT (no validation) ────────────────────────────────────────────

  const onDraftSave = () => {
    const data = watch();
    setStepData(stepKey, data);
    const draftPayload = buildDraftPayload(data);

    // Use ref value so we always have the latest name even before re-render
    const currentDraftName = draftNameRef.current ?? draftName;

    if (currentDraftName) {
      // UPDATE existing draft
      draftUpdateMutate(
        { name: currentDraftName, payload: draftPayload },
        {
          onSuccess: () => toast.success("Draft updated successfully!"),
          onError: () => toast.error("Draft update failed."),
        }
      );
    } else {
      // CREATE new draft
      draftMutate(draftPayload as any, {
        onSuccess: (responseData) => {
          const newName = responseData?.name ?? responseData?.data?.name ?? null;
          draftNameRef.current = newName;
          setDraftName(newName);
          toast.success("Draft saved successfully!");
        },
        onError: () => toast.error("Draft save failed."),
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

  // ── Render individual field ───────────────────────────────────────────────

  const renderField = (field: JobField) => {
    if (field.hidden) return null;

    const handleChange = (val: unknown) => {
      setValue(field.fieldname, val, { shouldValidate: false });
      clearFieldError(field.fieldname);
    };

    if (field.fieldtype === "Table") {
      return (
        <div key={field.fieldname} className="md:col-span-full">
          <JobApplicationTableField
            field={field}
            value={watch(field.fieldname)}
            onChange={handleChange}
            onAttachChange={handleFileUpload}
          />
          {fieldErrors[field.fieldname] && (
            <p className="mt-1 text-xs text-destructive">
              {fieldErrors[field.fieldname]}
            </p>
          )}
        </div>
      );
    }

    return (
      <DynamicFieldRenderer
        key={field.fieldname}
        field={field}
        value={watch(field.fieldname)}
        onChange={handleChange}
        error={
          (errors[field.fieldname]?.message as string) ||
          fieldErrors[field.fieldname]
        }
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

      <Separator />
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={
            currentStep === 0 ||
            isPending ||
            isDraftPending ||
            isDraftUpdatePending
          }
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onDraftSave}
            disabled={isDraftPending || isDraftUpdatePending}
          >
            Save Draft
          </Button>

          <Button type="submit" disabled={isPending}>
            {isLastStep ? "Submit Application" : "Next Step"}
            {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}