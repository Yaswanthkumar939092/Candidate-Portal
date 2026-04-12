"use client"

import { useFieldArray, Control, UseFormSetValue, UseFormWatch, FieldValues, FieldErrors } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { OnboardingField } from "@/lib/types/onboarding"
import { DynamicFieldRenderer, type DynamicFieldRendererProps } from "@/components/ui/field-renderer"
import { cn } from "@/lib/utils"

interface DynamicTableFieldProps {
  field: OnboardingField
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  watch: UseFormWatch<FieldValues>
  errors: FieldErrors<FieldValues>
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<OnboardingField>['overrides']
}

export function DynamicTableField({
  field,
  control,
  setValue,
  watch,
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
              {fields.length > 1 && (
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
                  <DynamicFieldRenderer
                    key={childField.fieldname}
                    field={childField}
                    value={watch(`${field.fieldname}.${index}.${childField.fieldname}`)}
                    onChange={(val) => 
                      setValue(`${field.fieldname}.${index}.${childField.fieldname}`, val, { shouldValidate: true })
                    }
                    error={((errors?.[field.fieldname] as unknown as Record<number, Record<string, { message?: string }>>)?.[index]?.[childField.fieldname])?.message}
                    className={cn(
                      "col-span-1",
                      childField.fieldname === "custom_i_am_currently_pursuing_this_course" && "md:col-start-1 md:clear-both"
                    )}
                    onAttachChange={onAttachChange}
                    overrides={overrides}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add {field.label}
      </Button>
    </div>
  )
}
