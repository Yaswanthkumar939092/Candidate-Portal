"use client";

// One input for a Direct Applicant Form field or table column, chosen by
// fieldtype. Link search and file uploads go through the form's own
// request-scoped endpoints (never the generic ones), so a candidate can only
// search / upload what their form offers.

import * as React from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { directApplicantFormService, type FormAccess } from "@/lib/services/direct-applicant-form";
import type { LinkOption } from "@/lib/types/direct-applicant-form";
import { cn } from "@/lib/utils";

export interface ControlField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
}

export interface FieldControlProps {
  access: FormAccess;
  field: ControlField;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Set for a table column: the table's fieldname. */
  parentFieldname?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  /** Accessible name when there is no visible <label> (table cells). */
  ariaLabel?: string;
}

const NUMERIC = new Set(["Int", "Float", "Currency", "Percent"]);
const TEXTAREA = new Set(["Small Text", "Text", "Long Text"]);
const ATTACH = new Set(["Attach", "Attach Image"]);
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.doc,.docx";
const AADHAAR_FIELD = "custom_da_aadhaar_masked";

export function FieldControl(props: FieldControlProps) {
  const { field, value, onChange, disabled, invalid, id, ariaLabel } = props;
  const text = value === null || value === undefined ? "" : String(value);
  const invalidClass = invalid ? "border-destructive focus-visible:ring-destructive/30" : "";

  if (field.fieldtype === "Select") {
    const choices = (field.options || "").split("\n").map((o) => o.trim()).filter(Boolean);
    return (
      // Always controlled ("" shows the placeholder), so Radix never switches modes.
      <Select value={text} onValueChange={(v) => onChange(v)} disabled={disabled}>
        <SelectTrigger id={id} aria-label={ariaLabel} className={cn("w-full", invalidClass)}>
          <SelectValue placeholder={`Select ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.fieldtype === "Check") {
    return (
      <Checkbox
        id={id}
        aria-label={ariaLabel}
        checked={!!Number(value)}
        onCheckedChange={(checked) => onChange(checked ? 1 : 0)}
        disabled={disabled}
      />
    );
  }
  if (field.fieldtype === "Link") return <LinkControl {...props} />;
  if (ATTACH.has(field.fieldtype)) return <AttachControl {...props} />;
  if (TEXTAREA.has(field.fieldtype)) {
    return (
      <Textarea id={id} aria-label={ariaLabel} rows={3} value={text} onChange={(e) => onChange(e.target.value)}
        disabled={disabled} className={invalidClass} />
    );
  }
  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      type={field.fieldtype === "Date" ? "date" : NUMERIC.has(field.fieldtype) ? "number" : field.fieldtype === "Phone" ? "tel" : "text"}
      step={NUMERIC.has(field.fieldtype) ? "any" : undefined}
      inputMode={field.fieldname === AADHAAR_FIELD ? "numeric" : undefined}
      placeholder={field.fieldname === AADHAAR_FIELD ? "12-digit Aadhaar number" : undefined}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={invalidClass}
    />
  );
}

function LinkControl({ access, field, value, onChange, parentFieldname, disabled, ariaLabel }: FieldControlProps) {
  // No search until the candidate reaches for this control: a table with R rows
  // and L Link columns would otherwise fire R x L searches on page load.
  const [active, setActive] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const debounced = useDebounce(search, 300);
  const [options, setOptions] = React.useState<LinkOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const current = value ? String(value) : "";

  React.useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoading(true);
    const [fieldname, child] = parentFieldname ? [parentFieldname, field.fieldname] : [field.fieldname, undefined];
    directApplicantFormService
      .searchLink(access, fieldname, debounced, child)
      .then((rows) => alive && setOptions(rows || []))
      .catch(() => alive && setOptions([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, access.token, access.request, field.fieldname, parentFieldname, debounced]);

  const merged = React.useMemo(() => {
    const list = options.map((o) => ({ value: o.value, label: o.label }));
    if (current && !list.some((o) => o.value === current)) list.unshift({ value: current, label: current });
    return list;
  }, [options, current]);

  return (
    <div
      className="w-full"
      aria-label={ariaLabel}
      onPointerDownCapture={() => setActive(true)}
      onFocusCapture={() => setActive(true)}
    >
    <Combobox
      options={merged}
      value={current}
      onValueChange={(v) => onChange(v)}
      placeholder={`Select ${field.label}`}
      searchValue={search}
      onSearchValueChange={setSearch}
      loading={loading}
      disabled={disabled}
    />
    </div>
  );
}

function AttachControl({ access, field, value, onChange, parentFieldname, disabled, invalid, id, ariaLabel }: FieldControlProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const url = value ? String(value) : "";
  const name = url ? decodeURIComponent(url.split("/").pop() || url) : "";

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5 MB");
      return;
    }
    setUploading(true);
    try {
      const [fieldname, child] = parentFieldname ? [parentFieldname, field.fieldname] : [field.fieldname, undefined];
      const res = await directApplicantFormService.uploadFile(access, fieldname, file, child);
      onChange(res.file_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1">
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {url ? (
        <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", invalid && "border-destructive")}>
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {!disabled && (
            <button type="button" aria-label="Remove file" onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <Button id={id} aria-label={ariaLabel} type="button" variant="outline" size="sm" disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()} className={cn(invalid && "border-destructive")}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload file"}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!url && !error && <p className="text-xs text-muted-foreground">PDF, image or Word, up to 5 MB</p>}
    </div>
  );
}
