// Human labels for Action Center cards.
//
// The backend sets `title` from Action Center Settings -> Title by DocType. That
// mapping is optional, so items often arrive with a blank title. Showing a bare
// "Task" tells the candidate nothing about what is waiting for them, so we
// derive the action type from the item's `reference_doctype` instead.

const DOCTYPE_LABELS: Record<string, string> = {
  "Job Applicant Pre Offer Form": "Pre-Offer Form",
  "Job Offer": "Offer Letter",
  "Employee Onboarding": "Onboarding",
  "Job Applicant": "Pre-Onboarding Form",
  "Direct Applicant Form Request": "Applicant Form",
  "CTC Proposal": "CTC Proposal",
}

/**
 * Candidate-facing label for an action item's `reference_doctype`.
 * Unknown doctypes fall back to their own name (underscores to spaces,
 * title-cased); a blank doctype yields "".
 */
export function actionTypeLabel(referenceDoctype?: string | null): string {
  const doctype = (referenceDoctype || "").trim()
  if (!doctype) return ""

  const mapped = DOCTYPE_LABELS[doctype]
  if (mapped) return mapped

  return doctype
    .replace(/_/g, " ")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Title shown on a task card: the configured title when there is one, else the
 * action type derived from the doctype, else the generic "Task".
 */
export function resolveTaskTitle(
  title?: string | null,
  referenceDoctype?: string | null,
): string {
  const configured = (title || "").trim()
  if (configured) return configured

  return actionTypeLabel(referenceDoctype) || "Task"
}
