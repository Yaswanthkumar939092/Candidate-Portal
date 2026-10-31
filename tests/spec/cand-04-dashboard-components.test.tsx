import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const h = vi.hoisted(() => ({
  profile: { value: { id: "p1" } as unknown },
}))

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({ user: null, profile: h.profile.value, isLoading: false, isOnboardingComplete: false, refreshProfile: vi.fn() }),
}))

import { WelcomeHeader } from "@/components/dashboard/welcome-header"
import { JourneyCountdown } from "@/components/dashboard/journey-countdown"
import { DpdpConsentCard } from "@/components/dashboard/dpdp-consent-card"
import { InfoCard } from "@/components/dashboard/info-card"
import { KeyContacts } from "@/components/dashboard/key-contacts"
import {
  isSafeExternalConsentUrl,
  navigateToExternalConsent,
  resolveConsentOnwardUrl,
} from "@/lib/utils/dpdp-consent"

beforeEach(() => {
  h.profile.value = { id: "p1" }
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("welcome header (characterization)", () => {
  // Spec: CAND-04-A3.2E (docs/spec/clauses/04-dashboard.md#cand-04-a3-2e)
  // Characterization: pins current behaviour, not endorsed.
  it("switches the time-of-day greeting exactly at hour 12 and hour 17 of the local clock", () => {
    const greetingAt = (hour: number, minute: number) => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 0, 15, hour, minute, 0))
      const view = render(<WelcomeHeader name="Test" />)
      const text = screen.getByRole("heading", { level: 1 }).textContent ?? ""
      view.unmount()
      vi.useRealTimers()
      return text
    }
    expect(greetingAt(0, 0)).toContain("Good morning")
    expect(greetingAt(11, 59)).toContain("Good morning")
    expect(greetingAt(12, 0)).toContain("Good afternoon")
    expect(greetingAt(16, 59)).toContain("Good afternoon")
    expect(greetingAt(17, 0)).toContain("Good evening")
    expect(greetingAt(23, 59)).toContain("Good evening")
  })

  // Spec: CAND-04-A3.3B (docs/spec/clauses/04-dashboard.md#cand-04-a3-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("hides the Profile Active badge when the auth context has no profile", () => {
    h.profile.value = null
    render(<WelcomeHeader name="Test" greeting="Hello" />)
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Hello, Test!")
    expect(screen.queryByText("Profile Active")).toBeNull()
  })

  // Spec: CAND-04-A3.1D (docs/spec/clauses/04-dashboard.md#cand-04-a3-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("takes the first name before the first single space, so a leading space gives the whole name back", () => {
    const heading = (name?: string) => {
      const view = render(<WelcomeHeader name={name} greeting="Hi" />)
      const text = screen.getByRole("heading", { level: 1 }).textContent ?? ""
      view.unmount()
      return text
    }
    expect(heading("Ada Lovelace Byron")).toContain("Hi, Ada!")
    expect(heading(undefined)).toContain("Hi, User!")
    expect(heading("")).toContain("Hi, User!")
    expect(heading(" Ada Lovelace")).toContain("Hi,  Ada Lovelace!")
  })
})

describe("journey countdown (characterization)", () => {
  // Spec: CAND-04-A3.4E (docs/spec/clauses/04-dashboard.md#cand-04-a3-4e)
  // Characterization: pins current behaviour, not endorsed.
  it("counts calendar days on the local clock, ignores the time of day and clamps past dates to 0", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 12, 23, 59, 0))
    const text = (iso: string) => {
      const view = render(<JourneyCountdown joiningDate={iso} />)
      const out = view.container.textContent
      view.unmount()
      return out
    }
    expect(text("2026-04-13T00:01:00")).toBe("In 1 Day")
    expect(text("2026-04-12T23:00:00")).toBe("In 0 Days")
    expect(text("2026-04-22T08:00:00")).toBe("In 10 Days")
    expect(text("2025-01-01T08:00:00")).toBe("In 0 Days")
  })

  // Spec: CAND-04-A3.4F (docs/spec/clauses/04-dashboard.md#cand-04-a3-4f)
  // Characterization: pins current behaviour, not endorsed.
  it("renders In NaN Days for an unparseable joining date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 12, 9, 0, 0))
    const view = render(<JourneyCountdown joiningDate="not-a-date" />)
    expect(view.container.textContent).toBe("In NaN Days")
  })
})

