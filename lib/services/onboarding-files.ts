// Onboarding documents — recruitment.api.onboarding_files.
//
// The onboarding form's attachments (PAN, Aadhaar, address proof, salary slips…)
// are stored as PRIVATE files on the candidate's own Employee Onboarding. A
// private /private/files/... URL is Forbidden to a candidate (portal session, no
// Frappe login), so opening one goes through an endpoint that checks the file is
// attached to that candidate's onboarding.

import { frappeApiBase } from "../frappe-base";
import { frappeErrorMessage } from "../frappe-error";

const API = "recruitment.api.onboarding_files";

export async function uploadMyOnboardingFile(
  file: File,
  fieldname: string,
): Promise<{ file_url: string; file_name: string }> {
  const form = new FormData();
  form.append("fieldname", fieldname);
  form.append("file", file);
  const res = await fetch(`${frappeApiBase()}/api/method/${API}.upload_my_onboarding_file`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  let body: unknown = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    throw new Error(frappeErrorMessage(body, "Upload failed. Please try again."));
  }
  return (body as { message: { file_url: string; file_name: string } }).message;
}

/** Link that opens an onboarding file: private ones via the ownership-checked
 *  endpoint, public ones (uploaded before this change) and full URLs directly. */
export function myOnboardingFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http")) return fileUrl;
  if (!fileUrl.startsWith("/private/")) return `${frappeApiBase()}${fileUrl}`;
  const query = new URLSearchParams({ file_url: fileUrl }).toString();
  return `${frappeApiBase()}/api/method/${API}.download_my_onboarding_file?${query}`;
}
