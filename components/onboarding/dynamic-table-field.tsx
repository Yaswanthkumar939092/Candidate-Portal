"use client"

import React from "react"
import { useFieldArray, Control, UseFormSetValue, UseFormTrigger, FieldValues, FieldErrors, Controller, useWatch, useFormState } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { OnboardingField } from "@/lib/types/onboarding"
import { DynamicFieldRenderer, type DynamicFieldRendererProps } from "@/components/ui/field-renderer"
import { cn } from "@/lib/utils"
import { evaluateDependsOn } from "@/lib/onboarding-utils"

const EDUCATION_DETAILS_FIELDNAME = "custom_education_details"
const EDUCATION_LEVEL_FIELDNAME = "education_level"
const POST_GRADUATION_FIELDNAME = "custom_has_post_graduation_degree"
const EDUCATION_LEVELS = ["10th", "12th", "Graduation", "Post Graduation"] as const

const FAMILY_DETAILS_FIELDNAME = "custom_family_details"
const RELATION_FIELDNAME = "relation"

function isYes(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "yes"
}

function parseTableOptions(options?: string) {
  if (!options) return []
  return options
    .split(/\n|\s{2,}/)
    .flatMap((option) => option.split("\n"))
    .map((option) => option.trim())
    .filter(Boolean)
}

function getApplicableEducationLevels(document: Record<string, unknown>): string[] {
  return isYes(document[POST_GRADUATION_FIELDNAME])
    ? [...EDUCATION_LEVELS]
    : [...EDUCATION_LEVELS.slice(0, 3)]
}

interface DynamicTableFieldProps {
  field: OnboardingField
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  trigger?: UseFormTrigger<FieldValues>
  errors: FieldErrors<FieldValues>
  document?: Record<string, unknown>
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<OnboardingField>['overrides']
}

interface TableRowFieldProps {
  tableFieldname: string
  rowIndex: number
  childField: OnboardingField
  document?: Record<string, unknown>
  control: Control<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  trigger?: UseFormTrigger<FieldValues>
  error?: string
  onAttachChange?: (fieldname: string) => (url: string | null) => void
  overrides?: DynamicFieldRendererProps<OnboardingField>['overrides']
}

const TableRowField = React.memo(function TableRowField({
  tableFieldname,
  rowIndex,
  childField,
  document,
  control,
  trigger,
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
            if (error) {
              void trigger?.(fieldPath);
            }
          }}
          onBlur={rhfField.onBlur}
          error={error}
          className={cn(
            "col-span-1",
            childField.fieldname === "custom_i_am_currently_pursuing_this_course" && "md:col-start-1 md:clear-both"
          )}
          onAttachChange={onAttachChange}
          overrides={overrides}
          tableFieldname={tableFieldname}
          rowIndex={rowIndex}
          document={document}
        />
      )}
    />
  )
})

