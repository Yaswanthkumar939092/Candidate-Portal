/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FrappeAPI } from "@/lib/frappe-api";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";
import { Button } from "@/components/ui/button";
import { useOptionalOnboarding } from "@/lib/contexts/onboarding-context";
import { Combobox } from "@/components/ui/combobox";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useLinkFieldOptions } from "@/lib/hooks/useLinkFieldOptions";

export interface FormField {
  fieldname: string;
  label: string;
  fieldtype: string;
  is_mandatory?: boolean | number;
  reqd?: boolean | number;
  read_only?: boolean | number;
  hidden?: boolean | number;
  options?: string;
  approval_status?: string;
  hr_comment?: string;
  depends_on?: string;
  mandatory_depends_on?: string;
  value?: unknown;
}

export interface FieldRendererProps<T extends FormField> {
  field: T;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

type FieldType =
  | "Data"
  | "Int"
  | "Float"
  | "Date"
  | "Link"
  | "Select"
  | "Attach Image"
  | "Attach"
  | "Text"
  | "Small Text"
  | "Check"
  | string;

interface FieldComponentProps<T extends FormField> {
  field: T;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

type FieldComponent<T extends FormField> = React.ComponentType<
  FieldComponentProps<T>
>;

interface FieldConfig<T extends FormField> {
  component: FieldComponent<T>;
  props?: (field: T) => Record<string, unknown>;
}

function getValidationClass(field: FormField, value?: unknown) {
  if (field.approval_status === "Approved") {
    return "border-success outline-success focus-visible:ring-success border-2 pr-10";
  }
  if (field.read_only) return "";

  const isValueChanged = (curr: unknown, orig: unknown) => {
    const normCurr = curr === undefined || curr === null ? "" : String(curr).trim();
    const normOrig = orig === undefined || orig === null ? "" : String(orig).trim();
    return normCurr !== normOrig;
  };

  if (field.approval_status === "Rejected" && !isValueChanged(value, field.value)) {
    return "border-destructive outline-destructive focus-visible:ring-destructive border-2 pr-24";
  }
  return "";
}

function isEmailField(field: FormField) {
  const label = field.label.toLowerCase();
  const fieldname = field.fieldname.toLowerCase();
  return (
    field.fieldtype.toLowerCase() === "email" ||
    label.includes("email") ||
    fieldname.includes("email")
  );
}

function isPhoneField(field: FormField) {
  const label = field.label.toLowerCase();
  const fieldname = field.fieldname.toLowerCase();
  return (
    label.includes("mobile") ||
    label.includes("contact number") ||
    label.includes("contact no") ||
    label.includes("phone") ||
    fieldname.includes("mobile") ||
    fieldname.includes("phone") ||
    fieldname.includes("contact_no") ||
    fieldname.includes("contactnumber")
  );
}

function isPincodeField(field: FormField) {
  const label = field.label.toLowerCase();
  const fieldname = field.fieldname.toLowerCase();
  return label.includes("pincode") || label.includes("pin code") || fieldname.includes("pincode") || fieldname.includes("pin_code");
}

function isAadhaarField(field: FormField) {
  const label = field.label.toLowerCase();
  const fieldname = field.fieldname.toLowerCase();
  return label.includes("aadhaar") || label.includes("aadhar") || label.includes("uid") || fieldname.includes("aadhaar") || fieldname.includes("aadhar") || fieldname.includes("uid");
}

function normalizeInputValue(field: FormField, rawValue: string) {
  if (isPhoneField(field)) {
    return rawValue.replace(/\D/g, "").slice(0, 10);
  }

  if (isPincodeField(field)) {
    return rawValue.replace(/\D/g, "").slice(0, 6);
  }

  if (isAadhaarField(field)) {
    return rawValue.replace(/\D/g, "").slice(0, 12);
  }

  return rawValue;
}


export function ResubmitButton({ fieldname }: { fieldname?: string }) {
  return null;
}

function FieldStatusTooltip({
  field,
  value,
  rightOffset = "right-3",
}: {
  field: FormField;
  value?: unknown;
  rightOffset?: string;
}) {
  if (field.approval_status === "Approved") {
    return (
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-success bg-background rounded-full z-10",
          rightOffset,
        )}
      >
        <Check className="h-4 w-4" />
      </div>
    );
  }

