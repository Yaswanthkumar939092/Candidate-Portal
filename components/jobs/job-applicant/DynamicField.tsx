
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
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
  methods: any;
  draftName: string | null;
  setDraftName: (name: string | null) => void;
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

// ─── Internal Wrappers ────────────────────────────────────────────────────────

const FieldWrapper = ({
  field,
  control,
  handleChange,
  error,
  handleFileUpload,
  fieldOverrides,
}: any) => {
  const value = useWatch({
    control,
    name: field.fieldname,
  });

  return (
    <DynamicFieldRenderer
      field={field}
      value={value}
      onChange={handleChange}
      error={error}
      disabled={!!field.read_only}
      onAttachChange={handleFileUpload}
      overrides={fieldOverrides}
    />
  );
};

const TableFieldWrapper = ({
  field,
  control,
  handleChange,
  error,
  handleFileUpload,
}: any) => {
  const value = useWatch({
    control,
    name: field.fieldname,
  });

  return (
    <div className="md:col-span-full">
      <JobApplicationTableField
        field={field}
        value={value}
        onChange={handleChange}
        onAttachChange={handleFileUpload}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
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
  methods,
  draftName,
  setDraftName,
  className,
}: JobApplicationStepProps) {
  const { stepData, setStepData, initializeAllStepsFromDraft } = useJobApp();
  const { mutate, isPending } = useCreateJobApplicant();
  const { mutate: draftMutate, isPending: isDraftPending } =
    useCreateDraftJobApplicant();
  const { mutate: draftUpdateMutate, isPending: isDraftUpdatePending } =
    useUpdateDraftJobApplicant();
  const { mutate: deleteDraftMutate } = useDeleteDraftJobApplicant();
  const router = useRouter();
  const { user } = useAuth();
  const userEmail = user?.email || user?.user_metadata?.email || "";

  // ── Use methods from props instead of local useForm ─────────────────────
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  // Per-field manual validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isLastStep = currentStep === totalSteps - 1;


  // ── All fields in this tab ────────────────────────────────────────────────
  const allTabFields = useMemo(
    () => tab.sections.flatMap((s) => s.fields),
    [tab]
  );

  const allTabFieldNames = useMemo(
    () => new Set(allTabFields.map((f) => f.fieldname)),
    [allTabFields]
  );

  // ── Reset manual errors when step changes ───────────────────────────────
  useEffect(() => {
    setFieldErrors({});
  }, [currentStep]);



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

  const handleFileUpload =
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url ?? "", { shouldValidate: false });
      clearFieldError(fieldname);
    };

  const buildFinalPayload = (currentData: Record<string, unknown>) => {
    const final: Record<string, unknown> = {};

    Object.entries(currentData).forEach(([key, value]) => {
      final[key] = value === "" || value === undefined ? null : value;
    });

    return {
      ...final,
      job_opening: jobID,
      job_title: jobID,
      email_id: userEmail || null,
    };
  };

  const buildDraftPayload = (data: Record<string, unknown>) => {
    const formData: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      formData[key] = value === "" || value === undefined ? null : value;
    });

    return {
      job_applicant_email: userEmail,
      status: "Pending",
      form_data: JSON.stringify(formData),
      job_opening: jobID,
      job_title: jobID,
    };
  };

  // ── FINAL SUBMIT (untouched) ──────────────────────────────────────────────

  const onSubmit = handleSubmit((data: Record<string, any>) => {
    // Optionally update context, but the form data itself is already centralized
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

    // Use prop value directly
    const currentDraftName = draftName;

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

    const error =
      (errors[field.fieldname]?.message as string) ||
      fieldErrors[field.fieldname];

    if (field.fieldtype === "Table") {
      return (
        <TableFieldWrapper
          key={field.fieldname}
          field={field}
          control={methods.control}
          handleChange={handleChange}
          error={error}
          handleFileUpload={handleFileUpload}
        />
      );
    }

    return (
      <FieldWrapper
        key={field.fieldname}
        field={field}
        control={methods.control}
        handleChange={handleChange}
        error={error}
        handleFileUpload={handleFileUpload}
        fieldOverrides={fieldOverrides}
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
            variant="outline"
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