"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, boolean>
  | null
  | undefined;
type FormValues = Record<string, FormValue>;

export interface FormioOption {
  label?: string;
  value?: string | number | boolean;
}

export interface FormioComponent {
  key?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  input?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  defaultValue?: FormValue;
  multiple?: boolean;
  values?: FormioOption[];
  data?: {
    values?: FormioOption[];
    json?: FormioOption[];
    custom?: FormioOption[];
  };
  validate?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
    customMessage?: string;
  };
  conditional?: {
    show?: boolean;
    when?: string;
    eq?: unknown;
    json?: unknown;
  };
  customConditional?: string;
  components?: FormioComponent[];
  columns?: Array<{ components?: FormioComponent[]; width?: number }>;
  rows?: Array<Array<{ components?: FormioComponent[] }>>;
}

export interface DynamicSurveyFormProps {
  schema?: { components?: FormioComponent[] } | null;
  values: FormValues;
  onValuesChange: (values: FormValues) => void;
  onSubmit: (values: FormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  className?: string;
}

const supportedInputTypes = new Set([
  "textfield",
  "textarea",
  "select",
  "checkbox",
  "selectboxes",
  "radio",
  "number",
  "email",
  "date",
  "datetime",
  "day",
  "time",
  "phoneNumber",
  "url",
  "password",
]);

function getComponents(schema?: { components?: FormioComponent[] } | null) {
  return Array.isArray(schema?.components) ? schema.components : [];
}

function getOptions(component: FormioComponent): FormioOption[] {
  const options =
    component.data?.values ??
    component.data?.json ??
    component.data?.custom ??
    component.values ??
    [];

  return options
    .filter((option) => option && option.value !== undefined)
    .map((option) => ({
      label: option.label ?? String(option.value),
      value: option.value,
    }));
}

function optionValue(value: FormioOption["value"]) {
  return String(value ?? "");
}

function isEmpty(value: FormValue) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.values(value).every((item) => !item))
  );
}

function valuesEqual(left: unknown, right: unknown) {
  return String(left ?? "") === String(right ?? "");
}

function runConditionalSnippet(
  source: string | undefined,
  data: FormValues,
  component: FormioComponent,
) {
  if (!source?.trim()) return true;

  try {
    const fn = new Function(
      "data",
      "component",
      "row",
      "show",
      `"use strict"; let visible = show; ${source}; return typeof show === "boolean" ? show : visible;`,
    );
    return Boolean(fn(data, component, data, true));
  } catch {
    return true;
  }
}

function evaluateJsonConditional(json: unknown, data: FormValues): boolean {
  if (!json || typeof json !== "object") return true;

  const condition = json as Record<string, unknown>;
  if ("and" in condition && Array.isArray(condition.and)) {
    return condition.and.every((item) => evaluateJsonConditional(item, data));
  }
  if ("or" in condition && Array.isArray(condition.or)) {
    return condition.or.some((item) => evaluateJsonConditional(item, data));
  }
  if ("!" in condition) {
    return !evaluateJsonConditional(condition["!"], data);
  }
  if ("===" in condition && Array.isArray(condition["==="])) {
    const [left, right] = condition["==="] as unknown[];
    return valuesEqual(
      resolveJsonValue(left, data),
      resolveJsonValue(right, data),
    );
  }
  if ("==" in condition && Array.isArray(condition["=="])) {
    const [left, right] = condition["=="] as unknown[];
    return valuesEqual(
      resolveJsonValue(left, data),
      resolveJsonValue(right, data),
    );
  }

  return true;
}

function resolveJsonValue(value: unknown, data: FormValues): unknown {
  if (
    value &&
    typeof value === "object" &&
    "var" in (value as Record<string, unknown>)
  ) {
    const path = String((value as Record<string, unknown>).var ?? "");
    const key = path.replace(/^data\./, "");
    return data[key];
  }

  return value;
}

function isVisible(component: FormioComponent, values: FormValues): boolean {
  if (component.hidden) return false;

  const conditional = component.conditional;
  if (conditional?.when) {
    const actual = values[conditional.when];
    const matches = valuesEqual(actual, conditional.eq);
    if (conditional.show === false ? matches : !matches) return false;
  }

  if (conditional?.json && !evaluateJsonConditional(conditional.json, values)) {
    return false;
  }

  return runConditionalSnippet(component.customConditional, values, component);
}

function flattenInputComponents(
  components: FormioComponent[],
  values: FormValues,
): FormioComponent[] {
  return components.flatMap((component) => {
    if (!isVisible(component, values)) return [];

    const nested = [
      ...(component.components ?? []),
      ...(component.columns?.flatMap((column) => column.components ?? []) ??
        []),
      ...(component.rows?.flatMap((row) =>
        row.flatMap((cell) => cell.components ?? []),
      ) ?? []),
    ];

    const ownComponent =
      component.key &&
      component.input !== false &&
      supportedInputTypes.has(component.type ?? "")
        ? [component]
        : [];

    return [...ownComponent, ...flattenInputComponents(nested, values)];
  });
}

