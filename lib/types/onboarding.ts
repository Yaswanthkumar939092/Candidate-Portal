export interface OnboardingField {
  fieldname: string;
  label: string;
  fieldtype: string;
  is_mandatory: number;
  reqd?: number;
  read_only: number;
  hidden: number;
  options?: string;
  child_doctype?: string;
  child_fields?: OnboardingField[];
  value?: unknown;
  default?: unknown;
  approval_status?: string;
  hr_comment?: string;
}

export interface OnboardingSection {
  section: string;
  fields: OnboardingField[];
}

export interface FieldCounts {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  filled: number;
}

export interface OnboardingTab {
  tab: string;
  field_counts?: FieldCounts;
  sections: OnboardingSection[];
}

export interface OnboardingFormMessage {
  status: string;
  onboarding_name: string;
  job_applicant: string;
  boarding_status: string;
  tabs: OnboardingTab[];
}

export interface OnboardingFormApiResponse {
  message: OnboardingFormMessage;
}

export interface OnboardingForm {
  applicantId: string;
  status: string;
  tabs: OnboardingTab[];
}

export type OnboardingFormResponse = OnboardingFormMessage;
