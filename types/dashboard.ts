export type DashboardWorkLocationDetails = {
  name: string;
  branch: string;
  custom_location_code: string;
  custom_address: string | null;
  custom_location_area: string | null;
  custom_office_area: string | null;
  custom_office_city: string | null;
  custom_city: string | null;
  custom_state: string | null;
  custom_country: string | null;
  custom_pin_code: string | null;
  custom_office_email: string | null;
  custom_mobile_no: string | null;
  custom_telephone_no: string | null;
  custom_google_map_link: string | null;
  custom_location_url: string | null;
};

export type DashboardKeyContact = {
  name: string;
  employee: string;
  role: string;
  email: string;
  phone_number: string;
  idx: number;
  employee_name: string;
};

export type DashboardFormCompletion = {
  total_fields: number;
  filled_fields: number;
  percentage: number;
};

export type DashboardData = {
  name: string;
  date_of_joining: string;
  designation: string;
  department: string;
  work_location: string;
  work_location_details: DashboardWorkLocationDetails;
  key_contacts: DashboardKeyContact[];
  onboarding_stage?: string;
  form_completion?: DashboardFormCompletion;
  onboarding_status?: boolean;
  dpdp_consent_required?: boolean;
  dpdp_consent_submitted?: boolean;
  dpdp_consent_url?: string;
};

export interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}