function validateComponent(
  component: FormioComponent,
  value: FormValue,
  values: FormValues,
) {
  const label = component.label || component.key || "This field";
  const validate = component.validate ?? {};
  const text = String(value ?? "");

  if (validate.required && isEmpty(value)) {
    return `${label} is required.`;
  }

  if (isEmpty(value)) return null;

  if (component.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return validate.customMessage || "Enter a valid email address.";
  }

  if (validate.minLength && text.length < validate.minLength) {
    return `${label} must be at least ${validate.minLength} characters.`;
  }

  if (validate.maxLength && text.length > validate.maxLength) {
    return `${label} must be ${validate.maxLength} characters or fewer.`;
  }

  if (validate.pattern) {
    try {
      if (!new RegExp(validate.pattern).test(text)) {
        return validate.customMessage || `${label} has an invalid format.`;
      }
    } catch {
      return null;
    }
  }

  if (component.type === "number") {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return `${label} must be a number.`;
    if (validate.min !== undefined && numericValue < validate.min) {
      return `${label} must be at least ${validate.min}.`;
    }
    if (validate.max !== undefined && numericValue > validate.max) {
      return `${label} must be no more than ${validate.max}.`;
    }
  }

  if (validate.custom?.trim()) {
    try {
      const fn = new Function(
        "input",
        "data",
        "component",
        `"use strict"; let valid = true; ${validate.custom}; return valid;`,
      );
      const result = fn(value, values, component);
      if (result !== true) {
        return typeof result === "string"
          ? result
          : validate.customMessage || `${label} is invalid.`;
      }
    } catch {
      return validate.customMessage || null;
    }
  }

  return null;
}

function visibleValues(components: FormioComponent[], values: FormValues) {
  return flattenInputComponents(components, values).reduce<FormValues>(
    (acc, component) => {
      if (!component.key) return acc;
      acc[component.key] =
        values[component.key] ?? component.defaultValue ?? "";
      return acc;
    },
    {},
  );
}

