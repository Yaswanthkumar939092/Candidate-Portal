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
  FormProvider,
} from "react-hook-form";

import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { cn } from "@/lib/utils";
import { OnboardingTab, OnboardingField } from "@/lib/types/onboarding";
import { SectionCard } from "@/components/onboarding/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { DynamicTableField } from "@/components/onboarding/dynamic-table-field";
import { evaluateDependsOn } from "@/lib/onboarding-utils";
import { validateOnboardingStep } from "@/lib/validation/onboarding-validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const IS_FRESHER_FIELDNAME = "is_fresher";
const EMPLOYMENT_TABLE_FIELDNAME = "custom_jf_employment";
const DECLARATION_DATE_FIELDNAME = "custom_jf_declaration_date";

function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Formats an ISO date string (yyyy-mm-dd) as dd-mm-yyyy for display. */
function formatDateDMY(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

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
  doc?: Record<string, unknown>;
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
  trigger,
  error,
  doc,
  handleFileUpload,
  overrides,
}: FormStepFieldProps) {
  // Determine grid classes
  const isFullWidthByLabel =
    field.fieldname === "custom_same_as_permanent" ||
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
            if (error) {
              void trigger(field.fieldname);
            }
          }}
          onBlur={rhfField.onBlur}
          error={error}
          className={fieldClassName}
          onAttachChange={handleFileUpload}
          overrides={overrides}
          document={doc}
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
    submitAll,
    registerSubmitTrigger,
  } = useOnboarding();

  let userEmail = "";
  try {
    const auth = useAuth();
    userEmail = auth?.user?.email || auth?.profile?.email || "";
  } catch {
    // Fallback when rendered outside AuthProvider in unit tests
    userEmail = "";
  }

  const existingData = useMemo(
    () => (stepData[stepKey] ?? {}) as Record<string, unknown>,
    [stepData, stepKey],
  );

  // Initialize default values from formConfig and existingData
  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = { ...existingData };
    tab.sections.forEach((section) => {
      section.fields.forEach((field) => {
        // Always set declaration date to today
        if (field.fieldname === DECLARATION_DATE_FIELDNAME) {
          values[field.fieldname] = getTodayISO();
        } else if (field.fieldname === "custom_email_id") {
          values[field.fieldname] =
            values[field.fieldname] ||
            field.value ||
            field.default ||
            userEmail;
        } else if (values[field.fieldname] === undefined) {
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
  }, [tab, existingData, userEmail]);

  const validationResolver = useCallback<Resolver<OnboardingFormValues>>(
    (values) => {
      const errorList = validateOnboardingStep(tab, values, stepData);

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

  const formMethods = useForm<OnboardingFormValues>({
    defaultValues,
    resolver: validationResolver,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const {
    handleSubmit,
    setValue,
    trigger,
    control,
    formState: { errors },
    // reset,
    getValues,
  } = formMethods;

  // defaultValues is passed directly to useForm, so it is initialized on mount.
  // We do NOT call reset(defaultValues) here because it causes an infinite loop 
  // with the auto-save mechanism below.

  const currentFormValues = useWatch({ control });

  const addressSyncPairs = useMemo(() => {
    const fieldnames = new Set(
      tab.sections.flatMap((section) =>
        section.fields.map((field) => field.fieldname),
      ),
    );

    return [...fieldnames].flatMap((fieldname) => {
      const lowerFieldname = fieldname.toLowerCase();
      if (
        !lowerFieldname.includes("permanent") &&
        !lowerFieldname.includes("permananent")
      ) {
        return [];
      }

      const communicationFieldname = fieldname
        .replace(/permananent/i, "communication")
        .replace(/permanent/i, "communication");

      if (
        communicationFieldname === fieldname ||
        !fieldnames.has(communicationFieldname)
      ) {
        return [];
      }

      return [{ permanentFieldname: fieldname, communicationFieldname }];
    });
  }, [tab]);

  const addressSyncFingerprint = useMemo(
    () =>
      addressSyncPairs
        .map(({ permanentFieldname, communicationFieldname }) =>
          JSON.stringify([
            permanentFieldname,
            currentFormValues[permanentFieldname],
            currentFormValues[communicationFieldname],
          ]),
        )
        .join("|"),
    [addressSyncPairs, currentFormValues],
  );

  const doc = useMemo(() => {
    const merged: Record<string, any> = {};
    Object.keys(stepData).forEach((key) => {
      Object.assign(merged, stepData[key]);
    });
    Object.assign(merged, currentFormValues);
    return merged;
  }, [stepData, currentFormValues]);

  // Automatically populate custom_age based on custom_date_of_birth
  const dobValue = currentFormValues.custom_date_of_birth;
  useEffect(() => {
    if (typeof dobValue === "string" && dobValue !== "") {
      const birthDate = new Date(dobValue);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (!isNaN(age) && age >= 0) {
          const currentAge = getValues("custom_age");
          if (String(currentAge) !== String(age)) {
            setValue("custom_age", age, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      }
    }
  }, [dobValue, setValue, getValues]);

  // Always set declaration date to today's date
  useEffect(() => {
    const hasDeclarationDateField = tab.sections.some((section) =>
      section.fields.some((f) => f.fieldname === DECLARATION_DATE_FIELDNAME),
    );
    if (hasDeclarationDateField) {
      const today = getTodayISO();
      const current = getValues(DECLARATION_DATE_FIELDNAME);
      if (current !== today) {
        setValue(DECLARATION_DATE_FIELDNAME, today, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    }
  }, [tab, setValue, getValues]);

  // Automatically prefill custom_email_id with current user's email if empty
  useEffect(() => {
    if (userEmail) {
      const currentEmail = getValues("custom_email_id");
      if (
        currentEmail === undefined ||
        currentEmail === null ||
        currentEmail === ""
      ) {
        setValue("custom_email_id", userEmail, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [userEmail, setValue, getValues]);

  // Automatically sync permanent address to communication address if custom_same_as_permanent is checked
  const sameAsPermanentChecked = !!currentFormValues.custom_same_as_permanent;
  useEffect(() => {
    if (!sameAsPermanentChecked || addressSyncPairs.length === 0) {
      return;
    }

    const values = getValues();
    addressSyncPairs.forEach(
      ({ permanentFieldname, communicationFieldname }) => {
        if (
          values[communicationFieldname] !== undefined &&
          values[communicationFieldname] !== values[permanentFieldname]
        ) {
          setValue(communicationFieldname, values[permanentFieldname], {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      },
    );
  }, [
    sameAsPermanentChecked,
    addressSyncFingerprint,
    addressSyncPairs,
    getValues,
    setValue,
  ]);

  // Automatically clear fields when they become hidden
  useEffect(() => {
    tab.sections.forEach((section) => {
      section.fields.forEach((field) => {
        // Handle is_fresher -> hide employment table
        if (field.fieldname === EMPLOYMENT_TABLE_FIELDNAME && doc[IS_FRESHER_FIELDNAME]) {
          const val = getValues(field.fieldname);
          if (Array.isArray(val) && val.length > 0) {
            setValue(field.fieldname, [], {
              shouldValidate: false,
              shouldDirty: true,
            });
          }
          return;
        }

        if (field.depends_on) {
          const isVisible = evaluateDependsOn(field.depends_on, doc);
          if (!isVisible) {
            const val = getValues(field.fieldname);
            if (val !== undefined && val !== "" && val !== null && (Array.isArray(val) ? val.length > 0 : true)) {
              setValue(field.fieldname, field.fieldtype === "Table" ? [] : "", {
                shouldValidate: false,
                shouldDirty: true,
              });
            }
          }
        }
      });
    });
  }, [doc, tab, getValues, setValue]);

  // Auto-save form values to context to prevent data loss on navigation (low debounce for real-time ID card / checklist sync)
  useEffect(() => {
    const timer = setTimeout(() => {
      const values = getValues();
      setStepData(stepKey, values);
    }, 150);
    return () => clearTimeout(timer);
  }, [currentFormValues, getValues, setStepData, stepKey]);

  const onInvalid = useCallback((errors: FieldErrors<OnboardingFormValues>) => {
    const errorFieldNames = Object.keys(errors);
    if (errorFieldNames.length > 0) {
      const firstErrorFieldName = errorFieldNames[0];
      const element = document.getElementById(`field-${firstErrorFieldName}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = element.querySelector("input, select, textarea, button");
        if (input instanceof HTMLElement) {
          input.focus();
        }
      }
    }
  }, []);

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

    try {
      setStepData(stepKey, data);
      await submitAll("save", stepKey, data);
      markStepComplete(stepKey);
      nextStep();
    } catch {
      // Error is handled in submitAll
    }
  }, onInvalid);

  useEffect(() => {
    if (registerSubmitTrigger) {
      const handleAction = async (action: "save_continue" | "save_draft") => {
        if (action === "save_continue") {
          let success = false;
          await handleSubmit(
            async (data) => {
              try {
                setStepData(stepKey, data);
                await submitAll("save", stepKey, data);
                markStepComplete(stepKey);
                nextStep();
                success = true;
              } catch {
                // error handled in submitAll
              }
            },
            onInvalid
          )();
          return success;
        } else if (action === "save_draft") {
          const data = getValues();
          try {
            setStepData(stepKey, data);
            await submitAll("save", stepKey, data);
            window.location.assign("/dashboard");
            return true;
          } catch {
            return false;
          }
        }
      };

      return registerSubmitTrigger(handleAction);
    }
  }, [
    registerSubmitTrigger,
    handleSubmit,
    onInvalid,
    setStepData,
    submitAll,
    markStepComplete,
    nextStep,
    stepKey,
    getValues,
  ]);

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
          onChange,
        }: OverrideComponentProps) => (
          <FileUploadField
            label={field.label}
            required={!!(field.is_mandatory || field.reqd)}
            value={value as string}
            onChange={(url) => onChange(url || "")}
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
          onChange,
        }: OverrideComponentProps) => (
          <FileUploadField
            label={field.label}
            required={!!(field.is_mandatory || field.reqd)}
            value={value as string}
            onChange={(url) => onChange(url || "")}
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
    [],
  );

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={onNext} className={cn("space-y-8", className)}>
      {tab.sections.map((section, idx) => {
        // Check if there is at least one visible field in this section
        const isFieldVisibleInSection = (field: OnboardingField) => {
          if (field.fieldname === EMPLOYMENT_TABLE_FIELDNAME && doc[IS_FRESHER_FIELDNAME]) return false;
          return !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
        };
        const hasVisibleFields = section.fields.some(isFieldVisibleInSection);

        if (!hasVisibleFields) return null;

        const visibleFields = section.fields.filter(isFieldVisibleInSection);
        const totalFields = visibleFields.length;
        const filledFields = visibleFields.filter((field) => {
          const val = doc[field.fieldname];
          if (field.fieldname === "custom_age" && (val === 0 || val === "0")) return false;
          if (field.approval_status === "Approved") return true;
          if (field.fieldtype === "Table") {
            const rows = Array.isArray(val) ? val : [];
            return rows.length > 0;
          }
          if (field.fieldtype === "Check") {
            return Boolean(val);
          }
          return val !== undefined && val !== null && String(val).trim() !== "";
        }).length;

        const sectionCounts = { filled: filledFields, total: totalFields };

        return (
          <React.Fragment key={idx}>
            <SectionCard
              id={`section-${section.section.toLowerCase().replace(/\s+/g, "_")}`}
              title={section.section === tab.tab ? undefined : section.section}
              sectionTitle={section.section}
              counts={sectionCounts}
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
                  // Hide employment table when is_fresher is checked
                  if (field.fieldname === EMPLOYMENT_TABLE_FIELDNAME && doc[IS_FRESHER_FIELDNAME]) {
                    return null;
                  }

                  const isVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
                  if (!isVisible) return null;

                  // When is_fresher is NOT checked, make employment table child fields mandatory
                  const enrichedField = (field.fieldname === EMPLOYMENT_TABLE_FIELDNAME && !doc[IS_FRESHER_FIELDNAME])
                    ? {
                        ...field,
                        is_mandatory: 1,
                        child_fields: field.child_fields?.map((cf) => ({
                          ...cf,
                          is_mandatory: 1,
                        })),
                      }
                    // Make declaration date read-only
                    : field.fieldname === DECLARATION_DATE_FIELDNAME
                      ? { ...field, read_only: 1 }
                      : field;

                  return enrichedField.fieldtype === "Table" ? (
                    <DynamicTableField
                      key={enrichedField.fieldname}
                      field={enrichedField}
                      control={control}
                      setValue={setValue as UseFormSetValue<FieldValues>}
                      trigger={trigger as UseFormTrigger<FieldValues>}
                      errors={errors as FieldErrors<FieldValues>}
                      document={doc}
                      onAttachChange={handleFileUpload}
                      overrides={fieldOverrides}
                    />
                  ) : enrichedField.fieldname === DECLARATION_DATE_FIELDNAME ? (
                    <div key={enrichedField.fieldname} className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        {enrichedField.label}{" "}
                        {!!(enrichedField.is_mandatory || enrichedField.reqd) && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      <Input
                        value={formatDateDMY(getTodayISO())}
                        disabled
                        className="bg-muted/50 text-foreground"
                      />
                    </div>
                  ) : (
                    <FormStepField
                      key={enrichedField.fieldname}
                      field={enrichedField}
                      control={control}
                      setValue={setValue}
                      trigger={trigger}
                      error={errors[enrichedField.fieldname]?.message as string}
                      doc={doc}
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
      {/* Navigation (hidden from UI, kept for programmatic test compatibility) */}
      <div className="hidden" aria-hidden="true">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0 || isSaving}
        >
          Previous
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save & Next"}
        </Button>
      </div>
      </form>
    </FormProvider>
  );
}
