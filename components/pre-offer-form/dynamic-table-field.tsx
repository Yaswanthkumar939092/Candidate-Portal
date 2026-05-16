"use client"

import React from "react"
import { useFieldArray, Control, UseFormSetValue, FieldValues, FieldErrors, Controller } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PreOfferField } from "@/lib/types/pre-offer"
import { DynamicFieldRenderer, type DynamicFieldRendererProps } from "@/components/ui/field-renderer"
import { cn } from "@/lib/utils"

interface DynamicTableFieldProps {
  field: PreOfferField
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  errors: FieldErrors<FieldValues>
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<PreOfferField>['overrides']
  isSubmitted?: boolean
}

interface TableRowFieldProps {
  tableFieldname: string
  rowIndex: number
  childField: PreOfferField
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  error?: string
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<PreOfferField>['overrides']
  tableIsReadOnly?: boolean
}

const TableRowField = React.memo(function TableRowField({
  tableFieldname,
  rowIndex,
  childField,
  control,
  error,
  onAttachChange,
  overrides,
  tableIsReadOnly,
}: TableRowFieldProps) {
  const fieldPath = `${tableFieldname}.${rowIndex}.${childField.fieldname}`

  const finalField = React.useMemo(() => ({
    ...childField,
    read_only: tableIsReadOnly ? 1 : childField.read_only,
  }), [childField, tableIsReadOnly]);

  return (
    <Controller
      name={fieldPath}
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

export const DynamicTableField = React.memo(function DynamicTableField({
  field,
  control,
  setValue,
  errors,
  onAttachChange,
  overrides,
  isSubmitted,
}: DynamicTableFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: field.fieldname,
  })

  const isReadOnly = React.useMemo(() => 
    isSubmitted || !!field.read_only
  , [isSubmitted, field.read_only]);

  // Initialize with one empty row if none exist
  React.useEffect(() => {
    if (fields.length === 0) {
      append({})
    }
  }, [fields.length, append])

  const handleAdd = () => {
    append({})
  }

  return (
    <div className="space-y-4 col-span-full">
      <div className="flex items-center justify-between">
        <Label className="text-base font-bold text-foreground">
          {field.label} {!!(field.is_mandatory || field.reqd) && <span className="text-destructive">*</span>}
        </Label>
      </div>

      <div className="space-y-4">
        {fields.map((item, index) => (
          <Card key={item.id} className="relative overflow-hidden border border-border/50 bg-muted/20">
            <CardContent className="pt-6">
              {fields.length > 1 && !isReadOnly && (
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
                {field.child_fields?.map((childField) => (
                  <TableRowField
                    key={childField.fieldname}
                    tableFieldname={field.fieldname}
                    rowIndex={index}
                    childField={childField}
                    control={control}
                    setValue={setValue}
                    error={((errors?.[field.fieldname] as unknown as Record<number, Record<string, { message?: string }>>)?.[index]?.[childField.fieldname])?.message}
                    onAttachChange={onAttachChange}
                    overrides={overrides}
                    tableIsReadOnly={isReadOnly}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isReadOnly && (
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
})
