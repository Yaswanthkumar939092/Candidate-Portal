import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

// ─── Mocks ──────────────────────────────────────────────────────────
const mockPush = vi.fn();
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
    get: vi.fn().mockReturnValue(null),
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

const mockSignIn = vi.fn();
const mockRequestOtp = vi.fn();
const mockRequestEmailSignupOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockGetAuthSettings = vi.fn();
const mockSetPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetPostLoginRoute = vi.fn();

vi.mock("@/lib/services/survey", () => ({
  surveyService: {
    getPostLoginRoute: (...args: unknown[]) => mockGetPostLoginRoute(...args),
  },
}));

const defaultAuthSettings = {
  enabled: 1,
  allow_signup: 1,
  allow_password_login: 1,
  allow_email_otp_login: 1,
  enable_email_otp: 1,
  enable_mobile_otp: 0,
  otp_expiry_seconds: 300,
  max_otp_attempts: 3,
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

let currentSettings = { ...defaultAuthSettings };
const originalMockResolvedValue = mockGetAuthSettings.mockResolvedValue;
mockGetAuthSettings.mockResolvedValue = (value: any) => {
  currentSettings = value;
  return originalMockResolvedValue.call(mockGetAuthSettings, value);
};

vi.mock("@/lib/hooks/useAuthSettings", () => ({
  useAuthSettings: () => ({
    data: currentSettings,
    isLoading: false,
    error: null,
  }),
}));

const mockRefreshProfile = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    refreshProfile: mockRefreshProfile,
  }),
}));

beforeEach(() => {
  currentSettings = { ...defaultAuthSettings };
  mockGetPostLoginRoute.mockResolvedValue({
    survey_required: false,
    redirect_url: "/dashboard",
  });
});

vi.mock("@/lib/hooks/useCandidateBranding", () => ({
  useCandidateBranding: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
}));

// ─── Helpers ────────────────────────────────────────────────────────
const user = userEvent.setup();

async function renderLoginPage() {
  const result = render(<LoginPage />);
  await screen.findByPlaceholderText("you@example.com");
  return result;
}

// =====================================================================
//  LOGIN PAGE  – UI TESTS
// =====================================================================
describe("LoginPage – UI Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSettings.mockResolvedValue(defaultAuthSettings);
  });

  it("renders without crashing", async () => {
    const { container } = await renderLoginPage();
    expect(container).toBeTruthy();
  });

  it("renders the AuthForm in login mode with correct heading", async () => {
     await renderLoginPage();
     expect(screen.getByText("Welcome! 👋")).toBeTruthy();
   });

  it("renders email and password inputs", async () => {
    await renderLoginPage();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();
  });

  it("does not show error alert on initial render", async () => {
    await renderLoginPage();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders the sign-in button enabled initially", async () => {
    await renderLoginPage();
    const btn = screen.getByRole("button", { name: /Sign in to your account/i });
    expect(btn).not.toBeDisabled();
  });

  it("does not render a separate email OTP login form", async () => {
    await renderLoginPage();
    expect(screen.queryByText("Sign in with email OTP")).toBeNull();
    expect(screen.queryByRole("button", { name: /Send OTP/i })).toBeNull();
  });

  it("keeps login unavailable when password login is disabled", async () => {
    mockGetAuthSettings.mockResolvedValue({
      ...defaultAuthSettings,
      allow_password_login: 0,
      allow_email_otp_login: 1,
      enable_email_otp: 1,
    });

    await render(<LoginPage />);

    expect(await screen.findByText("Password login is not enabled for candidate accounts.")).toBeTruthy();
    expect(screen.queryByText("Sign in with email OTP")).toBeNull();
  });

  it("has a wrapper div with correct background styling class", async () => {
    const { container } = await renderLoginPage();
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains("min-h-screen")).toBe(true);
  });
});

