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
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePreOffer } from "@/lib/contexts/pre-offer-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/pre-offer-form/file-upload-field";
import { cn } from "@/lib/utils";
import { PreOfferTab, PreOfferField } from "@/lib/types/pre-offer";
import { SectionCard } from "@/components/pre-offer-form/section-card";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { DynamicTableField } from "@/components/pre-offer-form/dynamic-table-field";

interface PreOfferFormStepProps {
  tab: PreOfferTab;
  stepKey: string;
  className?: string;
}

type PreOfferFormValues = Record<string, unknown>;

type OverrideComponentProps = {
  field: PreOfferField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

interface FormStepFieldProps {
  field: PreOfferField;
  control: Control<PreOfferFormValues>;
  setValue: UseFormSetValue<PreOfferFormValues>;
  trigger: UseFormTrigger<PreOfferFormValues>;
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
  isSubmitted?: boolean;
}

const FormStepField = React.memo(function FormStepField({
  field,
  control,
  error,
  handleFileUpload,
  overrides,
  isSubmitted,
}: FormStepFieldProps) {
  const isFullWidthByLabel =
    field.label.toLowerCase().includes("address proof") ||
    field.fieldname.toLowerCase().includes("custom_upload_pan_card") ||
    field.fieldname.toLowerCase().includes("custom_upload_cancelled_cheque") ||
    field.fieldname.toLowerCase().includes("resume_attachment") ||
    field.fieldname.toLowerCase().includes("linkedin_url");

  const fieldClassName = cn(
    isFullWidthByLabel && "md:col-span-full",
  );

  const finalField = useMemo(() => ({
    ...field,
    read_only: isSubmitted ? 1 : field.read_only
  }), [field, isSubmitted]);

  return (
    <Controller
      name={field.fieldname}
      control={control}
      render={({ field: rhfField }) => (
        <DynamicFieldRenderer
          field={finalField}
          value={rhfField.value}
          onChange={(val) => {
            rhfField.onChange(val);
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

export function PreOfferFormStep({
  tab,
  stepKey,
  className,
}: PreOfferFormStepProps) {
  const {
    stepData,
    setStepData,
    nextStep,
    prevStep,
    markStepComplete,
    isSaving,
    currentStep,
    status,
  } = usePreOffer();

  const isReadOnly = status === "Submitted" || status === "Filled";

  const existingData = useMemo(
    () => (stepData[stepKey] ?? {}) as Record<string, unknown>,
    [stepData, stepKey],
  );

  // Initialize values
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

  const validationResolver = useCallback<Resolver<PreOfferFormValues>>(
    (values) => {
      const errorList: FieldErrors<PreOfferFormValues> = {};
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
            field.label.toLowerCase().includes("phone") ||
            field.fieldname.toLowerCase().includes("mobile") ||
            field.fieldname.toLowerCase().includes("phone");

          const isTable = field.fieldtype === "Table";

          if (!field.hidden && isTable) {
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
            const isMandatoryTable = !!(field.is_mandatory || field.reqd);

            if (isMandatoryTable && nonEmptyRows.length === 0) {
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
          } else if (!field.hidden && (field.is_mandatory || field.reqd)) {
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
    getValues,
  } = useForm<PreOfferFormValues>({
    defaultValues,
    resolver: validationResolver,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const currentFormValues = useWatch({ control });

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      const values = getValues();
      setStepData(stepKey, values);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentFormValues, getValues, setStepData, stepKey]);

  const onSubmit = handleSubmit(async (data) => {
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
          onChange,
          error,
          disabled,
          className,
        }: OverrideComponentProps) => (
          <FileUploadField
            label={field.label}
            required={!!(field.is_mandatory || field.reqd)}
            value={value as string}
            onChange={(val) => onChange(val || "")}
            disabled={disabled || !!field.read_only || isReadOnly}
            error={error}
            className={className}
            isRejected={field.approval_status === "Rejected"}
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
          onChange,
          error,
          disabled,
          className,
        }: OverrideComponentProps) => (
          <FileUploadField
            label={field.label}
            required={!!(field.is_mandatory || field.reqd)}
            value={value as string}
            onChange={(val) => onChange(val || "")}
            disabled={disabled || !!field.read_only || isReadOnly}
            error={error}
            className={className}
            isRejected={field.approval_status === "Rejected"}
            hrComment={field.hr_comment}
            isApproved={field.approval_status === "Approved"}
            fieldname={field.fieldname}
          />
        ),
      },
    }),
    [isReadOnly],
  );

  return (
    <form onSubmit={onSubmit} className={cn("space-y-8", className)}>
      {tab.sections.map((section, idx) => (
        <React.Fragment key={idx}>
          <SectionCard
            title={section.section === tab.tab ? undefined : section.section}
          >
            <div
              className={cn(
                "grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2",
                section.section === "Basic Details" && "md:grid-cols-3"
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
                    isSubmitted={isReadOnly}
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
                    isSubmitted={isReadOnly}
                  />
                ),
              )}
            </div>
          </SectionCard>
        </React.Fragment>
      ))}

      {!isReadOnly && (
        <>
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

            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next Step
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
