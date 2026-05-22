import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";

// ─── Mocks ──────────────────────────────────────────────────────────
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/hooks/useCandidateBranding", () => ({
  useCandidateBranding: () => ({
    data: {
      title_prefix: "Physics Wallah",
      app_logo: "/brand.png",
    },
    isLoading: false,
  }),
}));

const mockSignIn = vi.fn();
const mockRequestOtp = vi.fn();
const mockRequestEmailSignupOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockGetAuthSettings = vi.fn();
const mockSetPassword = vi.fn();
const mockSignOut = vi.fn();

const defaultAuthSettings = {
  enabled: 1,
  allow_signup: 1,
  allow_password_login: 1,
  allow_email_otp_login: 1,
  enable_email_otp: 1,
  enable_mobile_otp: 0,
  otp_expiry_seconds: 300,
  max_otp_attempts: 3,
  enable_email_signup: 1,
};

vi.mock("@/lib/auth", () => ({
  auth: {
    signIn: (...args: unknown[]) => mockSignIn(...args),
    requestOtp: (...args: unknown[]) => mockRequestOtp(...args),
    requestEmailSignupOtp: (...args: unknown[]) => mockRequestEmailSignupOtp(...args),
    verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    getAuthSettings: (...args: unknown[]) => mockGetAuthSettings(...args),
    setPassword: (...args: unknown[]) => mockSetPassword(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

const user = userEvent.setup();

async function renderVerifyEmailPage() {
  render(<VerifyEmailPage />);
}

describe("VerifyEmailPage Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSettings.mockResolvedValue(defaultAuthSettings);
  });

  it("renders loading state initially", async () => {
    mockGetAuthSettings.mockReturnValue(new Promise(() => {})); // never resolves
    await renderVerifyEmailPage();
    expect(screen.getByText("Loading settings...")).toBeTruthy();
  });

  it("renders the verification form when email signup is enabled", async () => {
    await renderVerifyEmailPage();
    await waitFor(() => {
      expect(screen.getByText("Verify your email")).toBeTruthy();
    });
  });

  it("renders unavailable page when email signup is disabled", async () => {
    mockGetAuthSettings.mockResolvedValue({
      ...defaultAuthSettings,
      enable_email_signup: 0,
    });
    await renderVerifyEmailPage();
    await waitFor(() => {
      expect(screen.getByText("Access unavailable")).toBeTruthy();
      expect(screen.getByText("Accessing candidate portal via email verification is not enabled.")).toBeTruthy();
    });
  });

  it("successfully requests OTP, verifies OTP, and sets password", async () => {
    mockRequestEmailSignupOtp.mockResolvedValue({
      status: "otp_required",
      otp_log: "OTP-123",
      delivery_status: "Sent",
    });
    mockVerifyOtp.mockResolvedValue({ status: "success" });
    mockSetPassword.mockResolvedValue({ status: "success" });
    mockSignOut.mockResolvedValue({ status: "success" });

    await renderVerifyEmailPage();

    // Verify "Verify your email" is showing
    await waitFor(() => {
      expect(screen.getByText("Verify your email")).toBeTruthy();
    });

    // Enter email and send code
    await user.type(screen.getByPlaceholderText("you@example.com"), "candidate@example.com");
    await user.click(screen.getByRole("button", { name: /Send verification code/i }));

    await waitFor(() => {
      expect(mockRequestEmailSignupOtp).toHaveBeenCalledWith({
        email: "candidate@example.com",
      });
    });

    // Verify OTP input is rendered
    await waitFor(() => {
      expect(screen.getByText("Email OTP")).toBeTruthy();
    });

    // Enter OTP (simulated value)
    await user.type(screen.getByPlaceholderText("Enter OTP"), "123456");
    await user.click(screen.getByRole("button", { name: /Verify and continue/i }));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        identifier: "candidate@example.com",
        otp: "123456",
        purpose: "Signup",
        identifierType: "Email",
      });
    });

    // Verify "Set your password" step
    await waitFor(() => {
      expect(screen.getByText("Set your password")).toBeTruthy();
    });

    // Enter new password and confirm
    const passInput = screen.getByLabelText("New Password");
    const confirmInput = screen.getByLabelText("Confirm New Password");

    await user.type(passInput, "Password123!");
    await user.type(confirmInput, "Password123!");
    await user.click(screen.getByRole("button", { name: /Set password/i }));

    await waitFor(() => {
      expect(mockSetPassword).toHaveBeenCalledWith("Password123!");
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("clicking Back to password login redirects to /login", async () => {
    await renderVerifyEmailPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Back to password login/i })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: /Back to password login/i }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
