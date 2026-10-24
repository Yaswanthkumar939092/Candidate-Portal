import { formatDateDDMMYYYY } from "@/lib/utils";
import type { PublicOpening } from "@/types/public-job";

const PER_YEAR: Record<string, number> = { Year: 1, Month: 12, Week: 52, Day: 365, Hour: 2080 };

/** Salary in lakhs per annum, as the job detail dialog expects. */
function toLpa(amount: number, per: string): number {
  return Math.round(((amount * (PER_YEAR[per] ?? 1)) / 100000) * 100) / 100;
}

/** Shape consumed by `JobMatchCard` / `JobDetailDialog`. */
export function toCardJob(opening: PublicOpening) {
  const lower = opening.salary ? toLpa(opening.salary.lower, opening.salary.per) : null;
  const upper = opening.salary ? toLpa(opening.salary.upper, opening.salary.per) : null;
  return {
    id: opening.id,
    title: opening.title,
    company: opening.company,
    location: opening.location,
    experience: opening.experience,
    salary: upper ? `${lower} - ${upper} LPA` : "",
    lower_range: lower,
    upper_range: upper,
    type: opening.employmentType || opening.hiringType,
    skills: [] as string[],
    custom_qualifications: [] as string[],
    matchPercentage: 0,
    description: opening.description,
  };
}

/** Label/value chips for `JobMatchCard`, skipping anything the opening does not have. */
export function toColumnFields(opening: PublicOpening) {
  return [
    { label: "Company", value: opening.company },
    { label: "Location", value: opening.location },
    { label: "Department", value: opening.department },
    { label: "Employment Type", value: opening.employmentType || opening.hiringType },
    { label: "Experience", value: opening.experience },
    {
      label: "Closes on",
      value: opening.closesOn ? formatDateDDMMYYYY(opening.closesOn) : "Always hiring",
    },
  ].filter((field) => field.value);
}
