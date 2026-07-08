export interface CustomJobOpening {
  name: string;
  job_title: string;
  designation: string;
  designation_id: string;
  department: string;
  department_id: string;
  location: string;
  location_id: string;
  company: string;
  company_id: string;
  status: string;
  posted_on: string;
  closes_on: string | null;
  description: string;
  opening_code: string | null;
  employment_type?: string;
  custom_work_experience?: string;
  lower_range?: number | null;
  upper_range?: number | null;
  skills_required?: string;
  custom_salary?: string;
  applied?: boolean;
  saved?: boolean;
}

export interface ListOpeningsParams {
  page: string;
  limit: string;
  search_term?: string;
}

export interface JobOpeningColumn {
  fieldname: string;
  label: string;
  value_key: string;
}

export interface ListOpeningsResponse {
  columns: JobOpeningColumn[];
  search_filters: any[];
  openings: CustomJobOpening[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_more: boolean;
  };
}

export interface ApplicationField {
  section: string;
  reference_name: string;
  display_name: string;
  fieldtype: string;
  options: string;
  reqd: number;
  ctq: number;
  visibility: string;
  editability: string;
  value?: string;
  table_fields?: any[];
}

export interface SubmitApplicationPayload {
  job_applicant_email: string | null;
  job_opening: string;
  form_data: Record<string, unknown>;
  status?: string;
  isCampus?: boolean;
  campus_invite?: string | null;
}

export interface SubmitApplicationResponse {
  status: string;
  name: string;
  source: string;
}

export interface JobField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
  reqd?: number | boolean;
  is_mandatory?: number | boolean;
  read_only?: number | boolean;
  hidden?: number | boolean;
  child_doctype?: string;
  child_fields?: JobField[];
  tab_label?: string;
  section_label?: string;
  value?: string;
}