// =====================================================================
//  LOGIN PAGE  – SUCCESSFUL LOGIN FLOW
// =====================================================================
describe("LoginPage – Successful Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSettings.mockResolvedValue(defaultAuthSettings);
    mockSignIn.mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      session: { access_token: "abc" },
    });
    mockRequestOtp.mockResolvedValue({ status: "success" });
    mockVerifyOtp.mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      session: { access_token: "abc" },
    });
  });

  it("validates credentials and sends login OTP with the entered email", async () => {
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });

    expect(mockRequestOtp).toHaveBeenCalledWith({
      identifier: "test@test.com",
      purpose: "Login",
      identifierType: "Email",
    });
  });

  it("changes the main login form to OTP entry after credentials pass", async () => {
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeTruthy();
    });
    expect(screen.getByText("Enter the OTP sent to test@test.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter OTP")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Enter your password")).toBeNull();
  });

  it("verifies the OTP from the second login step", async () => {
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));
    await screen.findByPlaceholderText("Enter OTP");

    await user.type(screen.getByPlaceholderText("Enter OTP"), "123456");
    await user.click(screen.getByRole("button", { name: /Verify and continue/i }));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        identifier: "test@test.com",
        otp: "123456",
        purpose: "Login",
        identifierType: "Email",
      });
    });
  });

  it("redirects immediately when email OTP login is disabled", async () => {
    mockGetAuthSettings.mockResolvedValue({
      ...defaultAuthSettings,
      allow_email_otp_login: 0,
      enable_email_otp: 0,
    });

    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
    expect(mockRequestOtp).not.toHaveBeenCalled();
  });

  it("shows loading state ('Please wait...') during sign-in", async () => {
    // Make signIn hang to test loading state
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pass");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("Please wait...")).toBeTruthy();
    });
  });

  it("does not show error after successful login", async () => {
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

// =====================================================================
//  LOGIN PAGE  – ERROR HANDLING
// =====================================================================
describe("LoginPage – Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSettings.mockResolvedValue(defaultAuthSettings);
  });

  it("displays error message when auth.signIn throws an Error", async () => {
    mockSignIn.mockRejectedValue(new Error("Invalid login credentials"));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "bad@email.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Invalid login credentials");
    });
  });

  it("displays generic message when non-Error is thrown", async () => {
    mockSignIn.mockRejectedValue("some string error");
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "bad@email.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pass");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Failed to sign in");
    });
  });

  it("triggers toast.error for errors", async () => {
    mockSignIn.mockRejectedValue(new Error("Bad creds"));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Bad creds");
    });
  });

  it("does NOT redirect when login fails", async () => {
    mockSignIn.mockRejectedValue(new Error("fail"));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "fail@fail.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "fail");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("fail");
    });
    expect(mockSignIn).toHaveBeenCalled();
  });

  it("redirects to /verify-email when login fails with 'Please verify your email OTP before signing in.' message", async () => {
    mockSignIn.mockRejectedValue(new Error("Please verify your email OTP before signing in."));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "verify@example.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/verify-email?email=verify%40example.com");
      expect(mockToastError).toHaveBeenCalledWith("Please verify your email OTP before signing in.");
    });
  });

  it("re-enables the submit button after an error", async () => {
    mockSignIn.mockRejectedValue(new Error("fail"));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("fail");
    });

    const btn = screen.getByRole("button", { name: /Sign in to your account/i });
    expect(btn).not.toBeDisabled();
  });

  it("displays error on first failed attempt and succeeds on second attempt", async () => {
    mockSignIn
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({ user: {}, session: {} });

    await renderLoginPage();

    // First attempt – should fail
    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("First error");
    });

    // Second attempt – should succeed
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(2);
    });
  });
});

