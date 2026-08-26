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
  depends_on?: string;
  mandatory_depends_on?: string;
  length?: number;
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

export interface OnboardingRequiredField {
  fieldname: string;
  label: string;
  fieldtype: string;
  section: string;
  value?: unknown;
  filled: boolean;
}

export interface OnboardingTab {
  tab: string;
  field_counts?: FieldCounts;
  required_fields?: OnboardingRequiredField[];
  sections: OnboardingSection[];
}

export interface OnboardingBranding {
  company?: string | null;
  company_name?: string | null;
  logo?: string | null;
  badge_label?: string | null;
}

export interface OnboardingJoining {
  date_of_joining?: string | null;
  boarding_begins_on?: string | null;
  days_to_joining?: number | null;
  is_set?: boolean;
  trainee_doj?: string | null;
  days_to_trainee_joining?: number | null;
  role?: string | null;
  role_name?: string | null;
  department?: string | null;
  department_name?: string | null;
}

export interface OnboardingJourneyStep {
  title: string;
  timeframe?: string;
  detail?: string;
  icon?: string | null;
}

export interface OnboardingJourney {
  title: string;
  subtitle?: string;
  steps: OnboardingJourneyStep[];
}

export interface OnboardingKeyContact {
  name?: string;
  designation?: string;
  email?: string;
  mobile_no?: string;
  phone?: string;
  image?: string | null;
}

export interface OnboardingFormMessage {
  status: string;
  onboarding_name: string;
  job_applicant: string;
  boarding_status: string;
  form_source?: string;
  pre_release_name?: string | null;
  tabs: OnboardingTab[];
  field_status_counts?: FieldCounts;
  branding?: OnboardingBranding;
  joining?: OnboardingJoining;
  key_contacts?: OnboardingKeyContact[];
  onboarding_journey?: OnboardingJourney;
}

export interface OnboardingFormApiResponse {
  message: OnboardingFormMessage;
}

export interface OnboardingForm {
  applicantId: string;
  status: string;
  tabs: OnboardingTab[];
  field_status_counts?: FieldCounts;
  branding?: OnboardingBranding;
  joining?: OnboardingJoining;
  key_contacts?: OnboardingKeyContact[];
  onboarding_journey?: OnboardingJourney;
  form_source?: string;
}

export type OnboardingFormResponse = OnboardingFormMessage;
