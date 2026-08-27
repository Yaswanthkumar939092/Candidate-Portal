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
import { useFormContext } from "react-hook-form";
import { evaluateDependsOn } from "@/lib/onboarding-utils";

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
  exclude_values?: string[];
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
  tableFieldname?: string;
  rowIndex?: number;
}

type FieldComponent<T extends FormField> = React.ComponentType<
  FieldComponentProps<T>
>;

interface FieldConfig<T extends FormField> {
  component: FieldComponent<T>;
  props?: (field: T) => Record<string, unknown>;
}

function getFieldClass(field: FormField, value: unknown, error?: string, disabled?: boolean) {
  const isReadOnly = !!field.read_only;
  if (isReadOnly) return "bg-muted";

  if (field.approval_status === "Approved") {
    return "bg-field-success-bg border-field-success border-2 focus-visible:bg-field-success-bg focus-visible:border-field-success focus-visible:ring-field-success/8 dark:bg-emerald-950/10 dark:border-emerald-600 dark:focus-visible:ring-emerald-600/20 pr-10";
  }

  const isValueChanged = (curr: unknown, orig: unknown) => {
    const normCurr = curr === undefined || curr === null ? "" : String(curr).trim();
    const normOrig = orig === undefined || orig === null ? "" : String(orig).trim();
    return normCurr !== normOrig;
  };

  if (field.approval_status === "Rejected" && !isValueChanged(value, field.value)) {
    return "border-destructive outline-destructive focus-visible:ring-destructive border-2 pr-24";
  }

  const isFilled = value !== undefined && value !== null && String(value).trim() !== "";
  const isValid = isFilled && !error && !disabled;

  if (isValid) {
    return "bg-field-success-bg border-field-success border-2 focus-visible:bg-field-success-bg focus-visible:border-field-success focus-visible:ring-field-success/8 dark:bg-emerald-950/10 dark:border-emerald-600 dark:focus-visible:ring-emerald-600/20 pr-10";
  }

  return "bg-[#F1F3F6] border-transparent focus-visible:bg-white focus-visible:border-ring focus-visible:ring-ring/8 dark:bg-zinc-800";
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
    fieldname.includes("contactnumber") ||
    fieldname.includes("contact_number")
  );
}

function isPincodeField(field: FormField) {
  const label = field.label.toLowerCase();
  const fieldname = field.fieldname.toLowerCase();
  return (
    label.includes("pincode") ||
    label.includes("pin code") ||
    label.includes("postalcode") ||
    label.includes("postal code") ||
    fieldname.includes("pincode") ||
    fieldname.includes("pin_code") ||
    fieldname.includes("postalcode") ||
    fieldname.includes("postal_code")
  );
}

function isAadhaarField(field: FormField) {
  const label = field.label.toLowerCase();
  const fieldname = field.fieldname.toLowerCase();
  if (
    fieldname.includes("name") ||
    fieldname.includes("upload") ||
    fieldname.includes("proof") ||
    fieldname.includes("file") ||
    fieldname.includes("attach") ||
    label.includes("name") ||
    label.includes("upload") ||
    label.includes("proof") ||
    label.includes("file") ||
    label.includes("attach")
  ) {
    return false;
  }
  return label.includes("aadhaar") || label.includes("aadhar") || label.includes("uid") || fieldname.includes("aadhaar") || fieldname.includes("aadhar") || fieldname.includes("uid");
}

function isPanField(field: FormField) {
  return field.fieldname === "custom_pan_number";
}

function isAccountNumberField(field: FormField) {
  return field.fieldname === "custom_account_number";
}

function isFieldRequired(field: FormField, doc: Record<string, unknown> = {}) {
  return Boolean(
    field.is_mandatory ||
      field.reqd ||
      (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, doc)),
  );
}

