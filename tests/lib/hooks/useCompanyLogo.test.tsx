import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCompanyLogo } from "@/lib/hooks/useCompanyLogo";
import { jobOfferService } from "@/lib/services/jobOffer";
import React from "react";

// Mock jobOfferService
vi.mock("@/lib/services/jobOffer", () => ({
  jobOfferService: {
    getCompanyLogo: vi.fn(),
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

describe("useCompanyLogo Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches company logo correctly", async () => {
    const mockLogo = "https://example.com/logo.png";
    (jobOfferService.getCompanyLogo as any).mockResolvedValue(mockLogo);

    const { result } = renderHook(() => useCompanyLogo(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(mockLogo);
    expect(jobOfferService.getCompanyLogo).toHaveBeenCalled();
  });

  it("is disabled when enabled parameter is false", () => {
    const { result } = renderHook(() => useCompanyLogo(false), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
