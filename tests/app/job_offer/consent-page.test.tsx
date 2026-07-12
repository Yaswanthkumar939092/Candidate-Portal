import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
vi.mock("@/lib/hooks/useJobOffer", () => ({
  useConsentForm: (...args: unknown[]) => mockUseConsentForm(...args),
  useSubmitConsent: () => mockUseSubmitConsent(),
}));

describe("DpdpConsentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    const dashboardBtn = screen.getByRole("button", { name: /Go to Dashboard/i });
    fireEvent.click(dashboardBtn);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("renders success screen immediately if already consented", () => {
    mockUseConsentForm.mockReturnValueOnce({
      data: {
        ...mockConsentData,
        already_consented: true,
      },
      isLoading: false,
    });

    render(<DpdpConsentPage />);

    expect(screen.getByText("Consent Submitted")).toBeTruthy();
    const dashboardBtn = screen.getByRole("button", { name: /Go to Dashboard/i });
    expect(dashboardBtn).toBeTruthy();
  });
});
