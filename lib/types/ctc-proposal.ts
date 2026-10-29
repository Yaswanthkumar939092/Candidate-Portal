// CTC Proposal — HR's CTC offer to a direct applicant, answered with Accept,
// Negotiate or Reject. Shapes mirror recruitment.api.ctc_proposal_portal.

export interface CtcProposalLine {
  component: string;
  monthly: number;
  annual: number;
}

/** A line of the CTC annexure (recruitment.api.ctc_proposal.annexure). */
export interface CtcAnnexureRow {
  label: string;
  kind: "row" | "heading" | "total";
  key?: "gross" | "net" | "ctc";
  monthly?: number;
  annual?: number;
}

export type CtcProposalStatus =
  | "Sent"
  | "Negotiation Requested"
  | "Accepted"
  | "Rejected"
  | "Superseded"
  | "Withdrawn"
  | "Offer Created"
  | "Offer Failed";

export interface CtcProposalData {
  applicant_name: string;
  company: string;
  designation: string;
  department: string;
  employment_type: string;
  expected_doj: string | null;
  currency: string | null;
  ctc: number;
  /** CTC (Monthly) as HR entered it, else Annual / 12. */
  ctc_monthly?: number;
  annual_ctc: number;
  earnings: CtcProposalLine[];
  deductions: CtcProposalLine[];
  monthly_gross: number;
  monthly_deductions: number;
  monthly_net: number;
  annexure: CtcAnnexureRow[];
  take_home_monthly: number;
  annexure_note: string;
  /** The annexure's name line, "Mr. Bishnu Kushwaha" (no salutation without a gender). */
  annexure_name?: string;
  /** The Company's full name, for the annexure's "M/S." sign-off. */
  company_name?: string;
  hr_note: string;
  version: number;
  status: CtcProposalStatus;
  expired: boolean;
  expires_on: string | null;
  can_respond: boolean;
  can_negotiate: boolean;
  negotiations_left: number;
  response: string;
}

export type CtcResponse = "Accept" | "Negotiate" | "Reject";

export interface CtcResponsePayload {
  response: CtcResponse;
  expected_ctc?: number;
  comment?: string;
}
