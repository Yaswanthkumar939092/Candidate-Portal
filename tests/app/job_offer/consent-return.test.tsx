import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import DpdpConsentReturnPage from "@/app/(portal)/job_offer/consent/return/page";
import React from "react";

const mockPush = vi.fn();
let searchParams: Record<string, string | null> = {
  appl: "test@example.com",
  token: "my-token",
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParams[key] ?? null,
  }),
  useRouter: () => ({ push: mockPush }),
}));

const mockRefetch = vi.fn();
const mockUseConsentSessionStatus = vi.fn();
const mockStartConsentSession = vi.fn();

vi.mock("@/lib/hooks/useJobOffer", () => ({
  useConsentSessionStatus: (...args: unknown[]) =>
    mockUseConsentSessionStatus(...args),
  useStartConsentSession: () => ({ mutateAsync: mockStartConsentSession }),
}));

/**
 * The countdown re-schedules its timer on each render, so time has to be
 * advanced a tick at a time for React to flush in between.
 */
async function tick(seconds: number) {
  for (let i = 0; i < seconds; i += 1) {
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
  }
}

function statusResult(data: unknown, overrides: Record<string, unknown> = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    isFetching: false,
    ...overrides,
  };
}

describe("DpdpConsentReturnPage", () => {
  let assign: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = { appl: "test@example.com", token: "my-token" };
    assign = vi.fn();
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("polls with the applicant and token from the URL", () => {
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({ enabled: true, consent_given: false, session_status: "Pending" }),
    );

    render(<DpdpConsentReturnPage />);

    expect(mockUseConsentSessionStatus).toHaveBeenCalledWith(
      "test@example.com",
      "my-token",
    );
  });

  it("waits rather than declaring success when the callback has not landed", () => {
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({ enabled: true, consent_given: false, session_status: "Pending" }),
    );

    render(<DpdpConsentReturnPage />);

    expect(screen.getByText(/Confirming your consent/i)).toBeInTheDocument();
    expect(screen.queryByText(/Consent recorded/i)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("offers a way out once the callback is clearly late", async () => {
    vi.useFakeTimers();
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({ enabled: true, consent_given: false, session_status: "Pending" }),
    );

    render(<DpdpConsentReturnPage />);

    expect(screen.queryByRole("button", { name: /Check again/i })).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(45_000);
    });

    expect(screen.getByRole("button", { name: /Check again/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Check again/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("confirms and forwards once consent has landed", async () => {
    vi.useFakeTimers();
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({
        enabled: true,
        consent_given: true,
        consent_log: "DPDP-CONSENT-2026-00007",
        session_status: "Completed",
        redirect_url: null,
      }),
    );

    render(<DpdpConsentReturnPage />);

    expect(screen.getByText(/Consent recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/DPDP-CONSENT-2026-00007/)).toBeInTheDocument();

    await tick(4);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/onboarding"),
    );
  });

  it("follows the backend's redirect URL when it gives one", async () => {
    vi.useFakeTimers();
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({
        enabled: true,
        consent_given: true,
        redirect_url: "https://hr.example.com/action-center",
      }),
    );

    render(<DpdpConsentReturnPage />);

    await tick(4);

    expect(assign).toHaveBeenCalledWith("https://hr.example.com/action-center");
  });

  it("explains a declined session and offers to start again", async () => {
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({
        enabled: true,
        consent_given: false,
        session_status: "Declined",
        consent_url: null,
      }),
    );
    mockStartConsentSession.mockResolvedValue({
      already_consented: false,
      consent_url: "https://l.hffc.in/HFFCIN/fresh",
    });

    render(<DpdpConsentReturnPage />);

    expect(screen.getByText(/Consent was declined/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Start consent again/i }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("https://l.hffc.in/HFFCIN/fresh");
    });
  });

  it("offers a fresh link when the session expired", () => {
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({ enabled: true, consent_given: false, session_status: "Expired" }),
    );

    render(<DpdpConsentReturnPage />);

    expect(screen.getByText(/That consent link has expired/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Get a new consent link/i }),
    ).toBeInTheDocument();
  });

  it("does not block the candidate when consent is switched off", () => {
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult({ enabled: false, consent_given: false }),
    );

    render(<DpdpConsentReturnPage />);

    expect(screen.getByText(/Nothing further needed/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continue to Onboarding/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/onboarding"));
  });

  it("asks for a working link when the URL has no applicant", () => {
    searchParams = { appl: null, token: null };
    mockUseConsentSessionStatus.mockReturnValue(statusResult(undefined, { isLoading: false }));

    render(<DpdpConsentReturnPage />);

    expect(
      screen.getByText(/couldn't identify your application/i),
    ).toBeInTheDocument();
  });

  it("surfaces a status-check failure with a retry", () => {
    mockUseConsentSessionStatus.mockReturnValue(
      statusResult(undefined, { isError: true, error: new Error("network down") }),
    );

    render(<DpdpConsentReturnPage />);

    expect(screen.getByText(/network down/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
