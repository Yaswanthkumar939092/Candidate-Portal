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
}

export interface ListOpeningsParams {
  page: string;
  limit: string;
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
  table_fields?: any[];
}

export interface SubmitApplicationPayload {
  opening: string;
  data: Record<string, unknown>;
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
}
