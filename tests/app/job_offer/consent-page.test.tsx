import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import DpdpConsentPage from "@/app/(portal)/job_offer/consent/page";
import { toast } from "sonner";
import React from "react";

// Mocks
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "appl") return "test@example.com";
      if (key === "token") return "my-token";
      return null;
    },
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockConsentData = {
  enabled: true,
  enforce_before_onboarding: 1,
  header: {
    title: "DPDP Consent Form",
    subtitle: "Digital Personal Data Protection Act compliance requirements",
  },
  intro_content: "Intro content",
  information: [
    {
      "Information Collected": "KYC",
      "Purpose of Collection and Use": "Verification",
    },
  ],
  closing_content: "Closing content",
  declaration: {
    heading: "Employee Declaration and Consent",
    require_all_mandatory: 1,
    statements: [
      {
        consent_key: "accuracy",
        statement: "I voluntarily consent to the collection, processing, and storage",
        fieldtype: "Check",
        is_mandatory: 1,
      },
    ],
  },
  acknowledgement: [
    {
      fieldname: "employee_name",
      label: "Employee Name",
      fieldtype: "Data",
      is_mandatory: 1,
    },
  ],
  applicant: {
    name: "Deepak",
    email: "test@example.com",
  },
};

const mockUseConsentForm = vi.fn().mockReturnValue({
  data: mockConsentData,
  isLoading: false,
});
const mockSubmitConsentMutate = vi.fn().mockResolvedValue({});
const mockUseSubmitConsent = vi.fn().mockReturnValue({
  mutateAsync: mockSubmitConsentMutate,
});
const mockStartConsentSession = vi.fn();
const mockUseStartConsentSession = vi.fn(() => ({
  mutateAsync: mockStartConsentSession,
}));

vi.mock("@/lib/hooks/useJobOffer", () => ({
  useConsentForm: (...args: unknown[]) => mockUseConsentForm(...args),
  useSubmitConsent: () => mockUseSubmitConsent(),
  useStartConsentSession: () => mockUseStartConsentSession(),
}));

describe("DpdpConsentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the consent page correctly", () => {
    render(<DpdpConsentPage />);

    expect(screen.getByText("DPDP Consent Form")).toBeTruthy();
    expect(
      screen.getByText(/Digital Personal Data Protection Act compliance requirements/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/I voluntarily consent to the collection, processing, and storage/i)
    ).toBeTruthy();
    expect(mockUseConsentForm).toHaveBeenCalledWith("test@example.com", "my-token");
  });

  it("navigates back to the job offer page when clicking back button", () => {
    render(<DpdpConsentPage />);

    const backBtn = screen.getByTitle("Go back");
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith("/job_offer?appl=test%40example.com&token=my-token");
  });

  it("disables submit button by default and enables it when checkbox is checked", () => {
    render(<DpdpConsentPage />);

    const submitBtn = screen.getByRole("button", { name: /Submit Consent/i });
    expect(submitBtn).toBeDisabled();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(submitBtn).not.toBeDisabled();
  });

  it("submits consent successfully and renders success screen", async () => {
    render(<DpdpConsentPage />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /Submit Consent/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Submitting...")).toBeTruthy();

    await waitFor(() => {
      expect(mockSubmitConsentMutate).toHaveBeenCalledWith({
        appl: "test@example.com",
        token: "my-token",
        responses: ["accuracy"],
        employee_name: "Deepak",
      });
      expect(toast.success).toHaveBeenCalledWith("DPDP Consent submitted successfully!");
    });

    expect(screen.getByText("Consent Submitted")).toBeTruthy();
    
    expect(screen.getByText(/Redirecting to Onboarding in 3 seconds\.\.\./i)).toBeTruthy();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding?appl=test%40example.com&token=my-token");
    }, { timeout: 4000 });
  });

  it("renders success screen immediately if already consented", async () => {
    mockUseConsentForm.mockReturnValueOnce({
      data: {
        ...mockConsentData,
        already_consented: true,
      },
      isLoading: false,
    });

    render(<DpdpConsentPage />);

    expect(screen.getByText("Consent Submitted")).toBeTruthy();
    expect(screen.getByText(/Redirecting to Onboarding in 3 seconds\.\.\./i)).toBeTruthy();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding?appl=test%40example.com&token=my-token");
    }, { timeout: 4000 });
  });

  describe("External Portal mode", () => {
    let assign: ReturnType<typeof vi.fn>;
    let originalLocation: Location;

    const externalPayload = {
      enabled: true,
      consent_mode: "External Portal",
      consent_url: "https://l.hffc.in/HFFCIN/gqsPk",
      already_consented: false,
    };

    beforeEach(() => {
      assign = vi.fn();
      originalLocation = window.location;
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...originalLocation, assign },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
      // Leave the shared form mock as the other tests expect to find it.
      mockUseConsentForm.mockReturnValue({
        data: mockConsentData,
        isLoading: false,
      });
    });

    it("hands off to the consent portal instead of rendering an empty form", async () => {
      mockUseConsentForm.mockReturnValue({
        data: externalPayload,
        isLoading: false,
      });

      render(<DpdpConsentPage />);

      await waitFor(() => {
        expect(assign).toHaveBeenCalledWith("https://l.hffc.in/HFFCIN/gqsPk");
      });
      expect(screen.getByText(/Taking you to the consent portal/i)).toBeInTheDocument();
      // The in-app declaration must not render in external mode.
      expect(screen.queryByRole("button", { name: /Submit Consent/i })).toBeNull();
    });

    it("re-issues a link when the backend sent none", async () => {
      mockUseConsentForm.mockReturnValue({
        data: { ...externalPayload, consent_url: null },
        isLoading: false,
      });
      mockStartConsentSession.mockResolvedValue({
        already_consented: false,
        consent_url: "https://l.hffc.in/HFFCIN/reissued",
        reused: true,
      });

      render(<DpdpConsentPage />);

      await waitFor(() => {
        expect(mockStartConsentSession).toHaveBeenCalledWith({
          appl: "test@example.com",
          token: "my-token",
        });
      });
      await waitFor(() => {
        expect(assign).toHaveBeenCalledWith("https://l.hffc.in/HFFCIN/reissued");
      });
    });

    it("shows a retry when the portal cannot be reached", async () => {
      mockUseConsentForm.mockReturnValue({
        data: { ...externalPayload, consent_url: null },
        isLoading: false,
      });
      mockStartConsentSession.mockRejectedValue(new Error("portal down"));

      render(<DpdpConsentPage />);

      await waitFor(() => {
        expect(screen.getByText(/Consent portal unavailable/i)).toBeInTheDocument();
      });

      mockStartConsentSession.mockResolvedValue({
        already_consented: false,
        consent_url: "https://l.hffc.in/HFFCIN/retry-worked",
      });
      fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

      await waitFor(() => {
        expect(assign).toHaveBeenCalledWith("https://l.hffc.in/HFFCIN/retry-worked");
      });
    });

    it("keeps rendering the in-app form when the mode is Internal Form", () => {
      mockUseConsentForm.mockReturnValue({
        data: { ...mockConsentData, consent_mode: "Internal Form" },
        isLoading: false,
      });

      render(<DpdpConsentPage />);

      expect(screen.getByRole("button", { name: /Submit Consent/i })).toBeInTheDocument();
      expect(assign).not.toHaveBeenCalled();
    });
  });
});
