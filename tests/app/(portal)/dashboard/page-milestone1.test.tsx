import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const useDashboard = vi.fn();
const flag = vi.hoisted(() => ({ enabled: false }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/careers/milestone", () => ({
  get ONBOARDING_DASHBOARD_ENABLED() {
    return flag.enabled;
  },
}));
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({ user: { email: "synth-a@example.invalid" }, profile: { full_name: "Synthetic Ay" } }),
}));
vi.mock("@/lib/hooks/useDashboard", () => ({
  useDashboard: (email?: string) => useDashboard(email),
}));
vi.mock("@/components/home/home-promo", () => ({
  HomePromo: () => <div data-testid="home-promo" />,
}));

import DashboardPage from "@/app/(portal)/dashboard/page";

describe("DashboardPage in milestone 1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("flag off: makes no get_dashboard request and redirects to /open-jobs", () => {
    flag.enabled = false;
    render(<DashboardPage />);
    expect(replace).toHaveBeenCalledWith("/open-jobs");
    const emails = useDashboard.mock.calls.map((c) => c[0]);
    expect(emails.every((e) => e === undefined)).toBe(true);
    expect(screen.queryByTestId("home-promo")).toBeNull();
  });

  it("flag on: old behaviour, queries the dashboard and does not redirect", () => {
    flag.enabled = true;
    render(<DashboardPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(useDashboard).toHaveBeenCalledWith("synth-a@example.invalid");
  });
});
