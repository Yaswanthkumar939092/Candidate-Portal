/**
 * Job Opening id from the `[id]` route segment. Next.js hands the segment over still
 * percent-encoded ("ERPNext%20Consultant%20Pune"), and the API client encodes it again,
 * so Frappe would look up "ERPNext%20Consultant%20Pune" and return 404. Decode it once.
 */
export function jobOpeningFromParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    // Malformed escape such as a lone "%": the raw segment is the best id we have.
    return param;
  }
}

/** Apply page of a Job Opening; the id is encoded so spaces, "/", "?" and "#" survive. */
export function applyJobPath(jobOpening: string): string {
  return `/open-jobs/${encodeURIComponent(jobOpening)}/apply-job`;
}
