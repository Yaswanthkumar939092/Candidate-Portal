import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCompanyLogo } from "@/lib/hooks/useCompanyLogo";
import { jobOfferService } from "@/lib/services/jobOffer";

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

describe("useCompanyLogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches the company logo when enabled", async () => {
    const mockLogo = { logo_url: "/files/company-logo.png" };
    vi.mocked(jobOfferService.getCompanyLogo).mockResolvedValue(mockLogo);

    const { result } = renderHook(() => useCompanyLogo(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockLogo);
    expect(jobOfferService.getCompanyLogo).toHaveBeenCalledTimes(1);
  });

  it("does not fetch the company logo when disabled", async () => {
    const { result } = renderHook(() => useCompanyLogo(false), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(jobOfferService.getCompanyLogo).not.toHaveBeenCalled();
  });
});
