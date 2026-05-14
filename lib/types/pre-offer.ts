export interface PreOfferField {
  fieldname: string;
  label: string;
  fieldtype: string;
  is_mandatory: number;
  reqd?: number;
  read_only: number;
  hidden: number;
  options?: string;
  child_doctype?: string;
  child_fields?: PreOfferField[];
  value?: unknown;
  default?: unknown;
  approval_status?: string;
  hr_comment?: string;
}

export interface PreOfferSection {
  section: string;
  fields: PreOfferField[];
}

export interface FieldCounts {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  filled: number;
}

export interface PreOfferTab {
  tab: string;
  field_counts?: FieldCounts;
  sections: PreOfferSection[];
}

export interface PreOfferFormMessage {
  status: string;
  form_name: string;
  job_applicant: string;
  pre_offer_form_status: string;
  tabs: PreOfferTab[];
}

export interface PreOfferFormApiResponse {
  message: PreOfferFormMessage;
}

export interface PreOfferForm {
  applicantId: string;
  status: string;
  tabs: PreOfferTab[];
}

export type PreOfferFormResponse = PreOfferFormMessage;
