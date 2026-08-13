"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DynamicFieldRenderer } from "@/components/ui/field-renderer";
import { FileUploadField } from "@/components/onboarding/file-upload-field";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: number | boolean;
  read_only?: number | boolean;
  hidden?: number | boolean;
  exclude_values?: string[];
}

interface TableFieldDef {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  child_doctype?: string;
  child_fields?: ChildField[];
  reqd?: number | boolean;
  read_only?: number | boolean;
  stage_requirement?: {
    fieldname: string;
    doctype: string;
    required_stages: string[];
  };
}

interface JobApplicationTableFieldProps {
  field: TableFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  onAttachChange?: (fieldname: string) => (url: string | null) => void;
  className?: string;
}

type OverrideComponentProps = {
  field: ChildField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function JobApplicationTableField({
  field,
  value,
  onChange,
  onAttachChange,
  className,
}: JobApplicationTableFieldProps) {
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

  // Use child_fields from API response if available,
  // otherwise fetch from Frappe meta endpoint as fallback
  const [columns, setColumns] = useState<ChildField[]>(
    field.child_fields && field.child_fields.length > 0
      ? field.child_fields.filter(
          (f) =>
            !f.hidden &&
            !["Section Break", "Column Break"].includes(f.fieldtype)
        )
      : []
  );

  useEffect(() => {
    // Only fetch if no child_fields were provided and we have a doctype
    if (
      (!field.child_fields || field.child_fields.length === 0) &&
      field.options
    ) {
      fetch(
        `/api/method/frappe.client.get_meta?doctype=${encodeURIComponent(
          field.options
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          const fields: ChildField[] = data?.message?.fields || [];
          const filtered = fields.filter(
            (f) =>
              !f.hidden &&
              !["Section Break", "Column Break"].includes(f.fieldtype)
          );
          setColumns(filtered);
        })
        .catch((err) => {
          console.error("Table meta fetch error:", err);
        });
    }
  }, [field.options, field.child_fields]);

  // ── Row helpers ─────────────────────────────────────────────────────────

  const handleAddRow = () => {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      newRow[col.fieldname] = col.fieldtype === "Check" ? 0 : "";
    });
    onChange([...rows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const handleCellChange = (
    rowIndex: number,
    fieldname: string,
    val: unknown
  ) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], [fieldname]: val };
    onChange(updated);
  };

  // ── Field overrides for cells ────────────────────────────────────────────

  const buildCellOverrides = (rowIndex: number) => ({
    Attach: {
      component: ({
        field: cellField,
        value: cellValue,
        error,
        disabled,
        className: cellClassName,
      }: OverrideComponentProps) => (
        <FileUploadField
          label={cellField.label}
          required={!!(cellField.reqd)}
          value={cellValue as string}
          onChange={(url) => handleCellChange(rowIndex, cellField.fieldname, url ?? "")}
          disabled={disabled || !!cellField.read_only}
          error={error}
          className={cellClassName}
        />
      ),
    },
    "Attach Image": {
      component: ({
        field: cellField,
        value: cellValue,
        error,
        disabled,
        className: cellClassName,
      }: OverrideComponentProps) => (
        <FileUploadField
          label={cellField.label}
          required={!!(cellField.reqd)}
          value={cellValue as string}
          onChange={(url) => handleCellChange(rowIndex, cellField.fieldname, url ?? "")}
          disabled={disabled || !!cellField.read_only}
          error={error}
          className={cellClassName}
        />
      ),
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────

  if (columns.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium text-foreground">
        {field.label}
        {field.reqd && <span className="text-destructive"> *</span>}
      </Label>

      {/* Rows */}
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="relative rounded-lg border border-border bg-card p-4"
        >
          {/* Row number badge */}
          <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            #{rowIndex + 1}
          </span>

          <div className="grid grid-cols-1 gap-x-4 gap-y-4 pt-1 md:grid-cols-2">
            {columns.map((col) => {
              if (col.hidden) return null;

              // Filter out stages already used in other rows
              let renderedCol = col;
              if (
                field.stage_requirement &&
                col.fieldname === field.stage_requirement.fieldname
              ) {
                const usedStages = rows
                  .filter((_, i) => i !== rowIndex)
                  .map((r) => r[col.fieldname])
                  .filter(Boolean) as string[];

                if (col.fieldtype === "Link") {
                  // For Link fields, pass used stages as exclude_values
                  renderedCol = {
                    ...col,
                    exclude_values: usedStages,
                  };
                } else if (col.fieldtype === "Select" && col.options) {
                  const allOptions = typeof col.options === 'string' ? col.options.split('\n') : [];
                  const filteredOptions = allOptions.filter(
                    (opt: string) => !usedStages.includes(opt) || opt === row[col.fieldname]
                  );
                  renderedCol = {
                    ...col,
                    options: filteredOptions.join('\n'),
                  };
                }
              }

              let cellError: string | undefined = undefined;

              const stageFieldName = field.stage_requirement?.fieldname || "qualification";

              if (col.fieldname === "year_of_passing" && columns.some(c => c.fieldname === stageFieldName)) {
                const EDUCATION_LEVEL_ORDER: Record<string, number> = {
                  "10th": 1,
                  "12th": 2,
                  "Graduation": 3,
                  "Post Graduation": 4,
                };
                const currentLevel = String(row?.[stageFieldName] || "").trim();
                const currentYearStr = String(row?.year_of_passing || "").trim();
                const currentRank = EDUCATION_LEVEL_ORDER[currentLevel];
                const currentYear = parseInt(currentYearStr, 10);

                if (currentRank && !isNaN(currentYear)) {
                  let maxLowerYear = 0;
                  let maxLowerLevel = "";
                  rows.forEach((otherRow: any, otherIndex: number) => {
                    if (otherIndex === rowIndex) return;
                    const otherLevel = String(otherRow?.[stageFieldName] || "").trim();
                    const otherYearStr = String(otherRow?.year_of_passing || "").trim();
                    const otherRank = EDUCATION_LEVEL_ORDER[otherLevel];
                    const otherYear = parseInt(otherYearStr, 10);

                    if (otherRank && otherRank < currentRank && !isNaN(otherYear)) {
                      if (otherYear > maxLowerYear) {
                        maxLowerYear = otherYear;
                        maxLowerLevel = otherLevel;
                      }
                    }
                  });
                  if (maxLowerYear > 0 && currentYear <= maxLowerYear) {
                    cellError = `Year must be after ${maxLowerLevel} (${maxLowerYear})`;
                  }
                }
              }

              return (
                <DynamicFieldRenderer
                  key={col.fieldname}
                  field={renderedCol}
                  value={row[col.fieldname]}
                  onChange={(val) =>
                    handleCellChange(rowIndex, col.fieldname, val)
                  }
                  error={cellError}
                  disabled={!!col.read_only}
                  onAttachChange={
                    onAttachChange
                      ? (fn: string) =>
                          (url: string | null) =>
                            handleCellChange(rowIndex, fn, url ?? "")
                      : undefined
                  }
                  overrides={buildCellOverrides(rowIndex)}
                />
              );
            })}
          </div>

          {/* Remove row */}
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleRemoveRow(rowIndex)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ))}

      {/* Add row */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        className="w-full border-dashed"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add {field.label}
      </Button>
    </div>
  );
}