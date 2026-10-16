// Direct Applicant Form — the form HR sends a direct applicant (no Job Opening).
// Shapes mirror recruitment.api.direct_applicant_portal (Frappe backend).

export interface DirectApplicantChildField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd: number;
}

export interface DirectApplicantField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd: number;
  section: string;
  value: unknown;
  /** False for fields HR did not reopen on a resubmission. */
  editable: boolean;
  /** Table fields only: the columns the candidate fills. */
  child?: DirectApplicantChildField[];
}

export type DirectApplicantFormStatus =
  | "Sent"
  | "Submitted"
  | "Resubmission Requested"
  | "Revoked";

/**
 * Date of Joining must be a working day. `fieldnames` lists the form's Date
 * fields the rule covers (empty when the form has none) and `non_working_days`
 * the YYYY-MM-DD dates they must refuse — holidays and weekly offs from the
 * Holiday List the backend itself validates against.
 */
export interface JoiningDayRule {
  fieldnames: string[];
  non_working_days: string[];
}

export interface DirectApplicantFormData {
  applicant_name: string;
  company: string;
  form_title: string;
  instructions: string;
  status: DirectApplicantFormStatus;
  expires_on: string | null;
  resubmit_note: string;
  fields: DirectApplicantField[];
  joining_day?: JoiningDayRule;
  /** True when this is a read-only look back at an already-submitted form. */
  review?: boolean;
  submitted_on?: string | null;
}

export interface LinkOption {
  value: string;
  label: string;
}

export type TableRow = Record<string, unknown>;
