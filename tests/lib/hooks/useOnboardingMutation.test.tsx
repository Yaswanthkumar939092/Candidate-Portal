import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOnboardingSubmit } from "@/lib/hooks/useOnboardingMutation";
import { candidateOnboardingService } from "@/lib/services/candidate-onboarding";
import React from "react";

// Mock candidateOnboardingService
vi.mock("@/lib/services/candidate-onboarding", () => ({
  candidateOnboardingService: {
    submitOnboarding: vi.fn(),
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

describe("useOnboardingSubmit Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("submits onboarding data successfully", async () => {
    const mockResponse = { success: true };
    (candidateOnboardingService.submitOnboarding as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOnboardingSubmit(), { wrapper });

    const stepData = { personal: { firstName: "John" } };
    const userEmail = "test@example.com";
    result.current.mutate({ stepData, userEmail });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(candidateOnboardingService.submitOnboarding).toHaveBeenCalledWith(stepData, userEmail);
  });

  it("handles submission error", async () => {
    const mockError = new Error("Submission failed");
    (candidateOnboardingService.submitOnboarding as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useOnboardingSubmit(), { wrapper });

    result.current.mutate({ stepData: {}, userEmail: "test@example.com" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});
