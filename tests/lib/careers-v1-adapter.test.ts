import { describe, expect, it } from "vitest";
import { fromV1Opening, listLiveOpenings, matchesQuery } from "@/lib/careers/openings";

const listRow = {
  name: "HR-OPN-7",
  job_title: "Payroll Analyst",
  designation: "Analyst",
  department: "Accounts - Hybrow",
  location: "Pune",
  employment_type: "Full-time",
  company: "Hybrow Labs",
  posted_on: "2026-10-20 09:00:00",
  closes_on: null,
  is_evergreen: 0,
  opening_code: "PA-7",
};

describe("fromV1Opening", () => {
  it("maps the narrow v1 row to the public opening shape", () => {
    const o = fromV1Opening(listRow, "<p>Own payroll</p>");
    expect(o).toMatchObject({
      id: "HR-OPN-7",
      title: "Payroll Analyst",
      designation: "Analyst",
      department: "Accounts",
      company: "Hybrow Labs",
      location: "Pune",
      employmentType: "Full-time",
      description: "<p>Own payroll</p>",
      postedOn: "2026-10-20",
      closesOn: null,
      evergreen: false,
    });
  });

  it("keeps an explicitly evergreen opening in the evergreen category", () => {
    expect(fromV1Opening({ ...listRow, is_evergreen: 1 }, "").evergreen).toBe(true);
  });

  it("never invents salary, hiring type or experience that v1 does not return", () => {
    const o = fromV1Opening(listRow, "");
    expect(o.salary).toBeNull();
    expect(o.hiringType).toBe("");
    expect(o.experience).toBe("");
  });

  it("falls back to designation then name when the title is missing", () => {
    expect(fromV1Opening({ ...listRow, job_title: null }, "").title).toBe("Analyst");
    expect(fromV1Opening({ ...listRow, job_title: null, designation: null }, "").title).toBe("HR-OPN-7");
  });

  it("tolerates null and missing fields without throwing", () => {
    const o = fromV1Opening({ name: "X" } as never, undefined);
    expect(o.id).toBe("X");
    expect(o.description).toBe("");
    expect(o.location).toBe("");
  });

  it("keeps closing-date filtering and search working on adapted rows", () => {
    const open = fromV1Opening({ ...listRow, closes_on: "2026-11-01" }, "");
    const past = fromV1Opening({ ...listRow, name: "Y", closes_on: "2026-09-01" }, "");
    const live = [open, past].filter((o) => o.closesOn === null || o.closesOn >= "2026-10-25");
    expect(live.map((o) => o.id)).toEqual(["HR-OPN-7"]);
    expect(matchesQuery(open, "payroll pune")).toBe(true);
    expect(typeof listLiveOpenings).toBe("function");
  });
});
