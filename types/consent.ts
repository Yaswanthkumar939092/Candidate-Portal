export interface ConsentHeader {
  title: string;
  subtitle: string;
}

export interface ConsentInformationItem {
  [key: string]: string;
}

export interface ConsentStatement {
  consent_key: string;
  statement: string;
  fieldtype: "Check" | string;
  is_mandatory: number | boolean;
}

export interface ConsentDeclaration {
  heading: string;
  require_all_mandatory: number | boolean;
  statements: ConsentStatement[];
}

export interface ConsentAcknowledgementField {
  fieldname: string;
  label: string;
  fieldtype: "Data" | "Signature" | "Date" | string;
  is_mandatory: number | boolean;
}

export interface ConsentApplicant {
  name: string;
  email: string;
}

/**
 * How the candidate is asked for DPDP consent.
 *
 * - `Internal Form` renders the declaration inside this portal (the original,
 *   and still the default when the backend sends no mode at all).
 * - `External Portal` hands the candidate off to the HPCP consent journey on
 *   another origin; the backend hears the outcome on its own callback, so the
 *   portal only ever holds a URL and a session id.
 */
export const CONSENT_MODE_EXTERNAL = "External Portal";
export const CONSENT_MODE_INTERNAL = "Internal Form";

export type ConsentMode =
  | typeof CONSENT_MODE_EXTERNAL
  | typeof CONSENT_MODE_INTERNAL;

/**
 * True only for an explicit `External Portal`. Anything else - `Internal Form`,
 * an unknown value, or nothing at all - keeps the in-app form, so a backend that
 * has not been upgraded behaves exactly as it did before.
 */
export function isExternalConsentMode(
  mode?: ConsentMode | string | null,
): boolean {
  return typeof mode === "string" && mode.trim().toLowerCase() === "external portal";
}

/**
 * `get_consent_form` response.
 *
 * In `External Portal` mode the backend returns `consent_mode` and `consent_url`
 * instead of a form to render, so every form-shaped field here is optional - a
 * caller must not assume `declaration` or `acknowledgement` exist.
 */
export interface ConsentFormResponse {
  enabled: boolean;
  enforce_before_onboarding?: number | boolean;
  consent_mode?: ConsentMode | string | null;
  consent_url?: string | null;
  header?: ConsentHeader;
  intro_content?: string;
  information?: ConsentInformationItem[];
  closing_content?: string;
  declaration?: ConsentDeclaration;
  acknowledgement?: ConsentAcknowledgementField[];
  confirmation_note?: string | null;
  applicant?: ConsentApplicant;
  already_consented?: boolean;
  consent_log?: unknown;
}

/**
 * `start_consent_session` response - a fresh consent link, or the in-flight one.
 *
 * `reused: true` means an existing, still-valid link came back rather than a new
 * one. That is deliberate: do not retry to force a fresh session.
 *
 * When `already_consented` is true there is no link - `consent_log` and
 * `redirect_url` are returned instead and the candidate should be sent onward.
 */
export interface ConsentSessionStartResponse {
  already_consented: boolean;
  session_id?: string | null;
  consent_url?: string | null;
  expires_at?: string | null;
  reused?: boolean;
  consent_log?: string | null;
  redirect_url?: string | null;
}

/**
 * `get_consent_session_status` response - what the return page polls.
 *
 * `consent_given` is the only field to gate on. The external portal can redirect
 * the candidate back before its callback reaches our backend, so arriving on the
 * return URL is not itself proof of consent.
 */
export interface ConsentSessionStatusResponse {
  enabled: boolean;
  consent_given: boolean;
  consent_log?: string | null;
  session_id?: string | null;
  session_status?: string | null;
  consent_url?: string | null;
  expires_at?: string | null;
  redirect_url?: string | null;
}
