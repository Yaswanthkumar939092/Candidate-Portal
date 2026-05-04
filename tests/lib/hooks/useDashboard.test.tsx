import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { dashboardService } from "@/lib/services/dashboard";
import React from "react";

// Mock dashboardService
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

describe("useDashboard Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches dashboard data correctly when email is provided", async () => {
    const mockData = { jobs: [] };
    (dashboardService.getDashboardData as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboard("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith("test@example.com");
  });

  it("is disabled when email is not provided", () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
