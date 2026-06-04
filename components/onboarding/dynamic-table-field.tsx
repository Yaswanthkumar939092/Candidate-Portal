"use client"

import React from "react"
import { useFieldArray, Control, UseFormSetValue, FieldValues, FieldErrors, Controller, useWatch } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { OnboardingField } from "@/lib/types/onboarding"
import { DynamicFieldRenderer, type DynamicFieldRendererProps } from "@/components/ui/field-renderer"
import { cn } from "@/lib/utils"
import { evaluateDependsOn } from "@/lib/onboarding-utils"

interface DynamicTableFieldProps {
  field: OnboardingField
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  errors: FieldErrors<FieldValues>
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<OnboardingField>['overrides']
}

interface TableRowFieldProps {
  tableFieldname: string
  rowIndex: number
  childField: OnboardingField
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  error?: string
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<OnboardingField>['overrides']
}

const TableRowField = React.memo(function TableRowField({
  tableFieldname,
  rowIndex,
  childField,
  control,
  error,
  onAttachChange,
  overrides,
}: TableRowFieldProps) {
  const fieldPath = `${tableFieldname}.${rowIndex}.${childField.fieldname}`

  return (
    <Controller
      name={fieldPath}
      control={control}
      render={({ field: rhfField }) => (
        <DynamicFieldRenderer
          field={childField}
          value={rhfField.value}
          onChange={(val) => {
            rhfField.onChange(val);
          }}
          onBlur={rhfField.onBlur}
          error={error}
          className={cn(
            "col-span-1",
            childField.fieldname === "custom_i_am_currently_pursuing_this_course" && "md:col-start-1 md:clear-both"
          )}
          onAttachChange={onAttachChange}
          overrides={overrides}
        />
      )}
    />
  )
})

export function DynamicTableField({
  field,
  control,
  setValue,
  errors,
  onAttachChange,
  overrides,
}: DynamicTableFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: field.fieldname,
  })

  // Initialize with one empty row if none exist
  if (fields.length === 0) {
    append({})
  }

  const handleAdd = () => {
    append({})
  }

  const rowValues = useWatch({
    control,
    name: field.fieldname,
  }) || []

  // Automatically clear child fields when they become hidden
  React.useEffect(() => {
    fields.forEach((item, index) => {
      const rowDoc = rowValues[index] || {};
      field.child_fields?.forEach((childField) => {
        if (childField.depends_on) {
          const isVisible = evaluateDependsOn(childField.depends_on, rowDoc);
          if (!isVisible) {
            const path = `${field.fieldname}.${index}.${childField.fieldname}`;
            const val = rowDoc[childField.fieldname];
            if (val !== undefined && val !== "" && val !== null) {
              setValue(path, "", {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        }
      });
    });
  }, [rowValues, fields, field.child_fields, field.fieldname, setValue]);

  return (
    <div className="space-y-4 col-span-full">
      <div className="flex items-center justify-between">
        <Label className="text-base font-bold text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
      </div>

      <div className="space-y-4">
        {fields.map((item, index) => {
          const rowDoc = rowValues[index] || {};

          return (
            <Card key={item.id} className="relative overflow-hidden border border-border/50 bg-muted/20">
              <CardContent className="pt-6">
                {fields.length > 1 && !field.read_only && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 lg:grid-cols-2">
                  {field.child_fields?.map((childField) => {
                    const isVisible = !childField.hidden && (!childField.depends_on || evaluateDependsOn(childField.depends_on, rowDoc));
                    if (!isVisible) return null;

                    return (
                      <TableRowField
                        key={childField.fieldname}
                        tableFieldname={field.fieldname}
                        rowIndex={index}
                        childField={{
                          ...childField,
                          read_only: field.read_only ? 1 : childField.read_only,
                        }}
                        control={control}
                        setValue={setValue}
                        error={((errors?.[field.fieldname] as unknown as Record<number, Record<string, { message?: string }>>)?.[index]?.[childField.fieldname])?.message}
                        onAttachChange={onAttachChange}
                        overrides={overrides}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!field.read_only && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add {field.label}
        </Button>
      )}
    </div>
  )
}
