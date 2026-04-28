export interface DashboardWorkLocationDetails {
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
}

export interface DashboardKeyContact {
  name: string;
  employee: string;
  role: string;
  email: string;
  phone_number: string;
  idx: number;
  employee_name: string;
}

export interface DashboardData {
  name: string;
  date_of_joining: string;
  designation: string;
  department: string;
  work_location: string;
  work_location_details: DashboardWorkLocationDetails;
  key_contacts: DashboardKeyContact[];
}

export interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}
