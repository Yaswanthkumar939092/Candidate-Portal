import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const { useFlags } = vi.hoisted(() => ({ useFlags: vi.fn() }))
vi.mock("@/lib/hooks/useCandidateFeatureFlags", () => ({ useCandidateFeatureFlags: useFlags }))

import { DEFAULT_FEATURE_FLAGS, FeatureFlagProvider, useFeatureFlags } from "@/lib/contexts/feature-flags"

function Probe() {
  const { flags, isEnabled, getFlag } = useFeatureFlags()
  return (
    <div>
      <span data-testid="flags">{JSON.stringify(flags)}</span>
      <span data-testid="enabled-home">{String(isEnabled("home"))}</span>
      <span data-testid="enabled-unknown">{String(isEnabled("nope"))}</span>
      <span data-testid="flag-unknown">{String(getFlag("nope", true))}</span>
      <span data-testid="flag-known">{String(getFlag("documents", true))}</span>
    </div>
  )
}

function renderWith(remote: unknown, initial?: Record<string, boolean>) {
  useFlags.mockReturnValue({ data: remote, isLoading: false, error: null, refetch: vi.fn() })
  render(<FeatureFlagProvider initialFlags={initial}><Probe /></FeatureFlagProvider>)
  return JSON.parse(screen.getByTestId("flags").textContent!) as Record<string, boolean>
}

beforeEach(() => vi.clearAllMocks())

describe("FeatureFlagProvider precedence", () => {
  // Spec: CAND-02-A4.3A (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a4-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("layers built-in defaults, then initialFlags, then remote flags, and turns a remote flag on only for 1 or true", () => {
    // The two initialFlags values below are the opposite of their built-in default, so the
    // middle layer is pinned: social_job_sharing has no remote key and must survive,
    // action_center has one and must be overridden by it.
    expect(DEFAULT_FEATURE_FLAGS.social_job_sharing).toBe(false)
    expect(DEFAULT_FEATURE_FLAGS.action_center).toBe(false)
    expect(DEFAULT_FEATURE_FLAGS.home).toBe(true)
    const flags = renderWith(
      { documents: 1, home: 0, open_jobs: true, my_jobs: "1", action_center: "true", extra_flag: 1 },
      { social_job_sharing: true, action_center: true, my_jobs: false },
    )
    expect(flags.documents).toBe(true)
    expect(flags.home).toBe(false)
    expect(flags.open_jobs).toBe(true)
    expect(flags.my_jobs).toBe(false)
    // initialFlags beats the default when no remote key exists
    expect(flags.social_job_sharing).toBe(true)
    // a remote key beats initialFlags, and "true" is not 1 or true, so it lands false
    expect(flags.action_center).toBe(false)
    expect(flags.extra_flag).toBe(true)
    expect(flags.careers_public_enabled).toBe(DEFAULT_FEATURE_FLAGS.careers_public_enabled)
    expect(DEFAULT_FEATURE_FLAGS.careers_public_enabled).toBe(false)
  })

  // Spec: CAND-02-A4.3B (docs/spec/clauses/02-api-client-and-backend-contract.md#cand-02-a4-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("isEnabled is false for a flag that is missing or not a boolean, and getFlag returns the caller's default only when the flag is missing", () => {
    renderWith(null)
    expect(screen.getByTestId("enabled-home").textContent).toBe("true")
    expect(screen.getByTestId("enabled-unknown").textContent).toBe("false")
    expect(screen.getByTestId("flag-unknown").textContent).toBe("true")
    expect(screen.getByTestId("flag-known").textContent).toBe("false")
  })
})
