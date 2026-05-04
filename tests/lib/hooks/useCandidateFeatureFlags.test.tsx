import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCandidateFeatureFlags } from "@/lib/hooks/useCandidateFeatureFlags";
import { featureFlagsService } from "@/lib/services/feature-flags";
import React from "react";

// Mock featureFlagsService
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

describe("useCandidateFeatureFlags Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches feature flags correctly", async () => {
    const mockFlags = { "new-feature": 1, "old-feature": 0 };
    (featureFlagsService.getFeatureFlags as any).mockResolvedValue(mockFlags);

    const { result } = renderHook(() => useCandidateFeatureFlags(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFlags);
    expect(featureFlagsService.getFeatureFlags).toHaveBeenCalled();
  });

  it("handles error when fetching feature flags", async () => {
    (featureFlagsService.getFeatureFlags as any).mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => useCandidateFeatureFlags(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
