import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOnboardingForm } from "@/lib/hooks/useOnboardingForm";
import { candidateOnboardingService } from "@/lib/services/candidate-onboarding";
import React from "react";

// Mock candidateOnboardingService
vi.mock("@/lib/services/candidate-onboarding", () => ({
  candidateOnboardingService: {
    getOnboardingForm: vi.fn(),
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

describe("useOnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  // Spec: CAND-05-A10.1B (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-1b)
  it("fetches onboarding form correctly", async () => {
    const mockForm = {
      boarding_status: "Pending",
      tabs: [],
      applicantId: "test-id",
      status: "draft"
    };
    vi.mocked(candidateOnboardingService.getOnboardingForm).mockResolvedValue(mockForm);

    const { result } = renderHook(() => useOnboardingForm("test@example.com"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockForm);
    expect(candidateOnboardingService.getOnboardingForm).toHaveBeenCalledWith("test@example.com");
  });

  // Spec: CAND-05-A10.1C (docs/spec/clauses/05-onboarding-logic.md#cand-05-a10-1c)
  it("does not fetch if userEmail is missing", () => {
    const { result } = renderHook(() => useOnboardingForm(""), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(candidateOnboardingService.getOnboardingForm).not.toHaveBeenCalled();
  });
});
