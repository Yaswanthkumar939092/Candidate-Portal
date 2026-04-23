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
  value?: any;
  default?: any;
  approval_status?: string;
  hr_comment?: string;
}

export interface OnboardingSection {
  section: string;
  fields: OnboardingField[];
}

export interface OnboardingTab {
  tab: string;
  sections: OnboardingSection[];
}

export interface OnboardingFormResponse {
  status: string;
  onboarding_name: string;
  job_applicant: string;
  boarding_status: string;
  tabs: OnboardingTab[];
}