describe("consent card and consent helpers (characterization)", () => {
  // Spec: CAND-04-A5.2A (docs/spec/clauses/04-dashboard.md#cand-04-a5-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("uses a protocol-relative consent URL as the in-app link because it starts with a slash", () => {
    render(<DpdpConsentCard consentUrl="//other.example.invalid/consent" appl="cand@example.invalid" />)
    const link = screen.getByRole("link", { name: /Go to Consent Form/i })
    expect(link.getAttribute("href")).toBe("//other.example.invalid/consent")
  })

  // Spec: CAND-04-A5.2B (docs/spec/clauses/04-dashboard.md#cand-04-a5-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("reads External Portal mode ignoring case and surrounding spaces, and words the button by mode only for a safe absolute URL", () => {
    const label = (props: Parameters<typeof DpdpConsentCard>[0]) => {
      const view = render(<DpdpConsentCard {...props} />)
      const link = screen.getByRole("link")
      const out = { text: link.textContent, href: link.getAttribute("href"), rel: link.getAttribute("rel") }
      view.unmount()
      return out
    }
    expect(label({ consentMode: "  external PORTAL ", consentUrl: "https://consent.example.invalid/s/1" })).toEqual({
      text: "Continue to Consent Portal",
      href: "https://consent.example.invalid/s/1",
      rel: "noopener noreferrer",
    })
    expect(label({ consentMode: "Internal Form", consentUrl: "https://consent.example.invalid/s/2" }).text).toBe("Go to Consent Form")
    expect(label({ consentMode: "External Portal", consentUrl: "ftp://consent.example.invalid/s/3", appl: "a@example.invalid" })).toEqual({
      text: "Go to Consent Form",
      href: "/job_offer/consent?appl=a%40example.invalid",
      rel: null,
    })
  })

  // Spec: CAND-04-A5.3K (docs/spec/clauses/04-dashboard.md#cand-04-a5-3k)
  // Characterization: pins current behaviour, not endorsed.
  it("navigateToExternalConsent assigns the location for a safe URL and returns false without assigning for an unsafe one", () => {
    const assign = vi.fn()
    vi.stubGlobal("location", { assign })
    expect(navigateToExternalConsent("https://consent.example.invalid/s/1")).toBe(true)
    expect(assign).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith("https://consent.example.invalid/s/1")
    expect(navigateToExternalConsent("javascript:void(0)")).toBe(false)
    expect(navigateToExternalConsent(undefined)).toBe(false)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  // Spec: CAND-04-A5.3L (docs/spec/clauses/04-dashboard.md#cand-04-a5-3l)
  // Characterization: pins current behaviour, not endorsed.
  it("accepts a URL with surrounding spaces as safe but hands the untrimmed string on", () => {
    const padded = "  https://consent.example.invalid/s/1  "
    expect(isSafeExternalConsentUrl(padded)).toBe(true)
    expect(resolveConsentOnwardUrl(padded, "a@example.invalid")).toEqual({ url: padded, isExternal: true })
    const assign = vi.fn()
    vi.stubGlobal("location", { assign })
    expect(navigateToExternalConsent(padded)).toBe(true)
    expect(assign).toHaveBeenCalledWith(padded)
  })
})

describe("info card and key contacts (characterization)", () => {
  // Spec: CAND-04-A3.5D (docs/spec/clauses/04-dashboard.md#cand-04-a3-5d)
  // Characterization: pins current behaviour, not endorsed.
  it("renders the tag and subtitle only when they are truthy and defaults the tag style to default", () => {
    const { container } = render(<InfoCard icon={<i />} label="L" value="V" tag="" subtitle="" />)
    expect(screen.getByText("L")).toBeTruthy()
    expect(screen.getByText("V")).toBeTruthy()
    expect(container.querySelectorAll("p").length).toBe(2)
    expect(container.querySelector("span")).toBeNull()

    render(<InfoCard icon={<i />} label="L2" value="V2" tag="T" subtitle="S" />)
    expect(screen.getByText("T").className).toContain("bg-muted")
    expect(screen.getByText("S")).toBeTruthy()
  })

  // Spec: CAND-04-A3.6F (docs/spec/clauses/04-dashboard.md#cand-04-a3-6f)
  // Characterization: pins current behaviour, not endorsed.
  it("builds initials from the first and last word of the name and puts the e-mail and phone into unencoded mailto and tel links", () => {
    render(
      <KeyContacts
        contacts={[
          { name: "  Ada   Byron Lovelace ", email: "a+b@example.invalid", phone: "+1 555 0100" },
          { name: "x" },
        ]}
      />,
    )
    expect(screen.getByText("AL")).toBeTruthy()
    expect(screen.getByText("X")).toBeTruthy()
    expect(screen.getByRole("link", { name: /^Email/ }).getAttribute("href")).toBe("mailto:a+b@example.invalid")
    expect(screen.getByRole("link", { name: /^Call/ }).getAttribute("href")).toBe("tel:+1 555 0100")
  })
})
