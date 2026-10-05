// Direct Applicant Form — calls to the logged-in candidate endpoints in
// recruitment.api.direct_applicant_portal. Every call names the Form Request;
// the backend serves it only to the candidate it was sent to (session cookie).

import { frappeApiBase } from "../frappe-base";
import { frappeErrorMessage } from "../frappe-error";
import type { DirectApplicantFormData, LinkOption } from "../types/direct-applicant-form";

const API = "recruitment.api.direct_applicant_portal";

export { frappeErrorMessage };

async function request<T>(method: string, init: RequestInit & { params?: Record<string, string> } = {}): Promise<T> {
  const { params, ...rest } = init;
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(`${frappeApiBase()}/api/method/${API}.${method}${query}`, {
    ...rest,
    credentials: "include",
    headers: { Accept: "application/json", ...((rest.headers as Record<string, string>) || {}) },
  });
  let body: unknown = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    throw new Error(frappeErrorMessage(body, "Something went wrong. Please try again."));
  }
  return (body as { message: T }).message;
}

/**
 * How the candidate reached the form:
 *  - request: from the Action Center, logged in (session cookie);
 *  - token:   from the emailed link, no login (the link's token).
 */
export type FormAccess = { request: string; token?: never } | { token: string; request?: never };

/** Endpoint + identifying param for each access mode. */
function via(access: FormAccess, tokenMethod: string, sessionMethod: string): { method: string; params: Record<string, string> } {
  return access.token
    ? { method: tokenMethod, params: { t: access.token } }
    : { method: sessionMethod, params: { request: access.request as string } };
}

export const accessKey = (access: FormAccess) => access.token ?? access.request ?? "";

export const directApplicantFormService = {
  getForm: (access: FormAccess) => {
    const { method, params } = via(access, "get_form", "get_my_form");
    return request<DirectApplicantFormData>(method, { method: "GET", params });
  },

  searchLink: (access: FormAccess, fieldname: string, txt: string, childFieldname?: string) => {
    const { method, params } = via(access, "search_link", "search_my_link");
    return request<LinkOption[]>(method, {
      method: "GET",
      params: { ...params, fieldname, txt, ...(childFieldname ? { child_fieldname: childFieldname } : {}) },
    });
  },

  uploadFile: (access: FormAccess, fieldname: string, file: File, childFieldname?: string) => {
    const { method, params } = via(access, "upload_file", "upload_my_file");
    const form = new FormData();
    Object.entries(params).forEach(([k, v]) => form.append(k, v));
    form.append("fieldname", fieldname);
    if (childFieldname) form.append("child_fieldname", childFieldname);
    form.append("file", file);
    return request<{ file_url: string; file_name: string }>(method, { method: "POST", body: form });
  },

  submit: (access: FormAccess, data: Record<string, unknown>) => {
    const { method, params } = via(access, "submit_form", "submit_my_form");
    return request<{ status: string; message: string }>(method, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, data: JSON.stringify(data) }),
    });
  },
};
