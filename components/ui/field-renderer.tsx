/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FrappeAPI } from '@/lib/frappe-api'
import { cn } from '@/lib/utils'
import React from 'react'

export interface FormField {
  fieldname: string
  label: string
  fieldtype: string
  is_mandatory?: boolean | number
  reqd?: boolean | number
  read_only?: boolean | number
  hidden?: boolean | number
  options?: string
}

export interface FieldRendererProps<T extends FormField> {
  field: T
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
  className?: string
}

type FieldType = 'Data' | 'Int' | 'Float' | 'Date' | 'Link' | 'Select' | 'Attach Image' | 'Attach' | 'Text' | 'Small Text' | 'Check' | string

interface FieldComponentProps<T extends FormField> {
  field: T
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
  className?: string
}

type FieldComponent<T extends FormField> = React.ComponentType<FieldComponentProps<T>>

interface FieldConfig<T extends FormField> {
  component: FieldComponent<T>
  props?: (field: T) => Record<string, unknown>
}

const defaultFields: Record<FieldType, FieldConfig<FormField> | null> = {
  Data: {
    component: ({ field, value, onChange, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="text"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled || !!field.read_only}
          className="bg-muted"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Int: {
    component: ({ field, value, onChange, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="number"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled || !!field.read_only}
          className="bg-muted"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Float: {
    component: ({ field, value, onChange, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="number"
          step="any"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled || !!field.read_only}
          className="bg-muted"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Date: {
    component: ({ field, value, onChange, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="date"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !!field.read_only}
          className="bg-muted"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  Link: {
    component: ({ field, value, onChange, error, disabled, className }) => {
      const [options, setOptions] = React.useState<string[]>([])
      const [loading, setLoading] = React.useState(false)

      React.useEffect(() => {
        if (!field.options) return;
       const doctype = field.options;
        const fetchOptions = async () => {
          try {
            setLoading(true);
            const res = await FrappeAPI.getresourceDocumentData(
              doctype,
              {
                fields: ["name"],
                page: 1,     // ✅ from component
                limit: 100000,   // ✅ from component
              }
            );
            const data = res?.data || [];
            const optionsList = data.map((item: any) => item.name);
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
  
      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label} {!!(field.is_mandatory || field.reqd) && (
              <span className="text-destructive">*</span>
            )}
          </Label>
  
          <Select
            disabled={disabled || !!field.read_only || loading}
            value={(value as string) || ""}
            onValueChange={(val) => onChange(val)}
          >
            <SelectTrigger className="w-full bg-muted">
              <SelectValue
                placeholder={
                  loading ? "Loading..." : `Select ${field.label}`
                }
              />
            </SelectTrigger>
  
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
  
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )
    },
  },
  Select: {
    component: ({ field, value, onChange, error, disabled, className }) => {
      const options = parseOptions(field.options)
      return (
        <div className={cn("space-y-1.5", className)}>
          <Label className="text-sm font-medium text-foreground">
            {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
          </Label>
          <Select
            disabled={disabled || !!field.read_only}
            value={(value as string) || ''}
            onValueChange={(val) => onChange(val)}
          >
            <SelectTrigger className="w-full bg-muted">
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )
    },
  },
  'Attach Image': null,
  Attach: null,
  Text: {
    component: ({ field, value, onChange, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="text"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled || !!field.read_only}
          className="bg-muted"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
  'Small Text': {
    component: ({ field, value, onChange, error, disabled, className }) => (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          type="text"
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled || !!field.read_only}
          className="bg-muted"
        />
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
            {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
          </span>
        </Label>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    ),
  },
}

function parseOptions(options?: string): string[] {
  if (!options) return []
  const byNewline = options.split('\n').map((opt) => opt.trim()).filter(Boolean)
  if (byNewline.length > 1) return byNewline
  return options.split(' ').map((opt) => opt.trim()).filter(Boolean)
}

export interface DynamicFieldRendererProps<T extends FormField> {
  field: T
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
  className?: string
  overrides?: Partial<Record<FieldType, FieldConfig<T>>>
  onAttachChange?: (fieldname: string) => (url: string | null) => void
}

export function DynamicFieldRenderer<T extends FormField>({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
  overrides,
  onAttachChange,
}: DynamicFieldRendererProps<T>) {
  if (field.hidden) return null

  const isReadOnly = !!(field.read_only)

  const allFields = { ...defaultFields, ...overrides } as Record<FieldType, FieldConfig<T> | null>
  const fieldConfig = allFields[field.fieldtype as FieldType]

  if (!fieldConfig) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Label className="text-sm font-medium text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
        <Input
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          disabled={disabled || isReadOnly}
          className={className}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  const { component: FieldComponent } = fieldConfig

  if (field.fieldtype === 'Attach Image' || field.fieldtype === 'Attach') {
    if (!onAttachChange) {
      return (
        <div className={cn("space-y-1.5", className)}>
          <p className="text-sm text-muted-foreground">File upload not configured</p>
        </div>
      )
    }

    const FileUploadComponent = overrides?.[field.fieldtype as FieldType]?.component as FieldComponent<T> | undefined

    if (FileUploadComponent) {
      return (
        <FileUploadComponent
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
          className={className}
        />
      )
    }

    return (
      <div className={cn("space-y-1.5", className)}>
        <p className="text-sm text-muted-foreground">File upload handler not provided</p>
      </div>
    )
  }

  return (
    <FieldComponent
      field={field}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      className={className}
    />
  )
}

export { defaultFields }
