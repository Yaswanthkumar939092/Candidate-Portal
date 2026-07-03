/**
 * Validation helpers for the Job Application form.
 *
 * This module mirrors the pattern used in onboarding-validation.ts but is
 * scoped to the job-application flow so the two can evolve independently.
 *
 * Currently validates:
 *  • Phone / mobile / contact number fields → must be exactly 10 digits
 *
 * More field-level validations can be added to `validateJobAppField` later.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobAppFieldValidationError {
  type: string;
  message: string;
}

export interface JobAppField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: number | boolean;
  is_mandatory?: number | boolean;
  hidden?: number | boolean;
}

// ─── Regex patterns ───────────────────────────────────────────────────────────

const PHONE_REGEX = /^\d{10}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns `true` when the field's name or label indicates it captures a
 * phone / mobile / contact number.
 */
function isPhoneField(fieldname: string, label: string): boolean {
  const labelLower = (label || "").toLowerCase();
  const nameLower = (fieldname || "").toLowerCase();

  return (
    labelLower.includes("mobile") ||
    labelLower.includes("contact number") ||
    labelLower.includes("contact no") ||
    labelLower.includes("phone") ||
    nameLower.includes("mobile") ||
    nameLower.includes("phone") ||
    nameLower.includes("contact_no") ||
    nameLower.includes("contactnumber") ||
    nameLower.includes("contact_number")
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate a single job-application field value against known pattern rules.
 *
 * Returns a `JobAppFieldValidationError` when the value is invalid, or `null`
 * when the value is valid (or empty — emptiness is handled by the required-field
 * check, not here).
 */
export function validateJobAppField(
  field: JobAppField,
  value: unknown,
): JobAppFieldValidationError | null {
  // Skip empty values — required-field checks handle that separately
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalizedValue =
    typeof value === "string" ? value.trim() : String(value).trim();

  if (normalizedValue === "") {
    return null;
  }

  // ── Phone / mobile validation ───────────────────────────────────────────
  if (
    isPhoneField(field.fieldname, field.label) &&
    !PHONE_REGEX.test(normalizedValue)
  ) {
    return {
      type: "pattern",
      message: "Please enter a valid 10-digit phone number",
    };
  }

  // 🔜 Add more field validations below as needed …

  return null;
}

/**
 * Validate all visible fields in a list and return a map of
 * `fieldname → error message` for every field that fails validation.
 *
 * This intentionally does **not** check for required-ness — that is handled
 * separately by the form's `validateRequiredFields` function.
 */
export function validateJobAppFields(
  fields: JobAppField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.hidden) return;

    const error = validateJobAppField(field, values[field.fieldname]);
    if (error) {
      errors[field.fieldname] = error.message;
    }
  });

  return errors;
}
