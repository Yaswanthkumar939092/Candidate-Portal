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

export interface DirectApplicantFormData {
  applicant_name: string;
  company: string;
  form_title: string;
  instructions: string;
  status: DirectApplicantFormStatus;
  expires_on: string | null;
  resubmit_note: string;
  fields: DirectApplicantField[];
}

export interface LinkOption {
  value: string;
  label: string;
}

export type TableRow = Record<string, unknown>;
