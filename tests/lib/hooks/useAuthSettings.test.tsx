import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthSettings } from "@/lib/hooks/useAuthSettings";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: {
    getAuthSettings: vi.fn(),
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

describe("useAuthSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("fetches auth settings data", async () => {
    const mockSettings = {
      enabled: 1,
      allow_password_login: 1,
      allow_email_otp_login: 0,
      allow_signup: 1,
      signup_requires_otp_verification: 1,
      enable_email_otp: 1,
      enable_mobile_otp: 0,
      mobile_delivery_mode: "Disabled",
      enable_email_signup: 1,
    };

    vi.mocked(auth.getAuthSettings).mockResolvedValue(mockSettings as any);

    const { result } = renderHook(() => useAuthSettings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSettings);
    expect(auth.getAuthSettings).toHaveBeenCalledTimes(1);
  });
});
