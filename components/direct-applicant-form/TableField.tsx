"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormAccess } from "@/lib/services/direct-applicant-form";
import type { DirectApplicantField, TableRow } from "@/lib/types/direct-applicant-form";
import { FieldControl } from "./FieldControl";

interface TableFieldProps {
  access: FormAccess;
  field: DirectApplicantField;
  rows: TableRow[];
  /**
   * Receives an updater, not a value: an upload finishing seconds later must
   * apply to the rows as they are then, not as they were when it started.
   */
  onChange: (update: (rows: TableRow[]) => TableRow[]) => void;
  /** "row:column" keys of cells that failed validation. */
  invalidCells?: Set<string>;
  disabled?: boolean;
}

let rowSeq = 0;
const newRowId = () => `row-${++rowSeq}`;

export function TableField({ access, field, rows, onChange, invalidCells, disabled }: TableFieldProps) {
  const columns = field.child || [];
  // A stable id per row (kept apart from the row data, which is submitted):
  // a cell update or a finishing upload finds its row by id, so deleting or
  // adding rows meanwhile cannot send it to the wrong one.
  const ids = React.useRef<string[]>([]);
  while (ids.current.length < rows.length) ids.current.push(newRowId());
  if (ids.current.length > rows.length) ids.current.length = rows.length;

  const setCell = (rowId: string, column: string, value: unknown) =>
    onChange((current) => {
      const at = ids.current.indexOf(rowId);
      return at < 0 ? current : current.map((row, i) => (i === at ? { ...row, [column]: value } : row));
    });
  const addRow = () => {
    ids.current.push(newRowId());
    onChange((current) => [...current, {}]);
  };
  const removeRow = (rowId: string) => {
    const at = ids.current.indexOf(rowId);
    if (at < 0) return;
    ids.current.splice(at, 1);
    onChange((current) => current.filter((_, i) => i !== at));
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-10 px-2 py-2 text-left font-medium text-muted-foreground">#</th>
              {columns.map((c) => (
                <th key={c.fieldname} className="min-w-[160px] px-2 py-2 text-left font-medium text-muted-foreground">
                  {c.label}
                  {!!c.reqd && <span className="text-destructive"> *</span>}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-4 text-center text-muted-foreground">
                  No rows yet
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              const rowId = ids.current[index];
              return (
              <tr key={rowId} className="border-t align-top">
                <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                {columns.map((c) => (
                  <td key={c.fieldname} className="px-2 py-2">
                    <FieldControl
                      access={access}
                      parentFieldname={field.fieldname}
                      field={c}
                      value={row[c.fieldname]}
                      onChange={(v) => setCell(rowId, c.fieldname, v)}
                      invalid={invalidCells?.has(`${index}:${c.fieldname}`)}
                      disabled={disabled}
                      ariaLabel={`${c.label}, row ${index + 1}`}
                    />
                  </td>
                ))}
                <td className="px-2 py-2">
                  {!disabled && (
                    <button type="button" aria-label={`Remove row ${index + 1}`}
                      onClick={() => removeRow(rowId)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" /> Add Row
        </Button>
      )}
    </div>
  );
}
