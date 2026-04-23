import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/(portal)/dashboard/page";
import { useAuth } from "@/lib/contexts/auth-context";
import { useDashboard } from "@/lib/hooks/useDashboard";

// Mock dependencies
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/hooks/useDashboard", () => ({
  useDashboard: vi.fn(),
}));

// Create a stable mock for the supabase chain
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn((_table?: string) => ({ select: mockSelect }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

// Mock child components
vi.mock("@/components/dashboard/welcome-header", () => ({
  WelcomeHeader: ({ name, greeting }: any) => <div data-testid="welcome-header">{greeting}, {name}</div>,
}));

vi.mock("@/components/dashboard/onboarding-snapshot", () => ({
  OnboardingSnapshot: ({ completedSteps, totalSteps }: any) => (
    <div data-testid="onboarding-snapshot">Progress: {completedSteps}/{totalSteps}</div>
  ),
}));

vi.mock("@/components/dashboard/info-card", () => ({
  InfoCard: ({ label, value, subtitle, tag }: any) => (
    <div data-testid="info-card">
      <div data-testid="card-label">{label}</div>
      <div data-testid="card-value">{value}</div>
      <div data-testid="card-subtitle">{subtitle}</div>
      <div data-testid="card-tag">{tag}</div>
    </div>
  ),
}));

vi.mock("@/components/dashboard/key-contacts", () => ({
  KeyContacts: ({ contacts }: any) => (
    <div data-testid="key-contacts">
      {contacts.map((c: any) => <div key={c.name}>{c.name} - {c.role}</div>)}
    </div>
  ),
}));

vi.mock("@/components/dashboard/journey-countdown", () => ({
  JourneyCountdown: () => <div data-testid="journey-countdown">Countdown</div>,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to a pending promise to test loading state if needed
    mockSingle.mockReturnValue(new Promise(() => { }));
  });

  it("renders loading state initially", () => {
    (useAuth as any).mockReturnValue({ user: { id: "123" }, profile: null });
    (useDashboard as any).mockReturnValue({ data: null, isLoading: true });

    render(<DashboardPage />);

    expect(screen.getByText("Loading dashboard...")).toBeTruthy();
  });

  it("renders mock data when user is not logged in", async () => {
    (useAuth as any).mockReturnValue({ user: null, profile: null });
    (useDashboard as any).mockReturnValue({ data: null, isLoading: false });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("welcome-header")).toHaveTextContent("Welcome back, User");
      expect(screen.getByTestId("onboarding-snapshot")).toHaveTextContent("Progress: 8/8");
    });
  });

  it("fetches and displays onboarding data from Supabase for logged-in user", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = { full_name: "John Doe" };
    const mockOnboarding = { completed_steps: ["Step 1", "Step 2"] };

    (useAuth as any).mockReturnValue({ user: mockUser, profile: mockProfile });
    (useDashboard as any).mockReturnValue({
      data: {
        data: {
          designation: "Senior Dev",
          department: "Engineering",
          job_type: "Permanent"
        }
      },
      isLoading: false
    });

    mockSingle.mockResolvedValue({
      data: mockOnboarding,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("welcome-header")).toHaveTextContent("Welcome back, John Doe");
      expect(screen.getByTestId("onboarding-snapshot")).toHaveTextContent("Progress: 2/8");

      const cards = screen.getAllByTestId("info-card");
      const roleCard = cards[2];
      expect(roleCard).toHaveTextContent("Senior Dev");
      expect(roleCard).toHaveTextContent("Engineering");
      expect(roleCard).toHaveTextContent("Permanent");
    });
  });

  it("falls back to mock data if Supabase fetch fails", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    (useAuth as any).mockReturnValue({ user: mockUser, profile: null });
    (useDashboard as any).mockReturnValue({ data: null, isLoading: false });

    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Error fetching" },
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("onboarding-snapshot")).toHaveTextContent("Progress: 8/8");
    });
  });
});
