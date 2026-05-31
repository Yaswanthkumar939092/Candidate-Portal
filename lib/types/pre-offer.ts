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
  table_fields?: PreOfferField[];
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

export interface PreOfferForm {
  applicantId: string;
  status: string;
  tabs: PreOfferTab[];
}

export interface FrappePreOfferFieldResponse {
  section?: string;
  reference_name?: string;
  display_name?: string;
  fieldname?: string;
  label?: string;
  fieldtype: string;
  options?: string;
  reqd?: number;
  ctq?: number;
  visibility?: string;
  editability?: string;
  read_only?: number;
  hidden?: number;
  in_list_view?: number;
  child_doctype?: string;
  child_fields?: FrappePreOfferFieldResponse[];
  table_fields?: FrappePreOfferFieldResponse[];
  value?: unknown;
  default?: unknown;
  approval_status?: string;
  hr_comment?: string;
}

export interface PreOfferFormApiResponse {
  message: FrappePreOfferFieldResponse[];
}
