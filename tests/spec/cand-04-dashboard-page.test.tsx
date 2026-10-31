import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const h = vi.hoisted(() => ({
  auth: { value: {} as unknown },
  dash: { value: {} as unknown },
  refetch: vi.fn(),
  contacts: vi.fn(),
}))

vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: () => h.auth.value }))
vi.mock("@/lib/hooks/useDashboard", () => ({ useDashboard: () => h.dash.value }))
vi.mock("@/components/dashboard/welcome-header", () => ({
  WelcomeHeader: ({ name, greeting }: { name: string; greeting: string }) => (
    <div data-testid="welcome-header">{greeting}|{name}</div>
  ),
}))
vi.mock("@/components/dashboard/onboarding-snapshot", () => ({
  OnboardingSnapshot: ({ completedSteps, totalSteps }: { completedSteps: number; totalSteps: number }) => (
    <div data-testid="onboarding-snapshot">{completedSteps}/{totalSteps}</div>
  ),
}))
vi.mock("@/components/dashboard/info-card", () => ({
  InfoCard: ({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) => (
    <div data-testid="info-card">
      <span data-testid={`label-${label}`}>{label}</span>
      <span data-testid={`value-${label}`}>{value}</span>
      <span data-testid={`subtitle-${label}`}>{subtitle}</span>
    </div>
  ),
}))
vi.mock("@/components/dashboard/key-contacts", () => ({
  KeyContacts: (props: { contacts: unknown[] }) => {
    h.contacts(props.contacts)
    return <div data-testid="key-contacts" />
  },
}))
vi.mock("@/components/dashboard/journey-countdown", () => ({ JourneyCountdown: () => null }))
vi.mock("@/components/home/home-promo", () => ({
  HomePromo: ({ fallback }: { fallback?: React.ReactNode }) => (
    <div data-testid="home-promo">{fallback ?? "no-fallback"}</div>
  ),
}))

import DashboardPage from "@/app/(portal)/dashboard/page"

const payload = (over: Record<string, unknown> = {}) => ({
  name: "Backend Name",
  date_of_joining: "2026-09-08T12:00:00",
  designation: "Engineer",
  department: "Platform",
  work_location: "Site One",
  work_location_details: {
    custom_address: "1 Test Road",
    custom_office_city: null,
    custom_state: null,
    custom_country: null,
    custom_google_map_link: null,
  },
  key_contacts: [],
  onboarding_status: true,
  ...over,
})

const query = (over: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: h.refetch,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  h.auth.value = { user: { email: "cand@example.invalid" }, profile: null }
  h.dash.value = query({ data: payload() })
})

