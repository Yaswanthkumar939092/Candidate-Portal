export interface CustomJobOpening {
  name: string;
  job_title: string;
  designation: string;
  department: string;
  location: string;
  company: string;
  status: string;
  posted_on: string;
  closes_on: string | null;
  description: string;
  opening_code: string;
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
  openings: CustomJobOpening[];
  total_pages?: number;
  total?: number;
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
  job_applicant_email: string;
  job_opening: string;
  form_data: Record<string, unknown>;
  status?: string;
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
