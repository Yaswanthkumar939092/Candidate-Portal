import type { PublicOpening, RawPublicOpening } from "@/types/public-job";

/** Fields requested from Frappe. Keep in sync with `RawPublicOpening`. */
export const PUBLIC_OPENING_FIELDS: (keyof RawPublicOpening)[] = [
  "name",
  "job_title",
  "designation",
  "department",
  "company",
  "location",
  "employment_type",
  "description",
  "posted_on",
  "closes_on",
  "custom_is_evergreen",
  "custom_hiring_type",
  "custom_min_experience_required",
  "custom_work_experience_range",
  "custom_tag_as_remote_job",
  "lower_range",
  "upper_range",
  "salary_per",
  "publish_salary_range",
];

function describeExperience(raw: RawPublicOpening): string {
  const range = raw.custom_work_experience_range?.trim();
  if (range) return range;
  const min = raw.custom_min_experience_required ?? 0;
  return min > 0 ? `${min}+ years` : "";
}

export function normalizeOpening(
  raw: RawPublicOpening,
  employmentTypes: Record<string, string>,
): PublicOpening {
  const closesOn = raw.closes_on ? raw.closes_on.slice(0, 10) : null;
  const publishSalary = raw.publish_salary_range === 1 && !!raw.upper_range;
  return {
    id: raw.name,
    title: raw.job_title || raw.designation || raw.name,
    designation: raw.designation ?? "",
    // ERPNext suffixes departments with the company abbreviation: "Accounts - HomeFirst" -> "Accounts".
    department: raw.department?.replace(/ - [^-]+$/, "") ?? "",
    company: raw.company ?? "",
    location: raw.custom_tag_as_remote_job === 1 ? "Remote" : (raw.location ?? ""),
    employmentType: raw.employment_type
      ? (employmentTypes[raw.employment_type] ?? raw.employment_type)
      : "",
    hiringType: raw.custom_hiring_type ?? "",
    experience: describeExperience(raw),
    description: raw.description ?? "",
    postedOn: raw.posted_on ? raw.posted_on.slice(0, 10) : null,
    closesOn,
    salary: publishSalary
      ? { lower: raw.lower_range ?? 0, upper: raw.upper_range ?? 0, per: raw.salary_per ?? "" }
      : null,
    evergreen: raw.custom_is_evergreen === 1,
  };
}

/** Row returned by `recruitment.api.v1.candidate.list_openings` (narrow, Guest-safe). */
export interface V1OpeningRow {
  name: string;
  job_title?: string | null;
  designation?: string | null;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  company?: string | null;
  posted_on?: string | null;
  closes_on?: string | null;
  is_evergreen?: 0 | 1 | boolean | null;
  opening_code?: string | null;
}

/** v1 returns no salary, hiring type or experience, so none is invented here. */
export function fromV1Opening(row: V1OpeningRow, description?: string | null): PublicOpening {
  const closesOn = row.closes_on ? row.closes_on.slice(0, 10) : null;
  return {
    id: row.name,
    title: row.job_title || row.designation || row.name,
    designation: row.designation ?? "",
    department: row.department?.replace(/ - [^-]+$/, "") ?? "",
    company: row.company ?? "",
    location: row.location ?? "",
    employmentType: row.employment_type ?? "",
    hiringType: "",
    experience: "",
    description: description ?? "",
    postedOn: row.posted_on ? row.posted_on.slice(0, 10) : null,
    closesOn,
    salary: null,
    evergreen: row.is_evergreen === 1 || row.is_evergreen === true,
  };
}

/** `today` is `YYYY-MM-DD`. Openings past their closing date are dropped. */
export function listLiveOpenings(
  raws: RawPublicOpening[],
  employmentTypes: Record<string, string>,
  today: string,
): PublicOpening[] {
  return raws
    .map((raw) => normalizeOpening(raw, employmentTypes))
    .filter((opening) => opening.closesOn === null || opening.closesOn >= today)
    .sort((a, b) => (b.postedOn ?? "").localeCompare(a.postedOn ?? ""));
}

/** Case-insensitive; every whitespace-separated term must appear somewhere in the opening. */
export function matchesQuery(opening: PublicOpening, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [
    opening.title,
    opening.designation,
    opening.department,
    opening.company,
    opening.location,
    opening.employmentType,
    opening.hiringType,
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
