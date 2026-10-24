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
    evergreen: closesOn === null,
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
