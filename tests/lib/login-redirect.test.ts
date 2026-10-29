import { describe, expect, it } from "vitest";
import { portalEquivalent } from "@/lib/careers/login-redirect";

describe("portalEquivalent", () => {
  it("keeps the shared job when a logged-in visitor opens /jobs?job=", () => {
    expect(portalEquivalent("/jobs", "?job=HR-OPN-2026-0007")).toBe("/open-jobs?job=HR-OPN-2026-0007");
  });

  it("encodes the job id", () => {
    expect(portalEquivalent("/jobs", "?job=A%26B")).toBe("/open-jobs?job=A%26B");
  });

  it("sends /jobs without a job to the plain list", () => {
    expect(portalEquivalent("/jobs", "")).toBe("/open-jobs");
    expect(portalEquivalent("/jobs", "?q=x")).toBe("/open-jobs");
  });

  it("ignores a job param on other careers pages", () => {
    expect(portalEquivalent("/", "?job=HR-OPN-1")).toBe("/dashboard");
    expect(portalEquivalent("/ai-match", "?job=HR-OPN-1")).toBe("/open-jobs?tab=smart-match");
  });
});