export function DynamicTableField({
  field,
  control,
  setValue,
  trigger,
  errors,
  document = {},
  onAttachChange,
  overrides,
}: DynamicTableFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: field.fieldname,
  })
  const { touchedFields, submitCount } = useFormState({
    control,
  })
  const addedRowSubmitCounts = React.useRef<Record<number, number>>({})

  const initialized = React.useRef(false)

  // Initialize with one empty row if none exist.
  React.useEffect(() => {
    if (fields.length === 0 && !initialized.current) {
      initialized.current = true
      append({})
    }
  }, [append, fields.length])

  const handleAdd = () => {
    addedRowSubmitCounts.current[fields.length] = submitCount
    append({})
  }

  const handleRemove = (index: number) => {
    const nextAddedRows: Record<number, number> = {}
    Object.entries(addedRowSubmitCounts.current).forEach(([rowIndex, rowSubmitCount]) => {
      const numericIndex = Number(rowIndex)
      if (numericIndex < index) {
        nextAddedRows[numericIndex] = rowSubmitCount
      } else if (numericIndex > index) {
        nextAddedRows[numericIndex - 1] = rowSubmitCount
      }
    })
    addedRowSubmitCounts.current = nextAddedRows
    remove(index)
  }

  const tableErrors = errors[field.fieldname] as
    | (Record<number, Record<string, { message?: string }>> & {
        type?: string
        message?: string
        root?: { message?: string }
      })
    | undefined
  const tableErrorMessage = tableErrors?.root?.message || tableErrors?.message
  const latestAddedRowSubmitCount = Math.max(
    -1,
    ...Object.values(addedRowSubmitCounts.current)
  )
  const shouldShowTableError =
    tableErrors?.type !== "required" || (submitCount > 0 && submitCount > latestAddedRowSubmitCount)
  const isTableRequired = Boolean(
    field.is_mandatory ||
      field.reqd ||
      (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, document))
  )

  const watchedRowValues = useWatch({
    control,
    name: field.fieldname,
  })
  const rowValues = React.useMemo(
    () => (Array.isArray(watchedRowValues) ? watchedRowValues : []),
    [watchedRowValues],
  )
  const isEducationDetailsTable = field.fieldname === EDUCATION_DETAILS_FIELDNAME
  const selectedEducationLevels = React.useMemo(() => {
    if (!isEducationDetailsTable) return new Set<string>()

    return new Set(
      rowValues
        .map((row: any) => String(row?.[EDUCATION_LEVEL_FIELDNAME] || "").trim())
        .filter(Boolean),
    )
  }, [isEducationDetailsTable, rowValues])
  const requiredEducationLevels = React.useMemo(
    () => getApplicableEducationLevels(document),
    [document],
  )
  const hasAllApplicableEducationLevels = React.useMemo(() => {
    if (!isEducationDetailsTable) return false

    return requiredEducationLevels.every((level) => selectedEducationLevels.has(level))
  }, [isEducationDetailsTable, requiredEducationLevels, selectedEducationLevels])

  const isFamilyDetailsTable = field.fieldname === FAMILY_DETAILS_FIELDNAME
  const selectedRelations = React.useMemo(() => {
    if (!isFamilyDetailsTable) return new Set<string>()

    return new Set(
      rowValues
        .map((row: any) => String(row?.[RELATION_FIELDNAME] || "").trim())
        .filter(Boolean),
    )
  }, [isFamilyDetailsTable, rowValues])

  const hasAllAvailableRelations = React.useMemo(() => {
    if (!isFamilyDetailsTable) return false
    const relationField = field.child_fields?.find(f => f.fieldname === RELATION_FIELDNAME)
    const allOptions = parseTableOptions(relationField?.options)
    if (!allOptions.length) return false
    
    // Check if every available option has been selected
    // Note: since we allow multiple "Child" selections, we shouldn't hide the add button 
    // if "Child" is an option, unless we really want to limit it to exactly one of each.
    // Based on requirements, "Child" can be multiple, so we'll never hide the button if "Child" is present.
    if (allOptions.includes("Child")) return false;
    
    return allOptions.every((opt) => selectedRelations.has(opt))
  }, [isFamilyDetailsTable, field.child_fields, selectedRelations])

  const canAddMoreRows = React.useMemo(() => {
    if (isEducationDetailsTable) {
      return !hasAllApplicableEducationLevels;
    }
    if (isFamilyDetailsTable) {
      return !hasAllAvailableRelations;
    }
    return true;
  }, [isEducationDetailsTable, hasAllApplicableEducationLevels, isFamilyDetailsTable, hasAllAvailableRelations]);

  // Automatically clear child fields when they become hidden or violate year sequence
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
                shouldValidate: false,
                shouldDirty: true,
              });
            }
          }
        }
      });
    });

    if (field.fieldname === EDUCATION_DETAILS_FIELDNAME && rowValues.length > 0) {
      const EDUCATION_LEVEL_ORDER: Record<string, number> = {
        "10th": 1,
        "12th": 2,
        "Graduation": 3,
        "Post Graduation": 4,
      };

      rowValues.forEach((currentRow: any, currentIndex: number) => {
        const currentLevel = String(currentRow?.education_level || "").trim();
        const currentYearStr = String(currentRow?.year_of_passing || "").trim();
        const currentRank = EDUCATION_LEVEL_ORDER[currentLevel];
        const currentYear = parseInt(currentYearStr, 10);

        if (currentRank && !isNaN(currentYear)) {
          let maxLowerYear = 0;
          rowValues.forEach((otherRow: any, otherIndex: number) => {
            if (otherIndex === currentIndex) return;
            const otherLevel = String(otherRow?.education_level || "").trim();
            const otherYearStr = String(otherRow?.year_of_passing || "").trim();
            const otherRank = EDUCATION_LEVEL_ORDER[otherLevel];
            const otherYear = parseInt(otherYearStr, 10);

            if (otherRank && otherRank < currentRank && !isNaN(otherYear)) {
              if (otherYear > maxLowerYear) {
                maxLowerYear = otherYear;
              }
            }
          });

          if (maxLowerYear > 0 && currentYear <= maxLowerYear) {
            const path = `${field.fieldname}.${currentIndex}.year_of_passing`;
            setValue(path, "", {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      });
    }
  }, [rowValues, fields, field.child_fields, field.fieldname, setValue]);

  return (
    <div id={`field-${field.fieldname}`} className="space-y-4 col-span-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Label className="text-base font-bold text-foreground">
            {field.label} {isTableRequired && <span className="text-destructive">*</span>}
          </Label>
        </div>
        {tableErrorMessage && shouldShowTableError && (
          <p className="text-sm text-destructive font-medium">
            {tableErrorMessage}
          </p>
        )}
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
                    onClick={() => handleRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 lg:grid-cols-2">
                  {field.child_fields?.map((childField) => {
                    const isVisible = !childField.hidden && (!childField.depends_on || evaluateDependsOn(childField.depends_on, rowDoc));
                    if (!isVisible) return null;
                    const childError = tableErrors?.[index]?.[childField.fieldname]?.message;
                    const touchedTable = touchedFields[field.fieldname] as
                      | Array<Record<string, unknown>>
                      | undefined;
                    const wasTouched = Boolean(touchedTable?.[index]?.[childField.fieldname]);
                    const addedAtSubmitCount = addedRowSubmitCounts.current[index] ?? -1;
                    const shouldShowChildError =
                      Boolean(childError) && (wasTouched || (submitCount > 0 && submitCount > addedAtSubmitCount));
                    let fieldForRow = childField;

                    if (
                      isEducationDetailsTable &&
                      childField.fieldname === EDUCATION_LEVEL_FIELDNAME
                    ) {
                      const currentLevel = String(rowDoc?.[EDUCATION_LEVEL_FIELDNAME] || "").trim();
                      const optionSource = parseTableOptions(childField.options);
                      const applicableLevels = getApplicableEducationLevels(document);
                      const availableOptions = (optionSource.length ? optionSource : [...EDUCATION_LEVELS])
                        .filter((option) => applicableLevels.includes(option))
                        .filter((option) => option === currentLevel || !selectedEducationLevels.has(option));

                      fieldForRow = {
                        ...childField,
                        options: availableOptions.join("\n"),
                      };
                    }

                    if (
                      isFamilyDetailsTable &&
                      childField.fieldname === RELATION_FIELDNAME
                    ) {
                      const currentRelation = String(rowDoc?.[RELATION_FIELDNAME] || "").trim();
                      const optionSource = parseTableOptions(childField.options);
                      
                      // Filter out relations that are already selected, unless it's the one currently selected in this row
                      // Exclude "Child" from being filtered out in case they have multiple children
                      const availableOptions = optionSource.filter(
                        (option) => option === "Child" || option === currentRelation || !selectedRelations.has(option)
                      );

                      fieldForRow = {
                        ...childField,
                        options: availableOptions.join("\n"),
                      };
                    }

                    return (
                      <TableRowField
                        key={childField.fieldname}
                        tableFieldname={field.fieldname}
                        rowIndex={index}
                        childField={{
                          ...fieldForRow,
                          read_only: field.read_only ? 1 : fieldForRow.read_only,
                        }}
                        document={rowDoc}
                        control={control}
                        setValue={setValue}
                        trigger={trigger}
                        error={shouldShowChildError ? childError : undefined}
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

      {!field.read_only && canAddMoreRows && (
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
