"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWatch } from "react-hook-form";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { SectionCard } from "@/components/onboarding/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { cn } from "@/lib/utils";
import { usePreOffer } from "@/lib/contexts/pre-offer-context";
import { PreOfferTableField } from "./ChildTable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreOfferField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: number | boolean;
  is_mandatory?: number | boolean;
  read_only?: number | boolean;
  hidden?: number | boolean;
  child_doctype?: string;
  child_fields?: any[];
  table_fields?: any[];
}

interface PreOfferSection {
  section: string;
  fields: PreOfferField[];
}

interface PreOfferTab {
  tab: string;
  sections: PreOfferSection[];
}

interface PreOfferStepProps {
  tab: PreOfferTab;
  stepKey: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  methods: any;
  className?: string;
}

type OverrideComponentProps = {
  field: PreOfferField;
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
      <PreOfferTableField
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

export function PreOfferStep({
  tab,
  stepKey,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  methods,
  className,
}: PreOfferStepProps) {
  const { setStepData } = usePreOffer();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formWarning, setFormWarning] = useState<string | null>(null);

  const isLastStep = currentStep === totalSteps - 1;

  const allTabFields = useMemo(
    () => tab.sections.flatMap((s) => s.fields),
    [tab]
  );

  useEffect(() => {
    setFieldErrors({});
    setFormWarning(null);
  }, [currentStep]);

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
      setFormWarning("Please fill all required fields before proceeding.");
      return false;
    }

    setFormWarning(null);
    return true;
  };

  const clearFieldError = (fieldname: string) => {
    if (fieldErrors[fieldname]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldname];
        return next;
      });
    }
    setFormWarning(null);
  };

  const handleFileUpload =
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url ?? "", { shouldValidate: false });
      clearFieldError(fieldname);
    };

  const onSubmit = handleSubmit((data: Record<string, any>) => {
    setStepData(stepKey, data);

    if (!validateRequiredFields()) return;

    onNext();
  });

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
        <PreOfferTableField
          field={props.field}
          value={props.value}
          onChange={props.onChange}
          onAttachChange={handleFileUpload}
        />
      ),
    },
  };

  const renderField = (field: PreOfferField) => {
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

      {formWarning && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 p-3 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {formWarning}
        </div>
      )}

      <Separator />
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <Button type="submit">
          {isLastStep ? "Review Application" : "Next Step"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
