"use client";

// The form HR sends a direct applicant, opened from the Action Center card.
// On a first fill every field is shown; on a resubmission only the fields HR
// asked the candidate to correct, with HR's note.

import * as React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useDirectApplicantForm, useSubmitDirectApplicantForm } from "@/lib/hooks/useDirectApplicantForm";
import { frappeApiBase } from "@/lib/frappe-base";
import type { FormAccess } from "@/lib/services/direct-applicant-form";
import type { DirectApplicantField, DirectApplicantFormData, TableRow } from "@/lib/types/direct-applicant-form";
import { FieldControl } from "./FieldControl";
import { TableField } from "./TableField";
import { AmountDisplay } from "@/components/ui/amount";
import { isMonetaryField } from "@/lib/utils";

type Values = Record<string, unknown>;

/** Fieldtypes whose value is a file URL, shown as a link in the review view. */
const ATTACH_FIELDTYPES: Record<string, true> = { Attach: true, "Attach Image": true };
const WIDE_FIELDTYPES: Record<string, true> = { "Small Text": true, Text: true, "Long Text": true };

/** Spans both grid columns: HR's Width on the form, else tables and long text. */
export function isFullWidth(field: DirectApplicantField) {
  if (field.fieldtype === "Table") return true;
  if (field.width === "Full" || field.width === "Half") return field.width === "Full";
  return !!WIDE_FIELDTYPES[field.fieldtype];
}

const isBlank = (value: unknown) =>
  value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

export function initialValues(fields: DirectApplicantField[]): Values {
  const values: Values = {};
  fields.forEach((f) => {
    if (f.fieldtype === "Table") {
      const rows = Array.isArray(f.value) ? (f.value as TableRow[]) : [];
      values[f.fieldname] = rows.length ? rows : f.reqd ? [{}] : [];
    } else {
      values[f.fieldname] = f.value ?? (f.fieldtype === "Check" ? 0 : "");
    }
  });
  return values;
}

/** Client-side check of what the server also enforces; returns field / cell errors. */
export function validate(fields: DirectApplicantField[], values: Values) {
  const missing: string[] = [];
  const fieldErrors = new Set<string>();
  const cellErrors: Record<string, Set<string>> = {};
  fields.forEach((f) => {
    const value = values[f.fieldname];
    if (f.fieldtype === "Table") {
      const rows = ((value as TableRow[]) || []).filter((r) => Object.values(r).some((v) => !isBlank(v) && v !== 0));
      if (f.reqd && rows.length === 0) {
        missing.push(f.label);
        fieldErrors.add(f.fieldname);
      }
      ((value as TableRow[]) || []).forEach((row, i) => {
        if (!Object.values(row).some((v) => !isBlank(v) && v !== 0)) return;
        (f.child || []).forEach((c) => {
          if (c.reqd && isBlank(row[c.fieldname])) {
            (cellErrors[f.fieldname] ||= new Set()).add(`${i}:${c.fieldname}`);
            if (!missing.includes(`${f.label}: ${c.label}`)) missing.push(`${f.label}: ${c.label}`);
          }
        });
      });
    } else if (f.reqd && (isBlank(value) || (f.fieldtype === "Check" && !Number(value)))) {
      missing.push(f.label);
      fieldErrors.add(f.fieldname);
    }
  });
  return { missing, fieldErrors, cellErrors };
}

/**
 * ``access.request``: opened from the Action Center (logged in).
 * ``access.token``: opened from the emailed link (no login) — no portal navigation.
 */
export default function DirectApplicantForm({ access }: { access: FormAccess }) {
  const { data, isLoading, error } = useDirectApplicantForm(access);
  // The portal page always passes `request` (even empty); the emailed link passes `token`.
  const inPortal = "request" in access;

  if (!access.request && !access.token) {
    return <Unavailable inPortal={inPortal} message="This form link is incomplete. Please open it from your email or your Action Center." />;
  }
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !data) {
    return <Unavailable inPortal={inPortal} message={error instanceof Error ? error.message : "This form is not available."} />;
  }
  // A submitted form opened from the Action Center shows what was sent, not a
  // dead end — that is the whole point of "View Details" on a completed task.
  // The emailed link has no portal session, so it keeps the thank-you page.
  if (data.review) {
    return inPortal ? <ReviewBody data={data} /> : <Submitted inPortal={inPortal} />;
  }
  if (data.status === "Submitted") return <Submitted inPortal={inPortal} />;
  return <FormBody access={access} data={data} />;
}