describe("dashboard page (characterization)", () => {
  // Spec: CAND-04-A1.1B (docs/spec/clauses/04-dashboard.md#cand-04-a1-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the skeleton, not the missing-email error, while the query is loading without an email", () => {
    h.auth.value = { user: { id: "u1" }, profile: null }
    h.dash.value = query({ isLoading: true })
    const { container } = render(<DashboardPage />)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText(/couldn't identify your account email/)).toBeNull()
    expect(screen.queryByText("Unable to load dashboard")).toBeNull()
  })

  // Spec: CAND-04-A1.3C (docs/spec/clauses/04-dashboard.md#cand-04-a1-3c)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the generic error message when the query reports no error and returns no data", () => {
    h.dash.value = query({ data: undefined, isError: false, error: null })
    render(<DashboardPage />)
    expect(screen.getByText("Unable to load dashboard")).toBeTruthy()
    expect(screen.getByText("Something went wrong while fetching your dashboard data.")).toBeTruthy()
    expect(screen.queryByTestId("onboarding-snapshot")).toBeNull()
  })

  // Spec: CAND-04-A1.4A (docs/spec/clauses/04-dashboard.md#cand-04-a1-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows the consent card instead of the snapshot, cards and contacts when consent is required and explicitly not submitted", () => {
    h.dash.value = query({
      data: payload({ dpdp_consent_required: true, dpdp_consent_submitted: false, dpdp_consent_url: "/job_offer/consent?appl=x" }),
    })
    render(<DashboardPage />)
    expect(screen.getByText("Consent Pending")).toBeTruthy()
    expect(screen.getByRole("link", { name: /Go to Consent Form/i })).toHaveAttribute("href", "/job_offer/consent?appl=x")
    expect(screen.queryByTestId("onboarding-snapshot")).toBeNull()
    expect(screen.queryByTestId("info-card")).toBeNull()
    expect(screen.queryByTestId("key-contacts")).toBeNull()
    expect(screen.getByTestId("home-promo").textContent).toBe("no-fallback")
  })

  // Spec: CAND-04-A1.4B (docs/spec/clauses/04-dashboard.md#cand-04-a1-4b)
  // Characterization: pins current behaviour, not endorsed.
  it("does not show the consent card when submitted is true or missing, or when consent is not required", () => {
    const variants = [
      { dpdp_consent_required: true, dpdp_consent_submitted: true },
      { dpdp_consent_required: true },
      { dpdp_consent_required: false, dpdp_consent_submitted: false },
    ]
    for (const v of variants) {
      h.dash.value = query({ data: payload(v) })
      const view = render(<DashboardPage />)
      expect(screen.queryByText("Consent Pending")).toBeNull()
      expect(screen.getByTestId("onboarding-snapshot")).toBeTruthy()
      view.unmount()
    }
  })

  // Spec: CAND-04-A1.6A (docs/spec/clauses/04-dashboard.md#cand-04-a1-6a)
  // Characterization: pins current behaviour, not endorsed.
  it("names the welcome header from the profile, then the backend name, then User", () => {
    h.auth.value = { user: { email: "cand@example.invalid" }, profile: { full_name: "Profile Name" } }
    const a = render(<DashboardPage />)
    expect(screen.getByTestId("welcome-header").textContent).toBe("Welcome back|Profile Name")
    a.unmount()

    h.auth.value = { user: { email: "cand@example.invalid" }, profile: null }
    const b = render(<DashboardPage />)
    expect(screen.getByTestId("welcome-header").textContent).toBe("Welcome back|Backend Name")
    b.unmount()

    h.auth.value = { user: { email: "cand@example.invalid" }, profile: {} }
    h.dash.value = query({ data: payload({ name: "" }) })
    const c = render(<DashboardPage />)
    expect(screen.getByTestId("welcome-header").textContent).toBe("Welcome back|User")
    c.unmount()

    h.dash.value = query({ isError: true, error: new Error("down") })
    render(<DashboardPage />)
    expect(screen.getByTestId("welcome-header").textContent).toBe("Welcome back|User")
  })

  // Spec: CAND-04-A2.3A (docs/spec/clauses/04-dashboard.md#cand-04-a2-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("formats a parseable joining date as weekday, day, month and year, returns an unparseable value unchanged and shows a leading-space Not available when empty", () => {
    const shown = (date: string) => {
      h.dash.value = query({ data: payload({ date_of_joining: date }) })
      const view = render(<DashboardPage />)
      const text = screen.getByTestId("value-Joining Date").textContent
      view.unmount()
      return text
    }
    expect(shown("2026-09-08T12:00:00")).toBe("Tue, 8 Sep 2026")
    expect(shown("not-a-date")).toBe("not-a-date")
    expect(shown("")).toBe(" Not available")
  })

  // Spec: CAND-04-A2.4A (docs/spec/clauses/04-dashboard.md#cand-04-a2-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("names each key contact by employee name, then name, then role, then e-mail, and passes an empty list when the payload has none", () => {
    h.dash.value = query({
      data: payload({
        key_contacts: [
          { employee_name: "Emp One", name: "n1", role: "r1", email: "e1@example.invalid", phone_number: "100" },
          { employee_name: "", name: "n2", role: "r2", email: "e2@example.invalid", phone_number: "" },
          { employee_name: "", name: "", role: "r3", email: "", phone_number: "300" },
          { employee_name: "", name: "", role: "", email: "e4@example.invalid", phone_number: "" },
        ],
      }),
    })
    const a = render(<DashboardPage />)
    expect(h.contacts).toHaveBeenLastCalledWith([
      { name: "Emp One", role: "r1", email: "e1@example.invalid", phone: "100" },
      { name: "n2", role: "r2", email: "e2@example.invalid", phone: undefined },
      { name: "r3", role: "r3", email: undefined, phone: "300" },
      { name: "e4@example.invalid", role: "", email: "e4@example.invalid", phone: undefined },
    ])
    a.unmount()

    h.dash.value = query({ data: payload({ key_contacts: undefined }) })
    render(<DashboardPage />)
    expect(h.contacts).toHaveBeenLastCalledWith([])
  })

  // Spec: CAND-04-A2.2D (docs/spec/clauses/04-dashboard.md#cand-04-a2-2d)
  // Characterization: pins current behaviour, not endorsed.
  it("shows Address not available when the payload carries no location details at all", () => {
    h.dash.value = query({ data: payload({ work_location: "", work_location_details: undefined }) })
    render(<DashboardPage />)
    expect(screen.getByTestId("value-Office Location").textContent).toBe("Not available")
    expect(screen.getByTestId("subtitle-Office Location").textContent).toBe("Address not available")
    expect(screen.queryByRole("link", { name: "View on Map" })).toBeNull()
  })
})
