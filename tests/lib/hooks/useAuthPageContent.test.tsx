import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthPageContent } from "@/lib/hooks/useAuthPageContent";
import { authPageContentService } from "@/lib/services/auth-page-content";

vi.mock("@/lib/services/auth-page-content", () => ({
  authPageContentService: {
    getAuthPageContent: vi.fn(),
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

describe("useAuthPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches auth page content", async () => {
    const mockContent = {
      logo: "/files/logo.png",
      login: { heading: "Welcome back" },
      signup: { heading: "Join us" },
    };

    vi.mocked(authPageContentService.getAuthPageContent).mockResolvedValue(mockContent);

    const { result } = renderHook(() => useAuthPageContent(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockContent);
    expect(authPageContentService.getAuthPageContent).toHaveBeenCalledTimes(1);
  });

  it("surfaces an error when the request fails", async () => {
    vi.mocked(authPageContentService.getAuthPageContent).mockRejectedValue(
      new Error("Not found"),
    );

    const { result } = renderHook(() => useAuthPageContent(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });
});
