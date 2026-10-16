"use client";

// The read-only look back at a form the candidate has already submitted.
//
// The Action Center keeps a card after its action is completed, so "View
// Details" on it has to show what was sent rather than telling the candidate
// they already acted. Shared by the pre-offer and onboarding forms: both are the
// same shape (tabs -> sections -> fields, each carrying its submitted value), so
// one component keeps the two looking alike and saves duplicating the value
// formatting.

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { frappeApiBase } from "@/lib/frappe-base";

/** Fieldtypes whose value is a file URL, shown as a link rather than as text. */
const ATTACH_FIELDTYPES: Record<string, true> = { Attach: true, "Attach Image": true };

/** Fieldtypes that carry no value of their own and are skipped. */
const LAYOUT_FIELDTYPES: Record<string, true> = {
  "Section Break": true,
  "Column Break": true,
  "Tab Break": true,
  HTML: true,
  Button: true,
  Heading: true,
};

/** Fieldtypes holding child rows, laid out as a table across the full width. */
const TABLE_FIELDTYPES: Record<string, true> = { Table: true, "Table MultiSelect": true };

export interface ReviewField {
  fieldname: string;
  label: string;
  fieldtype: string;
  hidden?: number;
  options?: string;
  child_fields?: ReviewField[];
  table_fields?: ReviewField[];
  value?: unknown;
}

export interface ReviewSection {
  section: string;
  fields: ReviewField[];
}

export interface ReviewTab {
  tab: string;
  sections: ReviewSection[];
}

export interface SubmittedFormReviewProps {
  title: string;
  /** Shown under the title, e.g. the candidate's name and company. */
  subtitle?: string;
  tabs: ReviewTab[];
  /** When the form was submitted; omitted when unknown. */
  submittedAt?: string | null;
  /** Overrides the default "You have already submitted this form." line. */
  headline?: string;
  backHref?: string;
  backLabel?: string;
}

export function SubmittedFormReview({
  title,
  subtitle,
  tabs,
  submittedAt,
  headline = "You have already submitted this form.",
  backHref = "/action-center",
  backLabel = "Back to Action Center",
}: SubmittedFormReviewProps) {
  const submittedOn = formatSubmittedOn(submittedAt);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-bg p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div className="text-sm">
          <p className="font-medium text-foreground">{headline}</p>
          <p className="text-muted-foreground">
            {submittedOn
              ? `Submitted on ${submittedOn}. This is a copy of what you sent — it cannot be changed.`
              : "This is a copy of what you sent — it cannot be changed."}
          </p>
        </div>
      </div>

      {tabs.map((tab) => (
        <div key={tab.tab} className="space-y-4">
          {tabs.length > 1 && (
            <h2 className="text-base font-semibold text-foreground">{tab.tab}</h2>
          )}
          {tab.sections.map((section) => {
            const fields = section.fields.filter(
              (f) => !LAYOUT_FIELDTYPES[f.fieldtype] && !f.hidden,
            );
            if (fields.length === 0) return null;
            return (
              <Card key={`${tab.tab}-${section.section}`}>
                <CardHeader>
                  <CardTitle className="text-base">{section.section || tab.tab}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div
                      key={field.fieldname}
                      className={
                        TABLE_FIELDTYPES[field.fieldtype]
                          ? "space-y-1.5 sm:col-span-2"
                          : "space-y-1.5"
                      }
                    >
                      <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                      <FieldValue field={field} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

function FieldValue({ field }: { field: ReviewField }) {
  if (TABLE_FIELDTYPES[field.fieldtype]) return <TableValue field={field} />;

  const value = field.value;
  if (ATTACH_FIELDTYPES[field.fieldtype] && typeof value === "string" && value) {
    return (
      <a
        href={`${frappeApiBase()}${value}`}
        target="_blank"
        rel="noreferrer"
        className="break-all text-sm text-primary underline underline-offset-2"
      >
        {value.split("/").pop() || "View file"}
      </a>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
      {scalarText(field)}
    </p>
  );
}

function TableValue({ field }: { field: ReviewField }) {
  const rows = Array.isArray(field.value) ? (field.value as Record<string, unknown>[]) : [];
  const columns = (field.child_fields || field.table_fields || []).filter(
    (c) => !LAYOUT_FIELDTYPES[c.fieldtype] && !c.hidden,
  );
  if (rows.length === 0 || columns.length === 0) {
    return <p className="text-sm text-muted-foreground">Not provided</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((c) => (
              <th
                key={c.fieldname}
                className="px-3 py-2 text-left font-medium text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {columns.map((c) => (
                <td key={c.fieldname} className="px-3 py-2 text-foreground">
                  {cellText(row[c.fieldname])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A submitted scalar as display text: a Check reads Yes/No, a blank reads "Not provided". */
function scalarText(field: ReviewField) {
  const value = field.value;
  if (value === null || value === undefined || value === "") return "Not provided";
  if (field.fieldtype === "Check") return Number(value) ? "Yes" : "No";
  return String(value);
}

/** A child-row cell; a blank reads as a dash so the table keeps its grid. */
function cellText(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** "2026-10-19 11:30:00" -> local date and time; the raw value when unparseable. */
function formatSubmittedOn(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}
