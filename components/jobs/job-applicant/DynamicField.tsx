
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
  useCreateJobApplicant,
} from "@/lib/hooks/useJobOpening";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { JobApplicationTableField } from "./ChildTable";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  validateJobAppField,
  validateJobAppFields,
} from "@/lib/validation/job-application-validation";

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
  className,
}: JobApplicationStepProps) {
  const { stepData, setStepData, initializeAllStepsFromDraft } = useJobApp();
  const { mutate: createApplicant, isPending } = useCreateJobApplicant();
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



  // ── Manual required-field + pattern validation ───────────────────────────
  const validateRequiredFields = (): boolean => {
    const currentValues = watch();
    const newErrors: Record<string, string> = {};

    allTabFields.forEach((field) => {
      if (field.hidden) return;

      // Required check
      if (field.reqd || field.is_mandatory) {
        const val = currentValues[field.fieldname];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          newErrors[field.fieldname] = `${field.label} is required`;
          return; // skip pattern check for empty required fields
        }
      }

      // Pattern validation (phone, etc.)
      const patternError = validateJobAppField(field, currentValues[field.fieldname]);
      if (patternError) {
        newErrors[field.fieldname] = patternError.message;
      }
    });

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const hasRequired = allTabFields.some(
        (f) =>
          !f.hidden &&
          (f.reqd || f.is_mandatory) &&
          (() => {
            const v = currentValues[f.fieldname];
            return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
          })()
      );
      if (hasRequired) {
        toast.warning("Please fill all required fields before proceeding.");
      } else {
        toast.warning("Please fix the validation errors before proceeding.");
      }
      return false;
    }

    return true;
  };

  // ── Clear a single field error on change (and re-validate pattern) ───────
  const clearFieldError = (fieldname: string, newValue?: unknown) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldname];

      // Run pattern validation on the new value if provided
      if (newValue !== undefined) {
        const field = allTabFields.find((f) => f.fieldname === fieldname);
        if (field) {
          const patternError = validateJobAppField(field, newValue);
          if (patternError) {
            next[fieldname] = patternError.message;
          }
        }
      }

      return next;
    });
  };

  const handleFileUpload =
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url ?? "", { shouldValidate: false });
      clearFieldError(fieldname);
    };

  const buildFinalPayload = (currentData: Record<string, unknown>) => {
    const final: Record<string, unknown> = {};

    Object.entries(currentData).forEach(([key, value]) => {
      let cleanValue = value === "" || value === undefined ? null : value;
      if (
        (key === "custom_current_ctc" || key === "custom_expected_ctc") &&
        typeof cleanValue === "string"
      ) {
        const numericStr = cleanValue.replace(/,/g, "");
        cleanValue = numericStr ? Number(numericStr) : null;
      }
      final[key] = cleanValue;
    });

    return {
      ...final,
      job_opening: jobID,
      job_title: jobID,
      email_id: userEmail || null,
    };
  };

  const buildSubmitPayload = (data: Record<string, unknown>, status: string) => {
    const formData: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      let cleanValue = value === "" || value === undefined ? null : value;
      if (
        (key === "custom_current_ctc" || key === "custom_expected_ctc") &&
        typeof cleanValue === "string"
      ) {
        const numericStr = cleanValue.replace(/,/g, "");
        cleanValue = numericStr ? Number(numericStr) : null;
      }
      formData[key] = cleanValue;
    });

    return {
      job_applicant_email: userEmail || null,
      job_opening: jobID,
      form_data: {
        ...formData,
        email_id: userEmail || null,
      },
      status,
    };
  };

  // ── FINAL SUBMIT (untouched) ──────────────────────────────────────────────

  const onSubmit = handleSubmit((data: Record<string, any>) => {
    // Optionally update context, but the form data itself is already centralized
    setStepData(stepKey, data);

    if (!validateRequiredFields()) return;

    if (isLastStep) {
      const submitPayload = buildSubmitPayload(data, "Open");
      createApplicant(submitPayload as any, {
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

  // ── SAVE DRAFT (no validation) ────────────────────────────────────────────

  const onDraftSave = () => {
    const data = watch();
    setStepData(stepKey, data);
    const payload = buildSubmitPayload(data, "Draft");

    createApplicant(payload as any, {
      onSuccess: () => {
        toast.success("Draft saved successfully!");
      },
      onError: () => toast.error("Draft save failed."),
    });
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
      clearFieldError(field.fieldname, val);
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
            isPending
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
            disabled={isPending}
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