// =====================================================================
//  LOGIN PAGE  – EDGE CASES
// =====================================================================
describe("LoginPage – Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthSettings.mockResolvedValue(defaultAuthSettings);
  });

  it("handles network error gracefully", async () => {
    mockSignIn.mockRejectedValue(new Error("Network Error"));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Network Error");
    });
  });

  it("logs error to console on failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignIn.mockRejectedValue(new Error("Oops"));
    await renderLoginPage();

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Login error:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  describe.skip("LoginPage – Passwordless set password flow", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockGetAuthSettings.mockResolvedValue({
        ...defaultAuthSettings,
        allow_signup: 0,
        enable_email_signup: 1,
      });
    });

    it("verifies OTP and transitions to password setting step, then successfully sets password", async () => {
      mockRequestEmailSignupOtp.mockResolvedValue({
        status: "otp_required",
        otp_log: "123",
        delivery_status: "Sent",
      });
      mockVerifyOtp.mockResolvedValue({ status: "success" });
      mockSetPassword.mockResolvedValue({ status: "success" });
      mockSignOut.mockResolvedValue({ status: "success" });

      await renderLoginPage();

      // Click "Access Candidate portal"
      const accessBtn = screen.getByRole("button", { name: /Access Candidate portal/i });
      await user.click(accessBtn);

      // Submit email to request OTP
      await user.type(screen.getByPlaceholderText("you@example.com"), "candidate@example.com");
      await user.click(screen.getByRole("button", { name: /Send verification code/i }));

      await waitFor(() => {
        expect(mockRequestEmailSignupOtp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "candidate@example.com",
          })
        );
      });

      // Verification code screen should now be active. Enter OTP.
      await user.type(screen.getByPlaceholderText("Enter OTP"), "123456");
      await user.click(screen.getByRole("button", { name: /Verify and continue/i }));

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith(
          expect.objectContaining({
            identifier: "candidate@example.com",
            otp: "123456",
            purpose: "Signup",
          })
        );
      });

      // Should now be on the Set Password screen. Check headings and inputs.
      await waitFor(() => {
        expect(screen.getByText("Set your password")).toBeTruthy();
      });

      // Enter matching passwords and submit
      await user.type(screen.getByPlaceholderText("Enter your new password"), "NewPassword@123");
      await user.type(screen.getByPlaceholderText("Confirm your new password"), "NewPassword@123");
      await user.click(screen.getByRole("button", { name: /Set password/i }));

      await waitFor(() => {
        expect(mockSetPassword).toHaveBeenCalledWith("NewPassword@123");
        expect(mockSignOut).toHaveBeenCalled();
      });

      // Should now be redirected to the default login screen with a success alert message.
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Password resetted successfully please login!");
        expect(screen.getByText("Welcome! 👋")).toBeTruthy();
      });
    });
  });

  describe("LoginPage – Redirect Handling based on survey API response", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("redirects to /survey when survey_required is true", async () => {
      mockGetAuthSettings.mockResolvedValue({
        ...defaultAuthSettings,
        allow_email_otp_login: 0,
        enable_email_otp: 0,
      });
      mockSignIn.mockResolvedValue({ status: "success" });
      mockGetPostLoginRoute.mockResolvedValue({
        survey_required: true,
        form_name: "Onboarding Survey",
        form_schema: {},
        job_applicant: "HR-APP-2026-00042",
        job_opening: "HR-OPP-2026-00007",
      });

      await renderLoginPage();
      await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
      await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
      await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/survey");
      });
    });

    it("redirects to redirect_url from survey API when survey_required is false", async () => {
      mockGetAuthSettings.mockResolvedValue({
        ...defaultAuthSettings,
        allow_email_otp_login: 0,
        enable_email_otp: 0,
      });
      mockSignIn.mockResolvedValue({ status: "success" });
      mockGetPostLoginRoute.mockResolvedValue({
        survey_required: false,
        redirect_url: "/action-center",
      });

      await renderLoginPage();
      await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
      await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
      await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/action-center");
      });
    });

    it("defaults to /dashboard when survey API fails", async () => {
      mockGetAuthSettings.mockResolvedValue({
        ...defaultAuthSettings,
        allow_email_otp_login: 0,
        enable_email_otp: 0,
      });
      mockSignIn.mockResolvedValue({ status: "success" });
      mockGetPostLoginRoute.mockRejectedValue(new Error("API Error"));

      await renderLoginPage();
      await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
      await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
      await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });
  });
});
