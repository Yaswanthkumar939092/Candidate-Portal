"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { FieldErrors, Resolver, useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { cn } from "@/lib/utils";
import { OnboardingTab, OnboardingField } from "@/lib/types/onboarding";
import { SectionCard } from "@/components/onboarding/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { DynamicTableField } from "@/components/onboarding/dynamic-table-field";
interface OnboardingFormStepProps {
  tab: OnboardingTab;
  stepKey: string;
  className?: string;
}

type OnboardingFormValues = Record<string, unknown>;

export function OnboardingFormStep({
  tab,
  stepKey,
  className,
}: OnboardingFormStepProps) {
  const {
    stepData,
    setStepData,
    nextStep,
    prevStep,
    markStepComplete,
    isSaving,
    currentStep,
  } = useOnboarding();
  const existingData = useMemo(
    () => (stepData[stepKey] ?? {}) as Record<string, unknown>,
    [stepData, stepKey],
  );

  // Initialize default values from formConfig and existingData
  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = { ...existingData };
    tab.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (values[field.fieldname] === undefined) {
          const fieldValue =
            field.value !== undefined ? field.value : field.default;
          if (fieldValue !== undefined && fieldValue !== null) {
            values[field.fieldname] = fieldValue;
          } else if (field.fieldtype === "Table") {
            values[field.fieldname] = [];
          } else {
            values[field.fieldname] = "";
          }
        }
      });
    });
    return values;
  }, [tab, existingData]);

  const validationResolver = useCallback<Resolver<OnboardingFormValues>>(
    (values) => {
      const errorList: FieldErrors<OnboardingFormValues> = {};
      tab.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (!field.hidden && (field.is_mandatory || field.reqd)) {
            const val = values[field.fieldname];
            const isCheck = field.fieldtype === "Check";
            const isTable = field.fieldtype === "Table";

            if (isTable) {
              if (!val || !Array.isArray(val) || val.length === 0) {
                errorList[field.fieldname] = {
                  type: "required",
                  message: `${field.label || "This field"} is required`,
                };
              }
            } else if (isCheck) {
              if (!Boolean(val)) {
                errorList[field.fieldname] = {
                  type: "required",
                  message: `${field.label || "This field"} is required`,
                };
              }
            } else {
              if (val === undefined || val === null || val === "") {
                errorList[field.fieldname] = {
                  type: "required",
                  message: `${field.label || "This field"} is required`,
                };
              }
            }
          }
        });
      });

      if (Object.keys(errorList).length) {
        return {
          values: {},
          errors: errorList,
        };
      }

      return {
        values,
        errors: {},
      };
    },
    [tab],
  );

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
    reset,
    getValues,
  } = useForm<OnboardingFormValues>({
    defaultValues,
    resolver: validationResolver,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onNext = handleSubmit(async (data) => {
    setStepData(stepKey, data);
    markStepComplete(stepKey);
    nextStep();
  });

  const handleFileUpload = (fieldname: string) => (url: string | null) => {
    setValue(fieldname, url || "", { shouldValidate: true });
  };

  type OverrideComponentProps = {
    field: OnboardingField;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    disabled?: boolean;
    className?: string;
  };

  const renderField = (field: OnboardingField) => {
    if (field.hidden) return null;

    const fieldOverrides = {
      // Use FileUploadField for Attach fields
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
            isRejected={
              !field.read_only && field.approval_status === "Rejected"
            }
            hrComment={field.hr_comment}
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
            isRejected={
              !field.read_only && field.approval_status === "Rejected"
            }
            hrComment={field.hr_comment}
          />
        ),
      },
    };

    if (field.fieldtype === "Table") {
      return (
        <DynamicTableField
          key={field.fieldname}
          field={field}
          control={control}
          setValue={setValue}
          watch={watch}
          errors={errors}
          onAttachChange={handleFileUpload}
          overrides={fieldOverrides}
        />
      );
    }

    // Determine grid classes
    const isFullWidthByLabel =
      field.label.toLowerCase().includes("address proof") ||
      field.fieldname.toLowerCase().includes("custom_upload_pan_card") ||
      field.fieldname
        .toLowerCase()
        .includes("custom_upload_cancelled_cheque_passbook_statement") ||
      field.fieldname.toLowerCase().includes("address_proof");

    const isAadhaarFront = field.fieldname === "custom_upload_aadhaarfront";

    const fieldClassName = cn(
      isFullWidthByLabel && "md:col-span-full",
      isAadhaarFront && "md:col-start-1",
    );

    return (
      <DynamicFieldRenderer
        key={field.fieldname}
        field={field}
        value={watch(field.fieldname)}
        onChange={(val) =>
          setValue(field.fieldname, val, { shouldValidate: true })
        }
        error={errors[field.fieldname]?.message as string}
        className={fieldClassName}
        onAttachChange={handleFileUpload}
        overrides={fieldOverrides}
      />
    );
  };

  return (
    <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {tab.sections.map((section, idx) => (
        <React.Fragment key={idx}>
          {section.section.toLowerCase().includes("permanent address") && (
            <div className="flex justify-start mb-2 px-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const values = getValues();
                  Object.keys(values).forEach((key) => {
                    if (key.toLowerCase().includes("current")) {
                      const permKey = key.replace(/current/i, "permanent");
                      setValue(permKey, values[key], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  });
                }}
              >
                Same as Current Address
              </Button>
            </div>
          )}
          <SectionCard
            title={section.section === tab.tab ? undefined : section.section}
          >
            <div
              className={cn(
                "grid grid-cols-1 gap-x-4 gap-y-5",
                section.section === "Basic Details"
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2",
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
          onClick={prevStep}
          disabled={currentStep === 0 || isSaving}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button type="submit" disabled={isSaving}>
          Next Step
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
