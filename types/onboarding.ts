export interface OnboardingFormField {
  fieldname: string;
  label: string;
  fieldtype: string;
  is_mandatory: number;
  read_only: number;
  hidden: number;
  options: string;
  value: unknown;
  default?: unknown;
  approval_status: string;
  hr_comment: string;
}

export interface OnboardingFormSection {
  section: string;
  fields: OnboardingFormField[];
}

export interface OnboardingFormTab {
  tab: string;
  sections: OnboardingFormSection[];
}

export interface OnboardingFormMessage {
  status: string;
  job_applicant: string;
  form_source: string;
  onboarding_name: string;
  boarding_status: string;
  tabs: OnboardingFormTab[];
}

export interface OnboardingFormApiResponse {
  message: OnboardingFormMessage;
}

export interface OnboardingForm {
  applicantId: string;
  status: string;
  tabs: OnboardingFormTab[];
}