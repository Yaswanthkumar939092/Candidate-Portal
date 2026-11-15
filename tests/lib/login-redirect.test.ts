import { describe, expect, it } from "vitest";
import { portalEquivalent, safeRedirect } from "@/lib/careers/login-redirect";

// Open redirect fix (PWHR-1519, OPS-507); no spec clause yet.
describe("safeRedirect", () => {
  it.each([
    ["/my-jobs", "/my-jobs"],
    ["/open-jobs?tab=smart-match#top", "/open-jobs?tab=smart-match#top"],
    ["/campus-apply?campus_invite=CINV-1&email=a%40example.invalid", "/campus-apply?campus_invite=CINV-1&email=a%40example.invalid"],
    ["/a/../my-jobs", "/my-jobs"],
  ])("follows the same-origin path %s", (redirect, expected) => {
    expect(safeRedirect(redirect, "/fallback")).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "my-jobs",
    "https://elsewhere.example.invalid/landing",
    "javascript:alert(1)",
    "//elsewhere.example.invalid",
    "/\\elsewhere.example.invalid",
    "\\\\elsewhere.example.invalid",
    "/\t/elsewhere.example.invalid",
    "/\n/elsewhere.example.invalid",
    "/..//elsewhere.example.invalid",
    "/.//elsewhere.example.invalid",
    "/%2e%2e//elsewhere.example.invalid",
  ])("falls back for %j", (redirect) => {
    expect(safeRedirect(redirect, "/fallback")).toBe("/fallback");
  });
});

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
    expect(portalEquivalent("/", "?job=HR-OPN-1")).toBe("/open-jobs");
    expect(portalEquivalent("/ai-match", "?job=HR-OPN-1")).toBe("/open-jobs?tab=smart-match");
  });
});
