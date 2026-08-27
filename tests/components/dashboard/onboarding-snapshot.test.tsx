import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OnboardingSnapshot } from "@/components/dashboard/onboarding-snapshot";
import { DashboardData } from "@/types/dashboard";

// Mock the auth context
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    profile: { id: "1", full_name: "Test User" },
    isLoading: false,
    isOnboardingComplete: false,
    refreshProfile: vi.fn(),
  }),
}));

// Mock current user hook
vi.mock("@/lib/hooks/useUser", () => ({
  useCurrentUser: () => ({
    userEmail: "test@example.com",
    isLoading: false,
  }),
}));

// Mock job offer pdf hook
vi.mock("@/lib/hooks/useJobOffer", () => ({
  useJobOfferPdf: () => ({
    pdfUrl: "mock-pdf-url",
    isLoading: false,
  }),
  useJobOfferSummary: () => ({
    data: null,
    isLoading: false,
  }),
  useJobOfferLetters: () => ({
    data: null,
    isLoading: false,
  }),
}));

const DEFAULT_MOCK_PAYLOAD: DashboardData = {
  name: "Test User",
  date_of_joining: "2026-01-01",
  designation: "Developer",
  department: "IT",
  work_location: "Bangalore",
  work_location_details: {
    name: "",
    branch: "",
    custom_location_code: "",
    custom_address: null,
    custom_location_area: null,
    custom_office_area: null,
    custom_office_city: null,
    custom_city: null,
    custom_state: null,
    custom_country: null,
    custom_pin_code: null,
    custom_office_email: null,
    custom_mobile_no: null,
    custom_telephone_no: null,
    custom_google_map_link: null,
    custom_location_url: null
  },
  key_contacts: []
};

describe("OnboardingSnapshot", () => {
  it("renders correctly with in-progress status", async () => {
    render(
      <OnboardingSnapshot 
        completedSteps={3} 
        totalSteps={8} 
        dashboardPayload={{ ...DEFAULT_MOCK_PAYLOAD, onboarding_stage: "ONBOARDING IN PROGRESS" }} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText("ONBOARDING IN PROGRESS")).toBeTruthy();
      expect(screen.getByText("3 of 8 steps completed")).toBeTruthy();
    });
  });

  it("renders correctly with completed status", async () => {
    render(
      <OnboardingSnapshot 
        completedSteps={8} 
        totalSteps={8} 
        joiningDate="2026-09-08T00:00:00Z" 
        dashboardPayload={{ 
          ...DEFAULT_MOCK_PAYLOAD,
          onboarding_stage: "ONBOARDING COMPLETE",
          date_of_joining: "2026-09-08T00:00:00Z",
          form_completion: { percentage: 100, total_fields: 10, filled_fields: 10 }
        }}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText("ONBOARDING COMPLETE")).toBeTruthy();
      expect(screen.getByText("You are ready to join us on September 8th!")).toBeTruthy();
      expect(screen.getByText("Ready")).toBeTruthy();
    });
  });

  it("renders explicit percentage from payload correctly", async () => {
    render(
      <OnboardingSnapshot 
        completedSteps={2} 
        totalSteps={8} 
        dashboardPayload={{ ...DEFAULT_MOCK_PAYLOAD, form_completion: { percentage: 25, total_fields: 100, filled_fields: 25 } }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText("25%")).toBeTruthy();
    });
  });

  it("renders correctly with default totalSteps", async () => {
    render(
      <OnboardingSnapshot 
        completedSteps={4} 
        dashboardPayload={{ ...DEFAULT_MOCK_PAYLOAD, form_completion: { percentage: 50, total_fields: 10, filled_fields: 5 } }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText("4 of 8 steps completed")).toBeTruthy();
      expect(screen.getByText("50%")).toBeTruthy();
    });
  });

  it("allows downloading and opening PDF offer letter", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["mock-pdf"], { type: "application/pdf" }))
    });
    global.fetch = fetchMock;

    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;
    global.URL.createObjectURL = vi.fn().mockReturnValue("mock-object-url");
    global.URL.revokeObjectURL = vi.fn();

    const originalOpen = window.open;
    const openMock = vi.fn();
    window.open = openMock;

    render(
      <OnboardingSnapshot 
        completedSteps={8} 
        totalSteps={8} 
        dashboardPayload={{ ...DEFAULT_MOCK_PAYLOAD, onboarding_stage: "ONBOARDING COMPLETE" }} 
      />
    );

    // There are 2 buttons, one for mobile, one for desktop
    const buttons = await screen.findAllByRole("button", { name: /Preview \/ Download Offer/i });
    expect(buttons).toHaveLength(2);

    const { fireEvent } = await import("@testing-library/react");

    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("mock-pdf-url", { credentials: "include" });
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    fireEvent.click(buttons[1]);
    expect(openMock).toHaveBeenCalledWith("mock-pdf-url", "_blank", "noopener,noreferrer");

    global.fetch = originalFetch;
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    window.open = originalOpen;
  });

  it("handles fetch error during pdf download", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network fail"));

    render(
      <OnboardingSnapshot 
        completedSteps={8} 
        totalSteps={8} 
        dashboardPayload={{ ...DEFAULT_MOCK_PAYLOAD, onboarding_stage: "ONBOARDING COMPLETE" }} 
      />
    );

    const { fireEvent } = await import("@testing-library/react");
    const buttons = await screen.findAllByRole("button", { name: /Preview \/ Download Offer/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    global.fetch = originalFetch;
  });
});
