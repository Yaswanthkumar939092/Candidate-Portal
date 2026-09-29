// CTC Proposal — calls to the logged-in candidate endpoints in
// recruitment.api.ctc_proposal_portal. The backend serves a proposal only to
// the candidate it was sent to (session cookie).

import { frappeApiBase } from "../frappe-base";
import type { CtcProposalData, CtcResponsePayload } from "../types/ctc-proposal";
import { frappeErrorMessage } from "./direct-applicant-form";

const API = "recruitment.api.ctc_proposal_portal";

async function call<T>(method: string, init: RequestInit, params?: Record<string, string>): Promise<T> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(`${frappeApiBase()}/api/method/${API}.${method}${query}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...((init.headers as Record<string, string>) || {}) },
  });
  let body: unknown = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) throw new Error(frappeErrorMessage(body, "Something went wrong. Please try again."));
  return (body as { message: T }).message;
}

/**
 * How the candidate reached the proposal:
 *  - proposal: from the Action Center, logged in (session cookie);
 *  - token:    from the emailed link, no login.
 */
export type ProposalAccess = { proposal: string; token?: never } | { token: string; proposal?: never };

export const proposalAccessKey = (access: ProposalAccess) => access.token ?? access.proposal ?? "";

export const ctcProposalService = {
  getProposal: (access: ProposalAccess) =>
    access.token
      ? call<CtcProposalData>("get_proposal", { method: "GET" }, { t: access.token })
      : call<CtcProposalData>("get_my_proposal", { method: "GET" }, { proposal: access.proposal as string }),

  respond: (access: ProposalAccess, payload: CtcResponsePayload) =>
    call<{ status: string }>(access.token ? "respond" : "respond_my_proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(access.token ? { t: access.token } : { proposal: access.proposal }), ...payload }),
    }),
};
