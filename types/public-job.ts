/** Job Opening fields requested from Frappe for the public careers pages. */
export interface RawPublicOpening {
  name: string;
  job_title: string | null;
  designation: string | null;
  department: string | null;
  company: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  posted_on: string | null;
  closes_on: string | null;
  custom_hiring_type: string | null;
  custom_min_experience_required: number | null;
  custom_work_experience_range: string | null;
  custom_tag_as_remote_job: 0 | 1 | null;
  lower_range: number | null;
  upper_range: number | null;
  salary_per: string | null;
  publish_salary_range: 0 | 1 | null;
}

/** Guest-safe opening served by `/api/public/openings`. */
export interface PublicOpening {
  id: string;
  title: string;
  designation: string;
  department: string;
  company: string;
  location: string;
  employmentType: string;
  hiringType: string;
  experience: string;
  description: string;
  postedOn: string | null;
  closesOn: string | null;
  /** Salary is only exposed when the opening is flagged `publish_salary_range`. */
  salary: { lower: number; upper: number; per: string } | null;
  /** Evergreen = no closing date; stays live for ongoing / bulk hiring. */
  evergreen: boolean;
}
