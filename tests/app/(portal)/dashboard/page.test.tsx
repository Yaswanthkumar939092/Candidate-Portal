import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DashboardPage from "@/app/(portal)/dashboard/page"
import { useAuth } from "@/lib/contexts/auth-context"
import { useDashboard } from "@/lib/hooks/useDashboard"
import type { DashboardData } from "@/types/dashboard"

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}))

vi.mock("@/lib/hooks/useDashboard", () => ({
  useDashboard: vi.fn(),
}))

interface WelcomeHeaderProps {
  name: string;
  greeting: string;
}

vi.mock("@/components/dashboard/welcome-header", () => ({
  WelcomeHeader: ({ name, greeting }: WelcomeHeaderProps) => <div data-testid="welcome-header">{greeting}, {name}</div>,
}))

interface OnboardingSnapshotProps {
  completedSteps: number;
  totalSteps: number;
}

vi.mock("@/components/dashboard/onboarding-snapshot", () => ({
  OnboardingSnapshot: ({ completedSteps, totalSteps }: OnboardingSnapshotProps) => (
    <div data-testid="onboarding-snapshot">Progress: {completedSteps}/{totalSteps}</div>
  ),
}))

interface InfoCardProps {
  label: string;
  value: string;
  subtitle: string;
  tag?: string;
}

vi.mock("@/components/dashboard/info-card", () => ({
  InfoCard: ({ label, value, subtitle, tag }: InfoCardProps) => (
    <div data-testid="info-card">
      <div data-testid="card-label">{label}</div>
      <div data-testid="card-value">{value}</div>
      <div data-testid="card-subtitle">{subtitle}</div>
      <div data-testid="card-tag">{tag}</div>
    </div>
  ),
}))

interface KeyContactsProps {
  contacts: Array<{ name: string; role: string; email?: string; phone?: string }>;
}

const keyContactsMock = vi.fn(({ contacts }: KeyContactsProps) => (
  <div data-testid="key-contacts">
    {contacts.map((c) => (
      <div key={c.name}>
        {c.name} - {c.role} - {c.email ?? "no-email"} - {c.phone ?? "no-phone"}
      </div>
    ))}
  </div>
))

vi.mock("@/components/dashboard/key-contacts", () => ({
  KeyContacts: (props: KeyContactsProps) => keyContactsMock(props),
}))

vi.mock("@/components/dashboard/journey-countdown", () => ({
  JourneyCountdown: () => <div data-testid="journey-countdown">Countdown</div>,
}))

const mockDashboardData: DashboardData = {
  name: "John Doe",
  date_of_joining: "2025-09-08",
  designation: "Senior Dev",
  department: "Engineering",
  work_location: "Noida",
  work_location_details: {
    name: "Noida Office",
    branch: "Sector 62",
    custom_location_code: "NOI",
    custom_address: "KLJ Noida One, First Floor",
    custom_location_area: "Noida, Sector 62",
    custom_office_area: null,
    custom_office_city: "Noida",
    custom_city: null,
    custom_state: "Uttar Pradesh",
    custom_country: "India",
    custom_pin_code: null,
    custom_office_email: null,
    custom_mobile_no: null,
    custom_telephone_no: null,
    custom_google_map_link: null,
    custom_location_url: null,
  },
  key_contacts: [
    {
      name: "HR Buddy",
      employee: "EMP-001",
      role: "HR Buddy",
      email: "hr@example.com",
      phone_number: "+91-9876543210",
      idx: 1,
      employee_name: "Pallavi Mahar",
    },
  ],
  onboarding_status: true,
}

