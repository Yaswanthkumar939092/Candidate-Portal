import { describe, expect, it, vi } from "vitest";
import { applyJobPath, jobOpeningFromParam } from "@/lib/careers/job-route";

vi.mock("@/components/jobs/job-applicant/JobApplicantForm", () => ({ default: () => null }));
vi.mock("@/lib/contexts/job-application-context", () => ({ JobAppProvider: () => null }));

// Apply page did not load for Job Openings named with spaces (OPS-15, 16 Nov 2026): the
// still-encoded route segment was encoded again, so Frappe got "ERPNext%2520Consultant%2520Pune".
describe("jobOpeningFromParam", () => {
  it.each([
    ["ERPNext%20Consultant%20Pune", "ERPNext Consultant Pune"],
    ["HR-OPN-2026-0001", "HR-OPN-2026-0001"],
    ["ERPNext Consultant Pune", "ERPNext Consultant Pune"],
    ["Sales%2FMarketing", "Sales/Marketing"],
  ])("decodes %s once", (param, expected) => {
    expect(jobOpeningFromParam(param)).toBe(expected);
  });

  it("keeps a malformed segment as it is", () => {
    expect(jobOpeningFromParam("100%")).toBe("100%");
  });

  it("gives an id that the API client encodes exactly once", () => {
    const query = new URLSearchParams({ opening: jobOpeningFromParam("ERPNext%20Consultant%20Pune") }).toString();
    expect(query).toBe("opening=ERPNext+Consultant+Pune");
  });
});

describe("applyJobPath", () => {
  it.each([
    ["HR-OPN-1", "/open-jobs/HR-OPN-1/apply-job"],
    ["ERPNext Consultant Pune", "/open-jobs/ERPNext%20Consultant%20Pune/apply-job"],
    ["Sales/Marketing", "/open-jobs/Sales%2FMarketing/apply-job"],
  ])("encodes %s", (id, expected) => {
    expect(applyJobPath(id)).toBe(expected);
  });

  it("round-trips through the route segment", () => {
    const segment = applyJobPath("ERPNext Consultant Pune").split("/")[2];
    expect(jobOpeningFromParam(segment)).toBe("ERPNext Consultant Pune");
  });
});

describe("apply page", () => {
  it("passes the decoded Job Opening to the form and its provider", async () => {
    const { default: ApplyPage } = await import("@/app/(portal)/open-jobs/[id]/apply-job/page");
    const page = await ApplyPage({ params: Promise.resolve({ id: "ERPNext%20Consultant%20Pune" }) });
    expect(page.props.job_opening).toBe("ERPNext Consultant Pune");
    expect(page.props.children.props.jobID).toBe("ERPNext Consultant Pune");
  });
});
