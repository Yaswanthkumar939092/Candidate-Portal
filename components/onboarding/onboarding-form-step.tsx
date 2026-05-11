"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import {
  Control,
  FieldErrors,
  FieldValues,
  Resolver,
  UseFormSetValue,
  UseFormTrigger,
  useForm,
  useWatch,
  Controller,
} from "react-hook-form";
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

type OverrideComponentProps = {
  field: OnboardingField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

interface FormStepFieldProps {
  field: OnboardingField;
  control: Control<OnboardingFormValues>;
  setValue: UseFormSetValue<OnboardingFormValues>;
  trigger: UseFormTrigger<OnboardingFormValues>;
  error?: string;
  handleFileUpload: (fieldname: string) => (url: string | null) => void;
  overrides: {
    Attach: {
      component: (props: OverrideComponentProps) => React.JSX.Element;
    };
    "Attach Image": {
      component: (props: OverrideComponentProps) => React.JSX.Element;
    };
  };
}

const FormStepField = React.memo(function FormStepField({
  field,
  control,
  // setValue,
  // trigger,
  error,
  handleFileUpload,
  overrides,
}: FormStepFieldProps) {
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
    <Controller
      name={field.fieldname}
      control={control}
      render={({ field: rhfField }) => (
        <DynamicFieldRenderer
          field={field}
          value={rhfField.value}
          onChange={(val) => {
            rhfField.onChange(val);
            // Optionally trigger validation immediately
            // void trigger(field.fieldname);
          }}
          onBlur={rhfField.onBlur}
          error={error}
          className={fieldClassName}
          onAttachChange={handleFileUpload}
          overrides={overrides}
        />
      )}
    />
  );
});

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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\d{10}$/;
      tab.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const fieldValue = values[field.fieldname];
          const normalizedValue =
            typeof fieldValue === "string" ? fieldValue.trim() : fieldValue;
          const isEmailField =
            field.fieldtype.toLowerCase() === "email" ||
            field.label.toLowerCase().includes("email") ||
            field.fieldname.toLowerCase().includes("email");
          const isPhoneField =
            field.label.toLowerCase().includes("mobile") ||
            field.label.toLowerCase().includes("contact number") ||
            field.label.toLowerCase().includes("contact no") ||
            field.label.toLowerCase().includes("phone") ||
            field.fieldname.toLowerCase().includes("mobile") ||
            field.fieldname.toLowerCase().includes("phone") ||
            field.fieldname.toLowerCase().includes("contact_no") ||
            field.fieldname.toLowerCase().includes("contactnumber");

          if (!field.hidden && (field.is_mandatory || field.reqd)) {
            const isCheck = field.fieldtype === "Check";
            const isTable = field.fieldtype === "Table";

            if (isTable) {
              if (!normalizedValue || !Array.isArray(normalizedValue) || normalizedValue.length === 0) {
                errorList[field.fieldname] = {
                  type: "required",
                  message: `${field.label || "This field"} is required`,
                };
              }
            } else if (isCheck) {
              if (!Boolean(normalizedValue)) {
                errorList[field.fieldname] = {
                  type: "required",
                  message: `${field.label || "This field"} is required`,
                };
              }
            } else {
              if (
                normalizedValue === undefined ||
                normalizedValue === null ||
                normalizedValue === ""
              ) {
                errorList[field.fieldname] = {
                  type: "required",
                  message: `${field.label || "This field"} is required`,
                };
                return;
              }
            }
          }

          if (
            !field.hidden &&
            isEmailField &&
            typeof normalizedValue === "string" &&
            normalizedValue !== "" &&
            !emailRegex.test(normalizedValue)
          ) {
            errorList[field.fieldname] = {
              type: "pattern",
              message: "Please enter a valid email address",
            };
          }

          if (
            !field.hidden &&
            isPhoneField &&
            typeof normalizedValue === "string" &&
            normalizedValue !== "" &&
            !phoneRegex.test(normalizedValue)
          ) {
            errorList[field.fieldname] = {
              type: "pattern",
              message: "Please enter a valid 10-digit mobile number",
            };
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
    setValue,
    trigger,
    control,
    formState: { errors },
    // reset,
    getValues,
  } = useForm<OnboardingFormValues>({
    defaultValues,
    resolver: validationResolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  // defaultValues is passed directly to useForm, so it is initialized on mount.
  // We do NOT call reset(defaultValues) here because it causes an infinite loop 
  // with the auto-save mechanism below.

  const currentFormValues = useWatch({ control });

  // Auto-save form values to context to prevent data loss on navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      const values = getValues();
      setStepData(stepKey, values);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentFormValues, getValues, setStepData, stepKey]);

  const onNext = handleSubmit(async (data) => {
    setStepData(stepKey, data);
    markStepComplete(stepKey);
    nextStep();
  });

  const handleFileUpload = useCallback(
    (fieldname: string) => (url: string | null) => {
      setValue(fieldname, url || "", { shouldValidate: true });
    },
    [setValue],
  );

  const fieldOverrides = useMemo(
    () => ({
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
            isRejected={!field.read_only && field.approval_status === "Rejected"}
            hrComment={field.hr_comment}
            isApproved={field.approval_status === "Approved"}
            fieldname={field.fieldname}
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
            isRejected={!field.read_only && field.approval_status === "Rejected"}
            hrComment={field.hr_comment}
            isApproved={field.approval_status === "Approved"}
            fieldname={field.fieldname}
          />
        ),
      },
    }),
    [handleFileUpload],
  );

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
              {section.fields.map((field) =>
                field.fieldtype === "Table" ? (
                  <DynamicTableField
                    key={field.fieldname}
                    field={field}
                    control={control}
                    setValue={setValue as UseFormSetValue<FieldValues>}
                    errors={errors as FieldErrors<FieldValues>}
                    onAttachChange={handleFileUpload}
                    overrides={fieldOverrides}
                  />
                ) : (
                  <FormStepField
                    key={field.fieldname}
                    field={field}
                    control={control}
                    setValue={setValue}
                    trigger={trigger}
                    error={errors[field.fieldname]?.message as string}
                    handleFileUpload={handleFileUpload}
                    overrides={fieldOverrides}
                  />
                ),
              )}
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