export function DynamicSurveyForm({
  schema,
  values,
  onValuesChange,
  onSubmit,
  isSubmitting,
  className,
}: DynamicSurveyFormProps) {
  const components = getComponents(schema);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setValue = (key: string, value: FormValue) => {
    const nextValues = { ...values, [key]: value };
    onValuesChange(nextValues);
    if (errors[key]) {
      const component = flattenInputComponents(components, nextValues).find(
        (item) => item.key === key,
      );
      setErrors((current) => ({
        ...current,
        [key]: component
          ? (validateComponent(component, value, nextValues) ?? "")
          : "",
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const visibleComponents = flattenInputComponents(components, values);
    const nextErrors = visibleComponents.reduce<Record<string, string>>(
      (acc, component) => {
        if (!component.key) return acc;
        const error = validateComponent(
          component,
          values[component.key],
          values,
        );
        if (error) acc[component.key] = error;
        return acc;
      },
      {},
    );

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit(visibleValues(components, values));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("p-6 sm:p-8 space-y-6", className)}
      noValidate
    >
      <div className="space-y-6">
        {components.map((component, index) => (
          <SurveyComponent
            key={component.key ?? `${component.type}-${index}`}
            component={component}
            values={values}
            errors={errors}
            onChange={setValue}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 font-medium flex items-center justify-center gap-2 group transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Responses
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function SurveyComponent({
  component,
  values,
  errors,
  onChange,
}: {
  component: FormioComponent;
  values: FormValues;
  errors: Record<string, string>;
  onChange: (key: string, value: FormValue) => void;
}) {
  if (!isVisible(component, values)) return null;

  if (component.type === "button" || component.input === false) return null;

  if (component.columns?.length) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {component.columns.map((column, index) => (
          <div key={index} className="space-y-6">
            {(column.components ?? []).map((child, childIndex) => (
              <SurveyComponent
                key={child.key ?? `${child.type}-${childIndex}`}
                component={child}
                values={values}
                errors={errors}
                onChange={onChange}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (
    component.components?.length &&
    !supportedInputTypes.has(component.type ?? "")
  ) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-background/30 p-4">
        {component.label && (
          <h2 className="text-sm font-semibold text-foreground">
            {component.label}
          </h2>
        )}
        {component.components.map((child, index) => (
          <SurveyComponent
            key={child.key ?? `${child.type}-${index}`}
            component={child}
            values={values}
            errors={errors}
            onChange={onChange}
          />
        ))}
      </div>
    );
  }

  if (!component.key) return null;

  return (
    <SurveyField
      component={component}
      value={values[component.key] ?? component.defaultValue ?? ""}
      error={errors[component.key]}
      onChange={(value) => onChange(component.key!, value)}
    />
  );
}

function SurveyField({
  component,
  value,
  error,
  onChange,
}: {
  component: FormioComponent;
  value: FormValue;
  error?: string;
  onChange: (value: FormValue) => void;
}) {
  const isRequired = Boolean(component.validate?.required);
  const label = component.label || component.key || "";
  const id = `survey-${component.key}`;
  const describedBy = component.description ? `${id}-description` : undefined;

  if (component.type === "checkbox") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/30 p-4">
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={component.disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <div className="space-y-1 leading-none">
          <FieldLabel id={id} label={label} required={isRequired} />
          <FieldDescription
            id={describedBy}
            description={component.description}
          />
          <FieldError error={error} />
        </div>
      </div>
    );
  }

  if (component.type === "selectboxes") {
    const selected =
      value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return (
      <FieldShell
        id={id}
        label={label}
        required={isRequired}
        description={component.description}
        error={error}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {getOptions(component).map((option) => {
            const stringValue = optionValue(option.value);
            const checked = Boolean(selected[stringValue]);
            return (
              <label
                key={stringValue}
                className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-3 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    onChange({
                      ...selected,
                      [stringValue]: isChecked === true,
                    });
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </FieldShell>
    );
  }

  if (component.type === "radio") {
    return (
      <FieldShell
        id={id}
        label={label}
        required={isRequired}
        description={component.description}
        error={error}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {getOptions(component).map((option) => {
            const stringValue = optionValue(option.value);
            return (
              <label
                key={stringValue}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border bg-background/50 p-3 text-sm transition-colors",
                  value === stringValue && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name={component.key}
                  value={stringValue}
                  checked={value === stringValue}
                  onChange={(event) => onChange(event.target.value)}
                  className="size-4 accent-primary"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </FieldShell>
    );
  }

  if (component.type === "select") {
    return (
      <FieldShell
        id={id}
        label={label}
        required={isRequired}
        description={component.description}
        error={error}
      >
        <Select
          value={String(value ?? "")}
          onValueChange={onChange}
          disabled={component.disabled}
        >
          <SelectTrigger
            id={id}
            className="w-full bg-background/50"
            aria-invalid={Boolean(error)}
          >
            <SelectValue
              placeholder={component.placeholder || `Select ${label}`}
            />
          </SelectTrigger>
          <SelectContent>
            {getOptions(component).map((option) => (
              <SelectItem
                key={optionValue(option.value)}
                value={optionValue(option.value)}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>
    );
  }

  if (component.type === "textarea") {
    return (
      <FieldShell
        id={id}
        label={label}
        required={isRequired}
        description={component.description}
        error={error}
      >
        <Textarea
          id={id}
          placeholder={component.placeholder}
          value={String(value ?? "")}
          disabled={component.disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="min-h-25 bg-background/50"
        />
      </FieldShell>
    );
  }

  const inputType =
    component.type === "phoneNumber"
      ? "tel"
      : component.type === "datetime"
        ? "datetime-local"
        : component.type === "day"
          ? "date"
          : component.type === "textfield"
            ? "text"
            : component.type || "text";

  return (
    <FieldShell
      id={id}
      label={label}
      required={isRequired}
      description={component.description}
      error={error}
    >
      <Input
        id={id}
        type={inputType}
        placeholder={component.placeholder}
        value={String(value ?? "")}
        disabled={component.disabled}
        onChange={(event) => {
          if (component.type !== "number") {
            onChange(event.target.value);
            return;
          }

          onChange(
            Number.isNaN(event.target.valueAsNumber)
              ? event.target.value
              : event.target.valueAsNumber,
          );
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="bg-background/50"
      />
    </FieldShell>
  );
}

function FieldShell({
  id,
  label,
  required,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="space-y-2">
      <FieldLabel id={id} label={label} required={required} />
      {children}
      <FieldDescription id={descriptionId} description={description} />
      <FieldError error={error} />
    </div>
  );
}

function FieldLabel({
  id,
  label,
  required,
}: {
  id: string;
  label: string;
  required: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className="text-sm font-semibold text-foreground/90 flex items-center gap-1"
    >
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );
}

function FieldDescription({
  id,
  description,
}: {
  id?: string;
  description?: string;
}) {
  if (!description) return null;

  return (
    <p id={id} className="text-xs text-muted-foreground">
      {description}
    </p>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;

  return <p className="text-xs font-medium text-destructive">{error}</p>;
}
