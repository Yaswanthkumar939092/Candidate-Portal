import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { getBranding } = vi.hoisted(() => ({ getBranding: vi.fn() }))

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
  Space_Grotesk: () => ({ variable: "space" }),
}))
vi.mock("@/app/providers", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock("@/lib/services/candidate-branding", () => ({ candidateBrandingService: { getCandidateBranding: getBranding } }))

import { generateMetadata } from "@/app/layout"
import { metadata as ctcMetadata } from "@/app/ctc-proposal/layout"
import { metadata as directMetadata } from "@/app/direct-applicant-form/layout"
import { loginHref, portalEquivalent, PORTAL_EQUIVALENT, RESUME_CONTINUE_PATH, SHARED_JOB_PARAM } from "@/lib/careers/login-redirect"

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://frappe.example.invalid:8000/")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe("root metadata", () => {
  // Spec: CAND-01-A3.1A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a3-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("builds the title and favicon from the branding: title_prefix, and app_logo made absolute against NEXT_PUBLIC_FRAPPE_URL unless it already starts with http", async () => {
    getBranding.mockResolvedValueOnce({ title_prefix: "Example Co", app_logo: "/files/logo.png" })
    const a = await generateMetadata()
    expect(a.title).toEqual({ default: "Example Co - Candidate Portal", template: "%s | Example Co" })
    expect(a.icons).toEqual({ icon: "http://frappe.example.invalid:8000/files/logo.png" })

    getBranding.mockResolvedValueOnce({ title_prefix: "Example Co", app_logo: "files/logo.png" })
    expect((await generateMetadata()).icons).toEqual({ icon: "http://frappe.example.invalid:8000/files/logo.png" })

    getBranding.mockResolvedValueOnce({ app_logo: "https://cdn.example.invalid/l.png" })
    const c = await generateMetadata()
    expect(c.icons).toEqual({ icon: "https://cdn.example.invalid/l.png" })
    expect(c.title).toEqual({ default: "ERP - Candidate Portal", template: "%s | ERP" })
  })

  // Spec: CAND-01-A3.1B (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a3-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("falls back to the prefix ERP and /favicon.svg when the branding call rejects", async () => {
    getBranding.mockRejectedValueOnce(new Error("down"))
    const m = await generateMetadata()
    expect(m.title).toEqual({ default: "ERP - Candidate Portal", template: "%s | ERP" })
    expect(m.icons).toEqual({ icon: "/favicon.svg" })
    expect(m.keywords).toContain("erp")
  })

  // Spec: CAND-01-A3.2A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a3-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("sets referrer no-referrer on the two token-link layouts", () => {
    expect(ctcMetadata.referrer).toBe("no-referrer")
    expect(directMetadata.referrer).toBe("no-referrer")
  })
})

describe("careers login-redirect helpers", () => {
  // Spec: CAND-01-A4.1A (docs/spec/clauses/01-overview-routing-and-session.md#cand-01-a4-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("loginHref encodes the destination, and an unknown careers path maps to /dashboard", () => {
    expect(loginHref("/open-jobs/HR-OPN-TEST-1/apply-job?x=1&y=2")).toBe("/login?redirect=%2Fopen-jobs%2FHR-OPN-TEST-1%2Fapply-job%3Fx%3D1%26y%3D2")
    expect(portalEquivalent("/something-else", "")).toBe("/dashboard")
    expect(PORTAL_EQUIVALENT).toEqual({ "/": "/dashboard", "/ai-match": RESUME_CONTINUE_PATH, "/jobs": "/open-jobs" })
    expect(SHARED_JOB_PARAM).toBe("job")
  })
})
