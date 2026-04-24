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
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

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

function getValidationClass(field: FormField) {
  return !field.read_only && field.approval_status === "Rejected"
    ? "border-yellow-500 outline-yellow-500 focus-visible:ring-yellow-500 border-2 pr-10"
    : "";
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


function FieldStatusTooltip({
  field,
  rightOffset = "right-3",
}: {
  field: FormField;
  rightOffset?: string;
}) {
  if (
    field.read_only ||
    field.approval_status !== "Rejected" ||
    !field.hr_comment
  )
    return null;
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex cursor-help items-center justify-center text-yellow-500 bg-background rounded-full z-10",
              rightOffset,
            )}
          >
            <AlertCircle className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-62.5 whitespace-pre-wrap text-destructive font-medium border-yellow-500"
        >
          <p>{field.hr_comment}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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
            className={cn("bg-muted", getValidationClass(field))}
            inputMode={isPhoneField(field) || isPincodeField(field) || isAadhaarField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : undefined}
          />
          <FieldStatusTooltip field={field} />
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
            className={cn("bg-muted", getValidationClass(field))}
          />
          <FieldStatusTooltip field={field} />
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
            className={cn("bg-muted", getValidationClass(field))}
          />
          <FieldStatusTooltip field={field} />
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
              className={cn("bg-muted", getValidationClass(field))}
            />
            <FieldStatusTooltip field={field} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Link: {
    component: ({ field, value, onChange, error, disabled, className }) => {
      const [options, setOptions] = React.useState<string[]>([]);
      const [loading, setLoading] = React.useState(false);

      React.useEffect(() => {
        if (!field.options) return;
        const doctype = field.options;
        const fetchOptions = async () => {
          try {
            setLoading(true);
            const res = await FrappeAPI.getresourceDocumentData(doctype, {
              fields: ["name"],
              page: 1, // ✅ from component
              limit: 100000, // ✅ from component
            });
            const data = (res?.data ?? []) as Array<{ name?: unknown }>;
            const optionsList = data
              .map((item) => item.name)
              .filter((name): name is string => typeof name === "string");
            setOptions(optionsList);
          } catch (err) {
            console.error("Link fetch error:", err);
            setOptions([]);
          } finally {
            setLoading(false);
          }
        };

        fetchOptions();
      }, [field.options]);

      let displayValue = "";
      if (value) {
        if (typeof value === 'object' && value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>

          <div className="relative">
            <Select
              disabled={disabled || !!field.read_only || loading}
              value={displayValue || undefined}
              onValueChange={(val) => onChange(val)}
            >
              <SelectTrigger
                className={cn("w-full bg-muted", getValidationClass(field))}
              >
                <SelectValue
                  placeholder={loading ? "Loading..." : `Select ${field.label}`}
                />
              </SelectTrigger>

              <SelectContent>
                {allOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldStatusTooltip field={field} rightOffset="right-8" />
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>
          <div className="relative">
            <Select
              disabled={disabled || !!field.read_only}
              value={displayValue || undefined}
              onValueChange={(val) => onChange(val)}
            >
              <SelectTrigger
                className={cn("w-full bg-muted", getValidationClass(field))}
              >
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {allOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldStatusTooltip field={field} rightOffset="right-8" />
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
            className={cn("bg-muted", getValidationClass(field))}
            inputMode={isPhoneField(field) || isPincodeField(field) || isAadhaarField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : undefined}
          />
          <FieldStatusTooltip field={field} />
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
            className={cn("bg-muted", getValidationClass(field))}
            inputMode={isPhoneField(field) || isPincodeField(field) || isAadhaarField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : undefined}
          />
          <FieldStatusTooltip field={field} />
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
            className={cn(className, getValidationClass(field))}
            inputMode={isPhoneField(field) ? "numeric" : undefined}
            maxLength={isPhoneField(field) ? 10 : undefined}
          />
          <FieldStatusTooltip field={field} />
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
