import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCandidateBranding } from "@/lib/hooks/useCandidateBranding";
import { candidateBrandingService } from "@/lib/services/candidate-branding";

vi.mock("@/lib/services/candidate-branding", () => ({
  candidateBrandingService: {
    getCandidateBranding: vi.fn(),
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

describe("useCandidateBranding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches candidate branding data", async () => {
    const mockBranding = {
      title_prefix: "Candidate Portal",
      app_logo: "/files/logo.png",
    };

    vi.mocked(candidateBrandingService.getCandidateBranding).mockResolvedValue(mockBranding);

    const { result } = renderHook(() => useCandidateBranding(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBranding);
    expect(candidateBrandingService.getCandidateBranding).toHaveBeenCalledTimes(1);
  });
});
