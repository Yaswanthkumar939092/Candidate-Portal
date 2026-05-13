import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCandidateFeatureFlags } from "@/lib/hooks/useCandidateFeatureFlags";
import { featureFlagsService } from "@/lib/services/feature-flags";

vi.mock("@/lib/services/feature-flags", () => ({
  featureFlagsService: {
    getFeatureFlags: vi.fn(),
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

describe("useCandidateFeatureFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches candidate feature flags", async () => {
    const mockFlags = {
      candidate_dashboard: 1 as const,
      action_center: 0 as const,
    };

    vi.mocked(featureFlagsService.getFeatureFlags).mockResolvedValue(mockFlags);

    const { result } = renderHook(() => useCandidateFeatureFlags(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockFlags);
    expect(featureFlagsService.getFeatureFlags).toHaveBeenCalledTimes(1);
  });
});