function FormBody({ access, data }: { access: FormAccess; data: DirectApplicantFormData }) {
  const fields = React.useMemo(() => data.fields.filter((f) => f.editable), [data.fields]);
  const [values, setValues] = React.useState<Values>(() => initialValues(fields));
  const [errors, setErrors] = React.useState<ReturnType<typeof validate> | null>(null);
  const [done, setDone] = React.useState(false);
  const submit = useSubmitDirectApplicantForm(access);

  // Date of Joining must be a working day. The backend sends which of this
  // form's fields the rule covers (usually none) and the dates they refuse.
  const nonWorkingDays = data.joining_day?.non_working_days ?? [];
  const joiningDayFields = React.useMemo(() => {
    const covered: Record<string, true> = {};
    (data.joining_day?.fieldnames ?? []).forEach((fieldname) => {
      covered[fieldname] = true;
    });
    return covered;
  }, [data.joining_day]);

  const sections = React.useMemo(() => {
    const out: { title: string; fields: DirectApplicantField[] }[] = [];
    fields.forEach((f) => {
      let s = out.find((x) => x.title === f.section);
      if (!s) out.push((s = { title: f.section, fields: [] }));
      s.fields.push(f);
    });
    return out;
  }, [fields]);

  const set = (fieldname: string) => (value: unknown) => setValues((v) => ({ ...v, [fieldname]: value }));
  // Tables get an updater (see TableField), applied to the latest rows.
  const setRows = (fieldname: string) => (update: (rows: TableRow[]) => TableRow[]) =>
    setValues((v) => ({ ...v, [fieldname]: update((v[fieldname] as TableRow[]) || []) }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(fields, values);
    setErrors(result);
    if (result.missing.length) {
      toast.error(`Please fill: ${result.missing.join(", ")}`);
      return;
    }
    try {
      await submit.mutateAsync(values);
      toast.success("Your details have been submitted.");
      setDone(true);
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    }
  };

  if (done) return <Submitted inPortal={!!access.request} />;

  const resubmission = data.status === "Resubmission Requested";
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{data.form_title}</h1>
        <p className="text-sm text-muted-foreground">
          {data.applicant_name}
          {data.company ? ` · ${data.company}` : ""}
        </p>
      </div>
      {resubmission && (
        <div className="rounded-lg border border-warning/30 bg-warning-bg p-4 text-sm text-foreground">
          <p className="font-medium">Please correct the details below.</p>
          {data.resubmit_note && <p className="mt-1 whitespace-pre-wrap">{data.resubmit_note}</p>}
        </div>
      )}
      {data.instructions && !resubmission && (
        <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-muted-foreground">{data.instructions}</div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((f) => {
                const id = `daf-${f.fieldname}`;
                const invalid = errors?.fieldErrors.has(f.fieldname);
                return (
                  <div key={f.fieldname} className={isFullWidth(f) ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                    <Label htmlFor={id} className="text-sm font-medium text-foreground">
                      {f.label}
                      {!!f.reqd && <span className="text-destructive"> *</span>}
                    </Label>
                    {f.fieldtype === "Table" ? (
                      <TableField
                        access={access}
                        field={f}
                        rows={(values[f.fieldname] as TableRow[]) || []}
                        onChange={setRows(f.fieldname)}
                        invalidCells={errors?.cellErrors[f.fieldname]}
                      />
                    ) : (
                      <FieldControl
                        id={id}
                        access={access}
                        field={f}
                        value={values[f.fieldname]}
                        onChange={set(f.fieldname)}
                        invalid={invalid}
                        nonWorkingDays={joiningDayFields[f.fieldname] ? nonWorkingDays : undefined}
                        onNonWorkingDay={() =>
                          toast.error(`${f.label} must be a working day — holidays and weekly offs cannot be selected.`)
                        }
                      />
                    )}
                    {joiningDayFields[f.fieldname] && (
                      <p className="text-xs text-muted-foreground">Must be a working day.</p>
                    )}
                    {f.fieldname === "custom_da_aadhaar_masked" && (
                      <p className="text-xs text-muted-foreground">Only the last 4 digits are stored.</p>
                    )}
                    {invalid && <p className="text-xs text-destructive">This field is required.</p>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * The read-only look back at a form the candidate has already submitted,
 * reached from a completed Action Center card. Shows every field the form asked
 * for with the value on file, grouped exactly as the fill view groups them, so
 * what they see here matches what they filled in.
 */
function ReviewBody({ data }: { data: DirectApplicantFormData }) {
  const sections = React.useMemo(() => {
    const out: { title: string; fields: DirectApplicantField[] }[] = [];
    data.fields.forEach((f) => {
      let s = out.find((x) => x.title === f.section);
      if (!s) out.push((s = { title: f.section, fields: [] }));
      s.fields.push(f);
    });
    return out;
  }, [data.fields]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{data.form_title}</h1>
        <p className="text-sm text-muted-foreground">
          {data.applicant_name}
          {data.company ? ` · ${data.company}` : ""}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-bg p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div className="text-sm">
          <p className="font-medium text-foreground">You have already submitted this form.</p>
          <p className="text-muted-foreground">
            {data.submitted_on
              ? `Submitted on ${formatSubmittedOn(data.submitted_on)}. This is a copy of what you sent — it cannot be changed.`
              : "This is a copy of what you sent — it cannot be changed."}
          </p>
        </div>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => (
              <div
                key={f.fieldname}
                className={isFullWidth(f) ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}
              >
                <p className="text-sm font-medium text-muted-foreground">{f.label}</p>
                {f.fieldtype === "Table" ? (
                  <ReviewTable field={f} />
                ) : ATTACH_FIELDTYPES[f.fieldtype] && typeof f.value === "string" && f.value ? (
                  <a
                    href={`${frappeApiBase()}${f.value}`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm text-primary underline underline-offset-2"
                  >
                    {f.value.split("/").pop() || "View file"}
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                    {isMonetaryField(f) && f.value ? <AmountDisplay value={f.value as string | number} /> : displayValue(f)}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/action-center">Back to Action Center</Link>
        </Button>
      </div>
    </div>
  );
}

function ReviewTable({ field }: { field: DirectApplicantField }) {
  const rows = Array.isArray(field.value) ? (field.value as TableRow[]) : [];
  const columns = field.child || [];
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">Not provided</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.fieldname} className="px-3 py-2 text-left font-medium text-muted-foreground">
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
                  {isMonetaryField(c) && row[c.fieldname] ? <AmountDisplay value={row[c.fieldname] as string | number} /> : formatCell(row[c.fieldname])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A submitted scalar as text. Attachments stay links so the file is reachable. */
function displayValue(field: DirectApplicantField) {
  const value = field.value;
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  if (field.fieldtype === "Check") {
    return Number(value) ? "Yes" : "No";
  }
  return String(value);
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatSubmittedOn(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function Submitted({ inPortal }: { inPortal: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <CheckCircle2 className="mb-4 h-12 w-12 text-success" />
      <h1 className="text-2xl font-bold text-foreground">Thank you</h1>
      <p className="mt-2 text-muted-foreground">Your details have been submitted. HR will get in touch with you.</p>
      {inPortal && (
        <Button asChild className="mt-6">
          <Link href="/action-center">Back to Action Center</Link>
        </Button>
      )}
    </div>
  );
}

function Unavailable({ message, inPortal }: { message: string; inPortal: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold text-foreground">Form unavailable</h1>
      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{message}</p>
      {inPortal && (
        <Button asChild variant="outline" className="mt-6">
          <Link href="/action-center">Back to Action Center</Link>
        </Button>
      )}
    </div>
  );
}