function mockUseDashboardState(overrides?: Partial<ReturnType<typeof useDashboard>>) {
  vi.mocked(useDashboard).mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useDashboard>)
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders skeleton loading state initially", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: "123", email: "test@example.com" }, profile: null } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({ isLoading: true })

    const { container } = render(<DashboardPage />)

    expect(screen.queryByText("Loading dashboard...")).toBeNull()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it("renders dashboard data from useDashboard", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: { full_name: "John Doe" },
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      data: mockDashboardData,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId("welcome-header")).toHaveTextContent("Welcome back, John Doe")
      expect(screen.getByTestId("onboarding-snapshot")).toHaveTextContent("Progress: 8/8")
      expect(screen.getByTestId("key-contacts")).toHaveTextContent("Pallavi Mahar - HR Buddy - hr@example.com - +91-9876543210")
    })

    const cards = screen.getAllByTestId("info-card")
    expect(cards[0]).toHaveTextContent("Mon, 8 Sep 2025")
    expect(cards[1]).toHaveTextContent("Noida")
    expect(cards[1]).toHaveTextContent("KLJ Noida One, First Floor")
    expect(cards[2]).toHaveTextContent("Senior Dev")
    expect(cards[2]).toHaveTextContent("Engineering")
  })

  it("renders the view on map link when custom_google_map_link is present", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      data: {
        ...mockDashboardData,
        work_location_details: {
          ...mockDashboardData.work_location_details,
          custom_google_map_link: "https://maps.google.com/?q=noida-office",
        },
      },
    })

    render(<DashboardPage />)

    const mapLink = await screen.findByRole("link", { name: "View on Map" })
    expect(mapLink).toHaveAttribute("href", "https://maps.google.com/?q=noida-office")
  })

  it("falls back to derived address, backend name, and default role labels when fields are missing", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      data: {
        ...mockDashboardData,
        name: "",
        date_of_joining: "",
        designation: "",
        department: "",
        work_location: "",
        work_location_details: {
          ...mockDashboardData.work_location_details,
          custom_address: null,
          custom_office_city: "Noida",
          custom_state: "Uttar Pradesh",
          custom_country: "India",
          custom_google_map_link: null,
        },
        key_contacts: [
          {
            ...mockDashboardData.key_contacts[0],
            employee_name: "",
            name: "Fallback Contact",
          },
        ],
      },
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId("welcome-header")).toHaveTextContent("Welcome back, User")
      expect(screen.getByTestId("onboarding-snapshot")).toHaveTextContent("Progress: 0/8")
      expect(screen.getByTestId("key-contacts")).toHaveTextContent("Fallback Contact - HR Buddy - hr@example.com - +91-9876543210")
    })

    const cards = screen.getAllByTestId("info-card")
    expect(cards[1]).toHaveTextContent("Not available")
    expect(cards[1]).toHaveTextContent("Noida, Uttar Pradesh, India")
    expect(screen.queryByRole("link", { name: "View on Map" })).toBeNull()
    expect(cards[2]).toHaveTextContent("Not assigned")
    expect(cards[2]).toHaveTextContent("Department not available")
  })

  it("maps missing contact details to undefined and prefers a custom office address", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      data: {
        ...mockDashboardData,
        work_location_details: {
          ...mockDashboardData.work_location_details,
          custom_address: "Tower A, Floor 3",
          custom_office_city: "",
          custom_state: "",
          custom_country: "",
        },
        key_contacts: [
          {
            ...mockDashboardData.key_contacts[0],
            email: "",
            phone_number: "",
          },
        ],
      },
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId("key-contacts")).toHaveTextContent("Pallavi Mahar - HR Buddy - no-email - no-phone")
    })

    const cards = screen.getAllByTestId("info-card")
    expect(cards[1]).toHaveTextContent("Tower A, Floor 3")
  })

  it("falls back to 'Address not available' when no office address details exist", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      data: {
        ...mockDashboardData,
        work_location_details: {
          ...mockDashboardData.work_location_details,
          custom_address: "",
          custom_office_city: "",
          custom_state: "",
          custom_country: "",
        },
      },
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getAllByTestId("info-card")[1]).toHaveTextContent("Address not available")
    })
  })

  it("renders the missing-email error state and allows retry", async () => {
    const refetch = vi.fn()

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({ refetch })

    render(<DashboardPage />)

    expect(screen.getByText(/We couldn't identify your account email for\s+dashboard yet/)).toBeTruthy()

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it("renders an error state and retries the query", async () => {
    const refetch = vi.fn()

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      isError: true,
      error: new Error("Dashboard request failed"),
      refetch,
    })

    render(<DashboardPage />)

    expect(screen.getByText("Unable to load dashboard")).toBeTruthy()
    expect(screen.getByText("Dashboard request failed")).toBeTruthy()

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it("renders the generic error message when the query error is not an Error instance", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123", email: "test@example.com" },
      profile: null,
    } as unknown as ReturnType<typeof useAuth>)
    mockUseDashboardState({
      isError: true,
      error: "Unknown failure" as unknown as Error,
    })

    render(<DashboardPage />)

    expect(screen.getByText("Something went wrong while fetching your dashboard data.")).toBeTruthy()
  })
})