  if (field.read_only) return null;

  const isValueChanged = (curr: unknown, orig: unknown) => {
    const normCurr = curr === undefined || curr === null ? "" : String(curr).trim();
    const normOrig = orig === undefined || orig === null ? "" : String(orig).trim();
    return normCurr !== normOrig;
  };

  if (field.approval_status === "Rejected" && field.hr_comment && !isValueChanged(value, field.value)) {
    return (
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10",
          rightOffset,
        )}
      >
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center justify-center text-destructive bg-background rounded-full">
                <AlertCircle className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-62.5 whitespace-pre-wrap text-white font-medium bg-black"
            >
              <p>{field.hr_comment}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ResubmitButton fieldname={field.fieldname} />
      </div>
    );
  }

  return null;
}

const defaultFields: Record<FieldType, FieldConfig<FormField> | null> = {
  Data: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label}{" "}
          {!!(field.is_mandatory || field.reqd) && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            type={isEmailField(field) ? "email" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
            onBlur={onBlur}
            placeholder={field.label}
            disabled={disabled || !!field.read_only}
            className={cn("bg-muted", getValidationClass(field, value))}
            inputMode={isPhoneField(field) || isPincodeField(field) || isAadhaarField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : undefined}
          />
          <FieldStatusTooltip field={field} value={value} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Int: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label}{" "}
          {!!(field.is_mandatory || field.reqd) && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            type="number"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.label}
            disabled={disabled || !!field.read_only}
            className={cn("bg-muted", getValidationClass(field, value))}
          />
          <FieldStatusTooltip field={field} value={value} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Float: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label}{" "}
          {!!(field.is_mandatory || field.reqd) && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            type="number"
            step="any"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.label}
            disabled={disabled || !!field.read_only}
            className={cn("bg-muted", getValidationClass(field, value))}
          />
          <FieldStatusTooltip field={field} value={value} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Date: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => {
      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>
          <div className="relative">
            <Input
              type="date"
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled || !!field.read_only}
              className={cn("bg-muted", getValidationClass(field, value))}
            />
            <FieldStatusTooltip field={field} value={value} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Link: {
    component: ({ field, value, onChange, error, disabled, className }) => {
      const [search, setSearch] = React.useState("");
      const debouncedSearch = useDebounce(search, 300);

      const doctype = field.options || "";
      const { data, isLoading } = useLinkFieldOptions(doctype, debouncedSearch);
      const results = data?.results ?? [];

      let displayValue = "";
      if (value) {
        if (typeof value === "object" && value !== null) {
          displayValue = (value as any).id || (value as any).name || (value as any).value || "";
        } else {
          displayValue = String(value);
        }
      }

      const comboboxOptions = React.useMemo(() => {
        const finalOptions: Array<{ value: string; label: string }> = [];
        const seen = new Set<string>();

        const matchingResult = results.find((r) => r.id === displayValue);

        if (displayValue) {
          finalOptions.push({
            value: displayValue,
            label: matchingResult ? matchingResult.label : displayValue,
          });
          seen.add(displayValue);
        }

        results.forEach((opt) => {
          if (!seen.has(opt.id)) {
            finalOptions.push({ value: opt.id, label: opt.label });
            seen.add(opt.id);
          }
        });

        return finalOptions;
      }, [results, displayValue]);

      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>

          <div className="relative">
            <Combobox
              disabled={disabled || !!field.read_only}
              value={displayValue}
              onValueChange={(val) => onChange(val)}
              options={comboboxOptions}
              placeholder={isLoading ? "Loading..." : `Select ${field.label}`}
              searchPlaceholder={`Search ${field.label}...`}
              loading={isLoading}
              searchValue={search}
              onSearchValueChange={setSearch}
              className={getValidationClass(field, displayValue)}
            />
            <FieldStatusTooltip field={field} value={displayValue} rightOffset="right-8" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Select: {
    component: ({ field, value, onChange, error, disabled, className }) => {
      const options = parseOptions(field.options);

      let displayValue = "";
      if (value) {
        if (typeof value === 'object' && value !== null) {
           
          displayValue = (value as any).name || (value as any).value || "";
        } else {
          displayValue = String(value);
        }
      }

      const allOptions = React.useMemo(() => {
        if (displayValue && !options.includes(displayValue)) {
          return [displayValue, ...options];
        }
        return options;
      }, [options, displayValue]);

      const comboboxOptions = React.useMemo(() => {
        return allOptions.map(opt => ({ value: opt, label: opt }));
      }, [allOptions]);

      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>
          <div className="relative">
            <Combobox
              disabled={disabled || !!field.read_only}
              value={displayValue}
              onValueChange={(val) => onChange(val)}
              options={comboboxOptions}
              placeholder={`Select ${field.label}`}
              searchPlaceholder={`Search ${field.label}...`}
              className={getValidationClass(field, displayValue)}
            />
            <FieldStatusTooltip field={field} value={displayValue} rightOffset="right-8" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  "Attach Image": null,
  Attach: null,
  Text: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label}{" "}
          {!!(field.is_mandatory || field.reqd) && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            type={isEmailField(field) ? "email" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
            onBlur={onBlur}
            placeholder={field.label}
            disabled={disabled || !!field.read_only}
            className={cn("bg-muted", getValidationClass(field, value))}
            inputMode={isPhoneField(field) || isPincodeField(field) || isAadhaarField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : undefined}
          />
          <FieldStatusTooltip field={field} value={value} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  "Small Text": {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label}{" "}
          {!!(field.is_mandatory || field.reqd) && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            type={isEmailField(field) ? "email" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
            onBlur={onBlur}
            placeholder={field.label}
            disabled={disabled || !!field.read_only}
            className={cn("bg-muted", getValidationClass(field, value))}
            inputMode={isPhoneField(field) || isPincodeField(field) || isAadhaarField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : undefined}
          />
          <FieldStatusTooltip field={field} value={value} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Check: {
    component: ({ field, value, onChange, error, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </span>
        </Label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
};

function parseOptions(options?: string): string[] {
  if (!options) return [];
  const byNewline = options
    .split("\n")
    .map((opt) => opt.trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  return options
    .split(" ")
    .map((opt) => opt.trim())
    .filter(Boolean);
}

export interface DynamicFieldRendererProps<T extends FormField> {
  field: T;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  overrides?: Partial<Record<FieldType, FieldConfig<T>>>;
  onAttachChange?: (fieldname: string) => (url: string | null) => void;
}

export function DynamicFieldRenderer<T extends FormField>({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
  overrides,
  onAttachChange,
}: DynamicFieldRendererProps<T>) {
  if (field.hidden) return null;

  const isReadOnly = !!field.read_only;

  const allFields = { ...defaultFields, ...overrides } as Record<
    FieldType,
    FieldConfig<T> | null
  >;
  const fieldConfig = allFields[field.fieldtype as FieldType];

  if (!fieldConfig) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label}{" "}
          {!!(field.is_mandatory || field.reqd) && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            value={(value as string) || ""}
            onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
            onBlur={onBlur}
            placeholder={field.label}
            disabled={disabled || isReadOnly}
            className={cn(className, getValidationClass(field, value))}
            inputMode={isPhoneField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : undefined}
          />
          <FieldStatusTooltip field={field} value={value} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  const { component: FieldComponent } = fieldConfig;

  if (field.fieldtype === "Attach Image" || field.fieldtype === "Attach") {
    if (!onAttachChange) {
      return (
        <div className={cn("space-y-1.5", className)}>
          <p className="text-sm text-muted-foreground">
            File upload not configured
          </p>
        </div>
      );
    }

    const FileUploadComponent = overrides?.[field.fieldtype as FieldType]
      ?.component as FieldComponent<T> | undefined;

    if (FileUploadComponent) {
      return (
        <FileUploadComponent
          field={field}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
          className={className}
        />
      );
    }

    return (
      <div className={cn("space-y-1.5", className)}>
        <p className="text-sm text-muted-foreground">
          File upload handler not provided
        </p>
      </div>
    );
  }

  return (
    <FieldComponent
      field={field}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      disabled={disabled}
      className={className}
    />
  );
}

export { defaultFields };
