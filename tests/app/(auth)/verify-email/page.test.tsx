import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";

// ─── Mocks ──────────────────────────────────────────────────────────
const mockPush = vi.fn();
const mockGet = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
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
    resetPassword: (email: string) => mockRequestOtp({ identifier: email, purpose: "Password Reset", mode: "password_reset" }),
  },
}));

const mockUseAuthSettings = vi.fn();
vi.mock("@/lib/hooks/useAuthSettings", () => ({
  useAuthSettings: () => mockUseAuthSettings(),
}));

const user = userEvent.setup();

async function renderVerifyEmailPage() {
  render(<VerifyEmailPage />);
}

describe("VerifyEmailPage Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSettings.mockResolvedValue(defaultAuthSettings);
    mockUseAuthSettings.mockReturnValue({
      data: defaultAuthSettings,
      isLoading: false,
      error: null,
    });
    mockGet.mockReturnValue(null);
  });

  it("renders loading state initially", async () => {
    mockUseAuthSettings.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
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
    mockUseAuthSettings.mockReturnValue({
      data: {
        ...defaultAuthSettings,
        enable_email_signup: 0,
      },
      isLoading: false,
      error: null,
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
        mode: "verify_email",
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
        otp_log: "OTP-123",
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

  it("successfully requests OTP, verifies OTP, and sets password in Password Reset flow", async () => {
    mockGet.mockImplementation((key) => key === "purpose" ? "Password Reset" : null);
    mockRequestOtp.mockResolvedValue({
      status: "otp_required",
      otp_log: "OTP-123",
      delivery_status: "Sent",
    });
    mockVerifyOtp.mockResolvedValue({ status: "success" });
    mockSetPassword.mockResolvedValue({ status: "success" });
    mockSignOut.mockResolvedValue({ status: "success" });

    await renderVerifyEmailPage();

    // Verify "Reset your password" is showing
    await waitFor(() => {
      expect(screen.getByText("Reset your password")).toBeTruthy();
    });

    // Enter email and send code
    await user.type(screen.getByPlaceholderText("you@example.com"), "candidate@example.com");
    await user.click(screen.getByRole("button", { name: /Send verification code/i }));

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith({
        identifier: "candidate@example.com",
        purpose: "Password Reset",
        mode: "password_reset",
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
        purpose: "Password Reset",
        identifierType: "Email",
        otp_log: "OTP-123",
      });
    });

    // Verify "Reset your password" step for setting new password
    await waitFor(() => {
      expect(screen.getByText("Reset your password")).toBeTruthy();
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
});
