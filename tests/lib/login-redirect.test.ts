import { describe, expect, it } from "vitest";
import { portalEquivalent } from "@/lib/careers/login-redirect";

describe("portalEquivalent", () => {
  // Spec: CAND-01-A4.2A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a4-2a)
  it("keeps the shared job when a logged-in visitor opens /jobs?job=", () => {
    expect(portalEquivalent("/jobs", "?job=HR-OPN-2026-0007")).toBe("/open-jobs?job=HR-OPN-2026-0007");
  });

  // Spec: CAND-01-A4.2B (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a4-2b)
  it("encodes the job id", () => {
    expect(portalEquivalent("/jobs", "?job=A%26B")).toBe("/open-jobs?job=A%26B");
  });

  // Spec: CAND-01-A4.2C (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a4-2c)
  it("sends /jobs without a job to the plain list", () => {
    expect(portalEquivalent("/jobs", "")).toBe("/open-jobs");
    expect(portalEquivalent("/jobs", "?q=x")).toBe("/open-jobs");
  });

  // Spec: CAND-01-A4.2D (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a4-2d)
  it("ignores a job param on other careers pages", () => {
    expect(portalEquivalent("/", "?job=HR-OPN-1")).toBe("/dashboard");
    expect(portalEquivalent("/ai-match", "?job=HR-OPN-1")).toBe("/open-jobs?tab=smart-match");
  });
});
