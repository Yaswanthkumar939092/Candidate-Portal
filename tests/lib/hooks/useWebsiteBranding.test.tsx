import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWebsiteBranding } from "@/lib/hooks/useWebsiteBranding";
import { websiteBrandingService } from "@/lib/services/website-branding";
import React from "react";

// Mock websiteBrandingService
vi.mock("@/lib/services/website-branding", () => ({
  websiteBrandingService: {
    getWebsiteBranding: vi.fn(),
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

describe("useWebsiteBranding Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches website branding correctly", async () => {
    const mockBranding = { logo: "logo.png", banner: "banner.png" };
    (websiteBrandingService.getWebsiteBranding as any).mockResolvedValue(mockBranding);

    const { result } = renderHook(() => useWebsiteBranding(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBranding);
    expect(websiteBrandingService.getWebsiteBranding).toHaveBeenCalled();
  });
});