function normalizeInputValue(field: FormField, rawValue: string) {
  if (
    field.fieldname === "custom_name_as_per_aadhaar" ||
    field.fieldname === "custom_name_as_per_pan"
  ) {
    return rawValue.replace(/[^a-zA-Z\s]/g, "");
  }

  if (field.fieldname === "custom_ifsc_code") {
    return rawValue.toUpperCase().slice(0, 11);
  }

  if (isPhoneField(field)) {
    return rawValue.replace(/\D/g, "").slice(0, 10);
  }

  if (isPincodeField(field)) {
    return rawValue.replace(/\D/g, "").slice(0, 6);
  }

  if (isAadhaarField(field)) {
    return rawValue.replace(/\D/g, "").slice(0, 12);
  }

  if (isAccountNumberField(field)) {
    return rawValue.replace(/\D/g, "");
  }

  if (isPanField(field)) {
    return rawValue.toUpperCase().slice(0, 10);
  }

  if (field.fieldname === "custom_permanent_postal_code") {
    return rawValue.replace(/\D/g, "").slice(0, 6);
  }

  const isPercent =
    (field.fieldname || "").toLowerCase().includes("percentage") ||
    (field.label || "").toLowerCase().includes("percentage") ||
    field.fieldtype === "Percent";

  if (field.fieldtype === "Int") {
    const cleaned = rawValue.replace(/\D/g, "");
    return isPercent ? cleaned.slice(0, 3) : cleaned;
  }

  if (field.fieldtype === "Float") {
    let cleaned = rawValue.replace(/[^0-9.]/g, "");
    if (isPercent) {
      const dotIndex = cleaned.indexOf(".");
      if (dotIndex === -1) {
        cleaned = cleaned.slice(0, 3);
      } else {
        const beforeDot = cleaned.slice(0, dotIndex).slice(0, 3);
        const allowedAfter = Math.max(0, 3 - beforeDot.length);
        const afterDot = cleaned.slice(dotIndex + 1);
        if (allowedAfter === 0) {
          cleaned = beforeDot;
        } else {
          cleaned = beforeDot + "." + afterDot.slice(0, allowedAfter);
        }
      }
    }
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
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
  error,
  disabled,
}: {
  field: FormField;
  value?: unknown;
  rightOffset?: string;
  error?: string;
  disabled?: boolean;
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

  const isFilled = value !== undefined && value !== null && String(value).trim() !== "";
  const isValid = isFilled && !error && !disabled;

  if (isValid) {
    return (
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-field-success bg-transparent rounded-full z-10",
          rightOffset,
        )}
      >
        <Check className="h-4 w-4" />
      </div>
    );
  }

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

function FieldInput({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}) {
  const isPhone = isPhoneField(field);
  const baseClass = getFieldClass(field, value, error, disabled);

  if (isPhone) {
    const containerClass = cn(
      "flex items-center rounded-md border transition-all duration-200 w-full bg-[#F1F3F6] dark:bg-zinc-800 border-transparent",
      baseClass.replace(/focus-visible:/g, "focus-within:").replace(/focus:/g, "focus-within:")
    );

    const inputClass = cn(
      baseClass,
      "w-full h-9 px-0 py-1 text-sm bg-transparent border-0 outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
    );

    return (
      <div className={containerClass}>
        <span className="pl-3 text-sm font-semibold text-muted-foreground/80 select-none">
          +91
        </span>
        <span className="mx-2 text-muted-foreground/30 select-none">|</span>
        <input
          type="text"
          value={typeof value === "string" ? normalizeInputValue(field, value) : (value as string) || ""}
          onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
          onBlur={onBlur}
          placeholder="9876543210"
          disabled={disabled || !!field.read_only}
          className={inputClass}
          inputMode="numeric"
          maxLength={10}
        />
      </div>
    );
  }

  return (
    <Input
      type={isEmailField(field) ? "email" : "text"}
      value={typeof value === "string" ? normalizeInputValue(field, value) : (value as string) || ""}
      onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
      onBlur={onBlur}
      placeholder={field.label}
      disabled={disabled || !!field.read_only}
      className={baseClass}
      inputMode={isPincodeField(field) || isAadhaarField(field) || isAccountNumberField(field) ? "numeric" : undefined}
      maxLength={isPincodeField(field) ? 6 : isAadhaarField(field) ? 12 : isPanField(field) ? 10 : field.fieldname === "custom_ifsc_code" ? 11 : undefined}
    />
  );
}

