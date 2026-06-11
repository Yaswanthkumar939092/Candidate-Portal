import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOnboardingSubmit } from "@/lib/hooks/useOnboardingMutation";
import { candidateOnboardingService } from "@/lib/services/candidate-onboarding";

vi.mock("@/lib/services/candidate-onboarding", () => ({
  candidateOnboardingService: {
    submitOnboarding: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useOnboardingSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("submits onboarding step data with the user email", async () => {
    const stepData = {
      personal_details: {
        first_name: "Ava",
        last_name: "Smith",
      },
      joining_details: {
        date_of_joining: "2026-05-01",
      },
    };

    vi.mocked(candidateOnboardingService.submitOnboarding).mockResolvedValue({
      success: true,
      message: "Saved successfully",
    });

    const { result } = renderHook(() => useOnboardingSubmit(), { wrapper });

    await result.current.mutateAsync({
      stepData,
      userEmail: "ava@example.com",
      action: "save",
    });

    expect(candidateOnboardingService.submitOnboarding).toHaveBeenCalledWith(
      stepData,
      "ava@example.com",
      "save"
    );
  });
});
