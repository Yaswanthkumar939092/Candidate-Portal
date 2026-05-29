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
