import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { dashboardService } from "@/lib/services/dashboard";
import type { DashboardData } from "@/types/dashboard";

vi.mock("@/lib/services/dashboard", () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches dashboard data for the provided email", async () => {
    const mockDashboard: DashboardData = {
      name: "Ava Smith",
      date_of_joining: "2026-05-01",
      designation: "Software Engineer",
      department: "Engineering",
      work_location: "Noida",
      work_location_details: {
        name: "Noida Office",
        branch: "Sector 62",
        custom_location_code: "NOI",
        custom_address: "KLJ Noida One",
        custom_location_area: null,
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
      key_contacts: [],
    };

    vi.mocked(dashboardService.getDashboardData).mockResolvedValue(mockDashboard);

    const { result } = renderHook(() => useDashboard("ava@example.com"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDashboard);
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith("ava@example.com");
  });

  it("does not fetch dashboard data when email is missing", async () => {
    const { result } = renderHook(() => useDashboard(undefined), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(dashboardService.getDashboardData).not.toHaveBeenCalled();
  });
});
