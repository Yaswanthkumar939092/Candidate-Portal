// CTC Proposal — HR's CTC offer to a direct applicant, answered with Accept,
// Negotiate or Reject. Shapes mirror recruitment.api.ctc_proposal_portal.

export interface CtcProposalLine {
  component: string;
  monthly: number;
  annual: number;
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
  annual_ctc: number;
  earnings: CtcProposalLine[];
  deductions: CtcProposalLine[];
  monthly_gross: number;
  monthly_deductions: number;
  monthly_net: number;
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
