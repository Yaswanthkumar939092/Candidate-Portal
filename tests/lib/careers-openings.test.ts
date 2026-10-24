import { describe, expect, it } from "vitest";
import { listLiveOpenings, matchesQuery, normalizeOpening } from "@/lib/careers/openings";
import type { RawPublicOpening } from "@/types/public-job";

const base: RawPublicOpening = {
  name: "HR-OPN-1",
  job_title: "Backend Developer",
  designation: "Developer",
  department: "Accounts - HomeFirst",
  company: "HomeFirst",
  location: "Jodhpur II",
  employment_type: "EMPTYPE_2",
  description: "<p>Build things</p>",
  posted_on: "2026-10-01 00:00:00",
  closes_on: null,
  custom_hiring_type: "Lateral",
  custom_min_experience_required: 2,
  custom_work_experience_range: "",
  custom_tag_as_remote_job: 0,
  lower_range: 50000,
  upper_range: 600000,
  salary_per: "Year",
  publish_salary_range: 0,
};

const types = { EMPTYPE_2: "Employee" };

describe("normalizeOpening", () => {
  it("treats an opening without a closing date as evergreen", () => {
    expect(normalizeOpening(base, types).evergreen).toBe(true);
    expect(normalizeOpening({ ...base, closes_on: "2026-11-14" }, types).evergreen).toBe(false);
  });

  it("never exposes salary unless the opening publishes it", () => {
    expect(normalizeOpening(base, types).salary).toBeNull();
    expect(normalizeOpening({ ...base, publish_salary_range: 1 }, types).salary).toEqual({
      lower: 50000,
      upper: 600000,
      per: "Year",
    });
  });

  it("strips the company suffix from the department and resolves the employment type label", () => {
    const opening = normalizeOpening(base, types);
    expect(opening.department).toBe("Accounts");
    expect(opening.employmentType).toBe("Employee");
  });

  it("shows remote openings as Remote and falls back to min experience", () => {
    const opening = normalizeOpening({ ...base, custom_tag_as_remote_job: 1 }, types);
    expect(opening.location).toBe("Remote");
    expect(opening.experience).toBe("2+ years");
  });
});

describe("listLiveOpenings", () => {
  it("drops openings whose closing date has passed but keeps ones closing today", () => {
    const raws = [
      { ...base, name: "expired", closes_on: "2026-10-22" },
      { ...base, name: "today", closes_on: "2026-10-23" },
      { ...base, name: "evergreen", closes_on: null },
    ];
    expect(listLiveOpenings(raws, types, "2026-10-23").map((o) => o.id).sort()).toEqual(["evergreen", "today"]);
  });
});

describe("matchesQuery", () => {
  const opening = normalizeOpening(base, types);

  it("requires every term but across any field, ignoring case", () => {
    expect(matchesQuery(opening, "backend jodhpur")).toBe(true);
    expect(matchesQuery(opening, "BACKEND accounts")).toBe(true);
    expect(matchesQuery(opening, "backend mumbai")).toBe(false);
  });

  it("matches everything for a blank query", () => {
    expect(matchesQuery(opening, "   ")).toBe(true);
  });
});