const defaultFields: Record<FieldType, FieldConfig<FormField> | null> = {
  Data: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => {
      const isKnownLanguages = field.fieldname === "custom_known_languages";

      if (isKnownLanguages) {
        const LANGUAGES = [
          "English",
          "Hindi",
          "Marathi",
          "Gujarati",
          "Tamil",
          "Telugu",
          "Kannada",
          "Bengali",
          "Malayalam",
          "Punjabi",
          "Odia",
          "Urdu",
        ];

        // Parse comma-separated value
        const selectedLanguages = typeof value === "string"
          ? value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        const handleToggleLanguage = (lang: string) => {
          let newList: string[];
          if (selectedLanguages.includes(lang)) {
            newList = selectedLanguages.filter((l) => l !== lang);
          } else {
            newList = [...selectedLanguages, lang];
          }
          onChange(newList.join(", "));
        };

        return (
          <div className={cn("space-y-1.5", className)}>
            <Label className="text-sm font-medium text-foreground">
              {field.label}{" "}
              {!!(field.is_mandatory || field.reqd) && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <div className="relative">
              <FieldInput
                field={field}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                error={error}
                disabled={disabled}
              />
              <FieldStatusTooltip
                field={field}
                value={value}
                error={error}
                disabled={disabled}
              />
            </div>

            {/* Language Chips */}
            <div className="flex flex-wrap gap-2 mt-2 select-none">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    disabled={disabled || !!field.read_only}
                    onClick={() => handleToggleLanguage(lang)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full font-semibold border transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "bg-[#5B2EE5] text-white border-transparent shadow-sm shadow-purple-500/10"
                        : "bg-white dark:bg-zinc-900 text-muted-foreground border-border hover:bg-muted dark:hover:bg-zinc-800",
                    )}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      }

      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label}{" "}
            {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>
          <div className="relative">
            <FieldInput
              field={field}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              error={error}
              disabled={disabled}
            />
            <FieldStatusTooltip
              field={field}
              value={value}
              error={error}
              disabled={disabled}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Int: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => {
      const isPercent =
        (field.fieldname || "").toLowerCase().includes("percentage") ||
        (field.label || "").toLowerCase().includes("percentage") ||
        field.fieldtype === "Percent";
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
              type="number"
              min="0"
              max={isPercent ? "100" : undefined}
              value={typeof value === "string" ? normalizeInputValue(field, value) : (value as string) || ""}
              onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
              onBlur={onBlur}
              placeholder={field.label}
              disabled={disabled || !!field.read_only}
              className={getFieldClass(field, value, error, disabled)}
            />
            <FieldStatusTooltip field={field} value={value} error={error} disabled={disabled} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Float: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => {
      const isPercent =
        (field.fieldname || "").toLowerCase().includes("percentage") ||
        (field.label || "").toLowerCase().includes("percentage") ||
        field.fieldtype === "Percent";
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
              type="number"
              step="any"
              min="0"
              max={isPercent ? "100" : undefined}
              value={typeof value === "string" ? normalizeInputValue(field, value) : (value as string) || ""}
              onChange={(e) => onChange(normalizeInputValue(field, e.target.value))}
              onBlur={onBlur}
              placeholder={field.label}
              disabled={disabled || !!field.read_only}
              className={getFieldClass(field, value, error, disabled)}
            />
            <FieldStatusTooltip field={field} value={value} error={error} disabled={disabled} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Date: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => {
      let maxDateAttr: string | undefined = undefined;
      if (field.fieldname === "custom_date_of_birth" || field.fieldname === "dob") {
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        maxDateAttr = eighteenYearsAgo.toISOString().split("T")[0];
      }
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
              className={getFieldClass(field, value, error, disabled)}
              max={maxDateAttr}
            />
            <FieldStatusTooltip field={field} value={value} error={error} disabled={disabled} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Link: {
    component: ({
      field,
      value,
      onChange,
      onBlur,
      error,
      disabled,
      className,
      tableFieldname,
      rowIndex,
    }) => {
      const [search, setSearch] = React.useState("");
      const debouncedSearch = useDebounce(search, 300);

      const formContext = useFormContext();
      
      // Determine if there are dynamic filters based on other fields
      let activeFilters: Record<string, string> | undefined = undefined;
      let watchedDependencyValue = ""; // Value to monitor for auto-clearing

      if (formContext) {
        // City fields depend on State fields
        if (field.fieldname === "custom_permanent_city") {
          const rawState = formContext.watch("custom_permanent_state");
          watchedDependencyValue = (rawState && typeof rawState === "object")
            ? ((rawState as any).id || (rawState as any).name || (rawState as any).value || "")
            : String(rawState || "");
          if (watchedDependencyValue) activeFilters = { state: watchedDependencyValue };
        } else if (field.fieldname === "custom_communication_city") {
          const rawState = formContext.watch("custom_communication_state");
          watchedDependencyValue = (rawState && typeof rawState === "object")
            ? ((rawState as any).id || (rawState as any).name || (rawState as any).value || "")
            : String(rawState || "");
          if (watchedDependencyValue) activeFilters = { state: watchedDependencyValue };
        }
        // Degree depends on Education Level
        else if (field.fieldname === "degree") {
          const watchPath = (tableFieldname && rowIndex !== undefined)
            ? `${tableFieldname}.${rowIndex}.education_level`
            : "education_level";
          const rawEdLevel = formContext.watch(watchPath);
          watchedDependencyValue = (rawEdLevel && typeof rawEdLevel === "object")
            ? ((rawEdLevel as any).id || (rawEdLevel as any).name || (rawEdLevel as any).value || "")
            : String(rawEdLevel || "");
          if (watchedDependencyValue) activeFilters = { education_stage: watchedDependencyValue };
        }
      }

      // Clear the selected value if the dependent field value changes
      const prevDependencyRef = React.useRef(watchedDependencyValue);
      React.useEffect(() => {
        if (prevDependencyRef.current && prevDependencyRef.current !== watchedDependencyValue) {
          onChange("");
        }
        prevDependencyRef.current = watchedDependencyValue;
      }, [watchedDependencyValue, onChange]);

      const doctype = field.options || "";
      const { data, isLoading } = useLinkFieldOptions(doctype, debouncedSearch, activeFilters);
      const results = data?.results ?? [];

      let displayValue = "";
      if (value) {
        if (typeof value === "object" && value !== null) {
          displayValue = (value as any).id || (value as any).name || (value as any).value || "";
        } else {
          displayValue = String(value);
        }
      }

      let minYear: number | null = null;
      let maxYear: number | null = null;
      if (
        formContext &&
        tableFieldname === "custom_education_details" &&
        field.fieldname === "year_of_passing" &&
        rowIndex !== undefined
      ) {
        const EDUCATION_LEVEL_ORDER: Record<string, number> = {
          "10th": 1,
          "12th": 2,
          "Graduation": 3,
          "Post Graduation": 4,
        };
        const currentLevel = formContext.watch(
          `${tableFieldname}.${rowIndex}.education_level`
        );
        const currentRank = EDUCATION_LEVEL_ORDER[currentLevel];
        if (currentRank) {
          const rows = formContext.watch(tableFieldname) || [];
          rows.forEach((row: any, idx: number) => {
            if (idx === rowIndex) return;
            const level = String(row.education_level || "").trim();
            const rank = EDUCATION_LEVEL_ORDER[level];
            if (rank) {
              const yearVal = parseInt(row.year_of_passing, 10);
              if (!isNaN(yearVal)) {
                if (rank < currentRank) {
                  if (minYear === null || yearVal > minYear) {
                    minYear = yearVal;
                  }
                } else if (rank > currentRank) {
                  if (maxYear === null || yearVal < maxYear) {
                    maxYear = yearVal;
                  }
                }
              }
            }
          });
        }
      }

      const comboboxOptions = React.useMemo(() => {
        const finalOptions: Array<{ value: string; label: string }> = [];
        const seen = new Set<string>();
        const excludeSet = new Set(field.exclude_values || []);

        const matchingResult = results.find((r) => r.id === displayValue);

        if (displayValue) {
          const displayYear = parseInt(displayValue, 10);
          let displayIsValid = true;
          if (!isNaN(displayYear)) {
            if (minYear !== null && displayYear <= minYear) displayIsValid = false;
            if (maxYear !== null && displayYear >= maxYear) displayIsValid = false;
          }
          if (displayIsValid) {
            finalOptions.push({
              value: displayValue,
              label: matchingResult ? matchingResult.label : displayValue,
            });
            seen.add(displayValue);
          }
        }

        results.forEach((opt) => {
          // Filter out excluded values (already used in other rows)
          if (excludeSet.has(opt.id)) return;

          const optYear = parseInt(opt.id, 10);
          if (!isNaN(optYear)) {
            if (minYear !== null && optYear <= minYear) return;
            if (maxYear !== null && optYear >= maxYear) return;
          }
          if (!seen.has(opt.id)) {
            finalOptions.push({ value: opt.id, label: opt.label });
            seen.add(opt.id);
          }
        });

        return finalOptions;
      }, [results, displayValue, minYear, maxYear, field.exclude_values]);

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
              onBlur={onBlur}
              className={getFieldClass(field, displayValue, error, disabled)}
            />
            <FieldStatusTooltip field={field} value={displayValue} rightOffset="right-8" error={error} disabled={disabled} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    },
  },
  Select: {
    component: ({ field, value, onChange, onBlur, error, disabled, className }) => {
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
              onBlur={onBlur}
              className={getFieldClass(field, displayValue, error, disabled)}
            />
            <FieldStatusTooltip field={field} value={displayValue} rightOffset="right-8" error={error} disabled={disabled} />
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
          <FieldInput
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
          />
          <FieldStatusTooltip field={field} value={value} error={error} disabled={disabled} />
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
          <FieldInput
            field={field}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
          />
          <FieldStatusTooltip field={field} value={value} error={error} disabled={disabled} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Check: {
    component: ({ field, value, onChange, error, disabled, className }) => {
      const isDisabled = disabled || !!field.read_only;
      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className={cn("flex items-center gap-2", isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={isDisabled}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary disabled:opacity-50"
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
      );
    },
  },
};

function parseOptions(options?: string): string[] {
  if (!options) return [];
  if (options.includes("\n")) {
    return options
      .split("\n")
      .map((opt) => opt.trim())
      .filter(Boolean);
  }
  const trimmed = options.trim();
  return trimmed ? [trimmed] : [];
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
  tableFieldname?: string;
  rowIndex?: number;
  document?: Record<string, unknown>;
}

export function formatIndianFormat(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);
  // Clean all characters except digits and decimal point
  const clean = str.replace(/[^0-9.]/g, "");
  if (!clean) return "";

  const parts = clean.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts.slice(1).join("") : "";

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInteger =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  return clean.includes(".")
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
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
  tableFieldname,
  rowIndex,
  document,
}: DynamicFieldRendererProps<T>) {
  if (field.hidden) return null;

  const isReadOnly = !!field.read_only;
  const required = isFieldRequired(field, document);
  const fieldForRender = {
    ...field,
    is_mandatory: required ? 1 : 0,
  } as T;

  const allFields = { ...defaultFields, ...overrides } as Record<
    FieldType,
    FieldConfig<T> | null
  >;
  const fieldConfig = allFields[fieldForRender.fieldtype as FieldType];

  let element: React.ReactNode;

  const isCtcField = field.fieldname === "custom_current_ctc" || field.fieldname === "custom_expected_ctc";

  if (isCtcField) {
    const baseClass = getFieldClass(fieldForRender, value, error, disabled);
    element = (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {fieldForRender.label}{" "}
          {required && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            type="text"
            value={formatIndianFormat(value)}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9.]/g, "");
              const parts = clean.split(".");
              const cleaned = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : clean;
              onChange(cleaned);
            }}
            onBlur={onBlur}
            placeholder={fieldForRender.label}
            disabled={disabled || isReadOnly}
            className={baseClass}
          />
          <FieldStatusTooltip field={fieldForRender} value={value} error={error} disabled={disabled} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  } else if (!fieldConfig) {
    element = (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {fieldForRender.label}{" "}
          {required && (
            <span className="text-destructive">*</span>
          )}
        </Label>
        <div className="relative">
          <FieldInput
            field={fieldForRender}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
          />
          <FieldStatusTooltip field={fieldForRender} value={value} error={error} disabled={disabled} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  } else if (fieldForRender.fieldtype === "Attach Image" || fieldForRender.fieldtype === "Attach") {
    if (!onAttachChange) {
      element = (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            File upload not configured
          </p>
        </div>
      );
    } else {
      const FileUploadComponent = overrides?.[fieldForRender.fieldtype as FieldType]
        ?.component as FieldComponent<T> | undefined;

      if (FileUploadComponent) {
        element = (
          <FileUploadComponent
            field={fieldForRender}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={error}
            disabled={disabled}
          />
        );
      } else {
        element = (
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              File upload handler not provided
            </p>
          </div>
        );
      }
    }
  } else {
    const { component: FieldComponent } = fieldConfig;
    element = (
      <FieldComponent
        field={fieldForRender}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        disabled={disabled}
        tableFieldname={tableFieldname}
        rowIndex={rowIndex}
      />
    );
  }

  return (
    <div
      id={`field-${field.fieldname}`}
      data-fieldname={field.fieldname}
      className={className}
    >
      {element}
    </div>
  );
}

export { defaultFields };
