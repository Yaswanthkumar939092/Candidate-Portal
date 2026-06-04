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
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { cn } from "@/lib/utils";
import { OnboardingTab, OnboardingField } from "@/lib/types/onboarding";
import { SectionCard } from "@/components/onboarding/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { DynamicTableField } from "@/components/onboarding/dynamic-table-field";
import { evaluateDependsOn } from "@/lib/onboarding-utils";
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

      // Build doc object for evaluating depends_on in validation
      const doc: Record<string, any> = {};
      Object.keys(stepData).forEach((key) => {
        Object.assign(doc, stepData[key]);
      });
      Object.assign(doc, values);

      tab.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const isFieldVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
          if (!isFieldVisible) {
            return;
          }

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

          const isTable = field.fieldtype === "Table";
          const isMandatory =
            field.is_mandatory ||
            field.reqd ||
            (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, doc));

          if (isTable) {
            const rows = Array.isArray(normalizedValue) ? (normalizedValue as Record<string, unknown>[]) : [];
            const visibleChildFields = field.child_fields?.filter(f => !f.hidden) || [];
            const mandatoryChildFields = visibleChildFields.filter(f => f.is_mandatory || f.reqd);

            const isRowEmpty = (row: Record<string, unknown>) => {
              return !visibleChildFields.some(cf => {
                const val = row[cf.fieldname];
                return val !== undefined && val !== null && String(val).trim() !== "";
              });
            };

            const isRowValid = (row: Record<string, unknown>) => {
              return mandatoryChildFields.every(cf => {
                const val = row[cf.fieldname];
                return val !== undefined && val !== null && String(val).trim() !== "";
              });
            };

            const nonEmptyRows = rows.filter(row => !isRowEmpty(row));

            if (isMandatory && nonEmptyRows.length === 0) {
              errorList[field.fieldname] = {
                type: "required",
                message: `${field.label || "This field"} is required`,
              };
            } else if (nonEmptyRows.length > 0 && !nonEmptyRows.every(isRowValid)) {
              errorList[field.fieldname] = {
                type: "required",
                message: `Please complete all required fields in ${field.label}`,
              };
            }
          } else if (isMandatory) {
            const isCheck = field.fieldtype === "Check";

            if (isCheck) {
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
    [tab, stepData],
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

  const doc = useMemo(() => {
    const merged: Record<string, any> = {};
    Object.keys(stepData).forEach((key) => {
      Object.assign(merged, stepData[key]);
    });
    Object.assign(merged, currentFormValues);
    return merged;
  }, [stepData, currentFormValues]);

  // Automatically clear fields when they become hidden
  useEffect(() => {
    tab.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.depends_on) {
          const isVisible = evaluateDependsOn(field.depends_on, doc);
          if (!isVisible) {
            const val = getValues(field.fieldname);
            if (val !== undefined && val !== "" && val !== null && (Array.isArray(val) ? val.length > 0 : true)) {
              setValue(field.fieldname, field.fieldtype === "Table" ? [] : "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        }
      });
    });
  }, [doc, tab, getValues, setValue]);

  // Auto-save form values to context to prevent data loss on navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      const values = getValues();
      setStepData(stepKey, values);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentFormValues, getValues, setStepData, stepKey]);

  const onNext = handleSubmit(async (data) => {
    const unresolvedRejectedFields = tab.sections.flatMap((s) => s.fields).filter((field) => {
      const isVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
      if (!isVisible) return false;

      if (field.approval_status === "Rejected") {
        const currentValue = data[field.fieldname];
        const normCurr = currentValue === undefined || currentValue === null ? "" : String(currentValue).trim();
        const normOrig = field.value === undefined || field.value === null ? "" : String(field.value).trim();
        return normCurr === normOrig;
      }
      return false;
    });

    if (unresolvedRejectedFields.length > 0) {
      toast.error(`Please correct all rejected fields before proceeding: ${unresolvedRejectedFields.map(f => f.label).join(", ")}`);
      return;
    }

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
            isRejected={
              !field.read_only &&
              field.approval_status === "Rejected" &&
              (() => {
                const normVal = value === undefined || value === null ? "" : String(value).trim();
                const normOrigVal = field.value === undefined || field.value === null ? "" : String(field.value).trim();
                return normVal === normOrigVal;
              })()
            }
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
            isRejected={
              !field.read_only &&
              field.approval_status === "Rejected" &&
              (() => {
                const normVal = value === undefined || value === null ? "" : String(value).trim();
                const normOrigVal = field.value === undefined || field.value === null ? "" : String(field.value).trim();
                return normVal === normOrigVal;
              })()
            }
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
      {tab.sections.map((section, idx) => {
        // Check if there is at least one visible field in this section
        const hasVisibleFields = section.fields.some((field) => {
          return !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
        });

        if (!hasVisibleFields) return null;

        return (
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
                {section.fields.map((field) => {
                  const isVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
                  if (!isVisible) return null;

                  return field.fieldtype === "Table" ? (
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
                  );
                })}
              </div>
            </SectionCard>
          </React.Fragment>
        );
      })}

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
