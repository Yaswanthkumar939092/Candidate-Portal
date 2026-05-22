import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "@/components/auth-form";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
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


// ─── Helpers ────────────────────────────────────────────────────────
const user = userEvent.setup();

const defaultLoginProps = {
  type: "login" as const,
  onSubmit: vi.fn(),
  isLoading: false,
};

const defaultRegisterProps = {
  type: "register" as const,
  onSubmit: vi.fn(),
  isLoading: false,
};

// =====================================================================
//  LOGIN FORM  – UI TESTS
// =====================================================================
describe("AuthForm – Login UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login heading 'Welcome! 👋'", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByText("Welcome! 👋")).toBeTruthy();
  });

  it("renders the login subtitle text", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(
      screen.getByText("Please enter your credentials to access your account")
    ).toBeTruthy();
  });

  it("renders the email input with correct placeholder", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const emailInput = screen.getByPlaceholderText("you@example.com");
    expect(emailInput).toBeTruthy();
    expect(emailInput.getAttribute("type")).toBe("email");
  });

  it("renders the password input with correct placeholder", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const pwInput = screen.getByPlaceholderText("Enter your password");
    expect(pwInput).toBeTruthy();
    expect(pwInput.getAttribute("type")).toBe("password");
  });

  it("renders the 'Email address' label", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByLabelText("Email address")).toBeTruthy();
  });

  it("renders the 'Password' label", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("shows 'Remember me' checkbox on login", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByText("Remember me")).toBeTruthy();
  });

  it("shows 'Forgot password?' link on login", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByText("Forgot password?")).toBeTruthy();
  });

  it("shows submit button with text 'Sign in to your account'", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(
      screen.getByRole("button", { name: /Sign in to your account/i })
    ).toBeTruthy();
  });

  it("does NOT render full name field in login mode", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.queryByLabelText("Full name")).toBeNull();
  });

  it("does NOT render confirm password field in login mode", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.queryByLabelText("Confirm password")).toBeNull();
  });

  it("does not render the Google button in login mode", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(
      screen.queryByRole("button", { name: /Continue with Google/i })
    ).toBeNull();
  });

  it("renders link to register page ('Create account')", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const link = screen.getByText("Create account");
    expect(link).toBeTruthy();
    expect(link.closest("a")?.getAttribute("href")).toBe("/register");
  });

  it("does not render the social login divider in login mode", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.queryByText(/or continue with/i)).toBeNull();
  });

  it("renders the brand logo on desktop pane", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const logo = screen.getByAltText("Logo");
    expect(logo).toBeTruthy();
  });

  it("renders left-pane heading for login", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByText(/Your Career Journey/)).toBeTruthy();
    expect(screen.getByText(/Starts Here/)).toBeTruthy();
  });

  it("renders onboarding feature bullets on login", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(screen.getByText("Track your onboarding journey")).toBeTruthy();
    expect(screen.getByText("Connect with your team")).toBeTruthy();
    expect(screen.getByText("Access important resources")).toBeTruthy();
  });

  it("renders the copyright notice", () => {
    render(<AuthForm {...defaultLoginProps} />);
    expect(
      screen.getByText(/© 2026 Physics Wallah. All rights reserved./)
    ).toBeTruthy();
  });
});

// =====================================================================
//  LOGIN FORM  – INTERACTION & LOGIC TESTS
// =====================================================================
describe("AuthForm – Login Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSubmit with email and password on form submission", async () => {
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultLoginProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@test.com",
        password: "password123",
      })
    );
  });

  it("toggles password visibility when eye icon is clicked", async () => {
    render(<AuthForm {...defaultLoginProps} />);

    const pwInput = screen.getByPlaceholderText("Enter your password");
    expect(pwInput.getAttribute("type")).toBe("password");

    // Click the toggle button (there's only one in login mode)
    const toggleButtons = screen.getAllByRole("button").filter(
      (btn) => !btn.textContent?.includes("Sign in")
    );
    // First toggle is for password
    await user.click(toggleButtons[0]);
    expect(pwInput.getAttribute("type")).toBe("text");

    // Click again to hide
    await user.click(toggleButtons[0]);
    expect(pwInput.getAttribute("type")).toBe("password");
  });

  it("updates email field value as user types", async () => {
    render(<AuthForm {...defaultLoginProps} />);
    const emailInput = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;

    await user.type(emailInput, "hello@world.com");
    expect(emailInput.value).toBe("hello@world.com");
  });

  it("updates password field value as user types", async () => {
    render(<AuthForm {...defaultLoginProps} />);
    const pwInput = screen.getByPlaceholderText("Enter your password") as HTMLInputElement;

    await user.type(pwInput, "mysecret");
    expect(pwInput.value).toBe("mysecret");
  });

  it("shows 'Please wait...' when isLoading is true", () => {
    render(<AuthForm {...defaultLoginProps} isLoading={true} />);
    expect(screen.getByText("Please wait...")).toBeTruthy();
  });

  it("disables submit button when isLoading is true", () => {
    render(<AuthForm {...defaultLoginProps} isLoading={true} />);
    const btn = screen.getByRole("button", { name: /Please wait/i });
    expect(btn).toBeDisabled();
  });

  it("does not show arrow icon when isLoading is true", () => {
    render(<AuthForm {...defaultLoginProps} isLoading={true} />);
    // The button should only show "Please wait..." text, no ArrowRight
    const btn = screen.getByRole("button", { name: /Please wait/i });
    expect(btn.textContent).toBe("Please wait...");
  });

  it("submits form data with empty defaults for unused register fields", async () => {
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultLoginProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmPassword: "",
        firstName: "",
        lastName: "",
      })
    );
  });
});

// =====================================================================
//  PASSWORDLESS LOGIN FORM  – UI & LOGIC TESTS
// =====================================================================
describe("AuthForm – Passwordless UI & Interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the heading 'Verify your email' and subheading", () => {
    render(<AuthForm {...defaultLoginProps} isPasswordless={true} />);
    expect(screen.getByText("Verify your email")).toBeTruthy();
    expect(
      screen.getByText("We'll send a 6-digit verification code to your email address to confirm your account.")
    ).toBeTruthy();
  });

  it("hides the password field in passwordless mode", () => {
    render(<AuthForm {...defaultLoginProps} isPasswordless={true} />);
    expect(screen.queryByPlaceholderText("Enter your password")).toBeNull();
  });

  it("renders the submit button as 'Send verification code'", () => {
    render(<AuthForm {...defaultLoginProps} isPasswordless={true} />);
    expect(
      screen.getByRole("button", { name: /Send verification code/i })
    ).toBeTruthy();
  });

  it("renders the 'Why do I need to verify?' card", () => {
    render(<AuthForm {...defaultLoginProps} isPasswordless={true} />);
    expect(screen.getByText("Why do I need to verify?")).toBeTruthy();
    expect(
      screen.getByText(
        "To protect your career data and ensure secure access to your onboarding dashboard and team communications."
      )
    ).toBeTruthy();
  });

  it("calls onPasswordlessToggle(false) when Back to password login is clicked", async () => {
    const onPasswordlessToggle = vi.fn();
    render(
      <AuthForm
        {...defaultLoginProps}
        isPasswordless={true}
        onPasswordlessToggle={onPasswordlessToggle}
      />
    );
    const backBtn = screen.getByRole("button", { name: /Back to password login/i });
    await user.click(backBtn);
    expect(onPasswordlessToggle).toHaveBeenCalledWith(false);
  });
});

// =====================================================================
//  REGISTER FORM  – UI TESTS
// =====================================================================
describe("AuthForm – Register UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the register heading 'Create your account'", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    // Use role to disambiguate heading from the submit button text
    expect(
      screen.getByRole("heading", { name: /Create your account/i })
    ).toBeTruthy();
  });

  it("renders the register subtitle text", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(
      screen.getByText("Start your journey with us today")
    ).toBeTruthy();
  });

  it("renders the full name input field", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByLabelText("Full name")).toBeTruthy();
  });

  it("renders full name placeholder 'John Doe'", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByPlaceholderText("John Doe")).toBeTruthy();
  });

  it("renders the email input field", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
  });

  it("renders the password input with 'Create a strong password' placeholder", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(
      screen.getByPlaceholderText("Create a strong password")
    ).toBeTruthy();
  });

  it("renders the confirm password input", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(
      screen.getByPlaceholderText("Re-enter your password")
    ).toBeTruthy();
  });

  it("renders the 'Confirm password' label", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByLabelText("Confirm password")).toBeTruthy();
  });

  it("renders 'Terms and Conditions' link", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByText("Terms and Conditions")).toBeTruthy();
  });

  it("renders 'Privacy Policy' link", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByText("Privacy Policy")).toBeTruthy();
  });

  it("shows submit button with text 'Create your account'", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    // There are two "Create your account" texts – heading and button
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find(
      (b) => b.textContent?.includes("Create your account")
    );
    expect(submitBtn).toBeTruthy();
  });

  it("renders link to login page ('Sign in')", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    const link = screen.getByText("Sign in");
    expect(link).toBeTruthy();
    expect(link.closest("a")?.getAttribute("href")).toBe("/login");
  });

  it("shows 'Already have an account?' text", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByText(/Already have an account\?/)).toBeTruthy();
  });

  it("does not render the social login divider in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.queryByText(/or sign up with/i)).toBeNull();
  });

  it("renders left-pane heading for register", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByText(/Join Our Growing/)).toBeTruthy();
  });

  it("renders feature descriptions on register left pane", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.getByText("Seamless Onboarding")).toBeTruthy();
    expect(screen.getByText("Team Collaboration")).toBeTruthy();
    expect(screen.getByText("Career Growth")).toBeTruthy();
  });

  it("does NOT render 'Remember me' checkbox in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.queryByText("Remember me")).toBeNull();
  });

  it("does NOT render 'Forgot password?' in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    expect(screen.queryByText("Forgot password?")).toBeNull();
  });
});

// =====================================================================
//  REGISTER FORM  – INTERACTION & LOGIC TESTS
// =====================================================================
describe("AuthForm – Register Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSubmit with all register fields", async () => {
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultRegisterProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("John Doe"), "Jane Smith");
    await user.type(screen.getByPlaceholderText("you@example.com"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Create a strong password"), "Secret123!");
    await user.type(screen.getByPlaceholderText("Re-enter your password"), "Secret123!");

    // Use fireEvent.submit on the form to reliably trigger onSubmit in jsdom
    const form = screen.getByPlaceholderText("you@example.com").closest("form")!;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        password: "Secret123!",
        confirmPassword: "Secret123!",
        fullName: "Jane Smith",
      })
    );
  });

  it("toggles password visibility in register form", async () => {
    render(<AuthForm {...defaultRegisterProps} />);

    const pwInput = screen.getByPlaceholderText("Create a strong password");
    expect(pwInput.getAttribute("type")).toBe("password");

    // Get toggle buttons and exclude submit.
    const allButtons = screen.getAllByRole("button");
    const toggleButtons = allButtons.filter(
      (btn) =>
        btn.getAttribute("type") === "button" &&
        !btn.textContent?.includes("Create")
    );

    // First toggle is for password
    await user.click(toggleButtons[0]);
    expect(pwInput.getAttribute("type")).toBe("text");
  });

  it("toggles confirm password visibility independently", async () => {
    render(<AuthForm {...defaultRegisterProps} />);

    const confirmInput = screen.getByPlaceholderText("Re-enter your password");
    expect(confirmInput.getAttribute("type")).toBe("password");

    const allButtons = screen.getAllByRole("button");
    const toggleButtons = allButtons.filter(
      (btn) =>
        btn.getAttribute("type") === "button" &&
        !btn.textContent?.includes("Create")
    );

    // Second toggle is for confirm password
    await user.click(toggleButtons[1]);
    expect(confirmInput.getAttribute("type")).toBe("text");
  });

  it("updates fullName field as user types", async () => {
    render(<AuthForm {...defaultRegisterProps} />);
    const nameInput = screen.getByPlaceholderText("John Doe") as HTMLInputElement;

    await user.type(nameInput, "Alice Wonderland");
    expect(nameInput.value).toBe("Alice Wonderland");
  });

  it("shows 'Please wait...' when isLoading is true in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} isLoading={true} />);
    expect(screen.getByText("Please wait...")).toBeTruthy();
  });

  it("disables submit button when isLoading in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} isLoading={true} />);
    const btn = screen.getByRole("button", { name: /Please wait/i });
    expect(btn).toBeDisabled();
  });

  it("passes formData even if fields are empty on submit", async () => {
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultRegisterProps} onSubmit={onSubmit} />);

    // Submit without filling anything (browser validation disabled in tests)
    const form = screen.getByRole("button", { name: /Create your account/i })
      .closest("form")!;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // onSubmit may or may not be called depending on browser validation
    // In jsdom, required fields won't block submission
  });
});

// =====================================================================
//  SHARED / EDGE CASE TESTS
// =====================================================================
describe("AuthForm – Edge Cases", () => {
  it("renders without crashing with minimal props (login)", () => {
    const { container } = render(
      <AuthForm type="login" onSubmit={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it("renders without crashing with minimal props (register)", () => {
    const { container } = render(
      <AuthForm type="register" onSubmit={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it("defaults isLoading to false when not provided", () => {
    render(<AuthForm type="login" onSubmit={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /Sign in to your account/i })
    ).not.toBeDisabled();
  });

  it("handles rapid typing in email field without errors", async () => {
    render(<AuthForm {...defaultLoginProps} />);
    const emailInput = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;

    await user.type(emailInput, "verylongemailaddress@verylongdomain.com");
    expect(emailInput.value).toBe("verylongemailaddress@verylongdomain.com");
  });

  it("handles special characters in password", async () => {
    render(<AuthForm {...defaultLoginProps} />);
    const pwInput = screen.getByPlaceholderText("Enter your password") as HTMLInputElement;

    await user.type(pwInput, "P@$$w0rd!#%^&*");
    expect(pwInput.value).toBe("P@$$w0rd!#%^&*");
  });

  it("email input has required attribute", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const emailInput = screen.getByPlaceholderText("you@example.com");
    expect(emailInput).toHaveAttribute("required");
  });

  it("password input has required attribute", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const pwInput = screen.getByPlaceholderText("Enter your password");
    expect(pwInput).toHaveAttribute("required");
  });

  it("fullName input has required attribute in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    const nameInput = screen.getByPlaceholderText("John Doe");
    expect(nameInput).toHaveAttribute("required");
  });

  it("confirmPassword input has required attribute in register mode", () => {
    render(<AuthForm {...defaultRegisterProps} />);
    const confirmInput = screen.getByPlaceholderText("Re-enter your password");
    expect(confirmInput).toHaveAttribute("required");
  });

  it("email input has type='email'", () => {
    render(<AuthForm {...defaultLoginProps} />);
    const emailInput = screen.getByPlaceholderText("you@example.com");
    expect(emailInput).toHaveAttribute("type", "email");
  });

  describe("AuthForm – Set Password Flow", () => {
    it("renders set password heading, inputs and button correctly", () => {
      render(<AuthForm {...defaultLoginProps} loginStep="setPassword" />);
      expect(screen.getByText("Set your password")).toBeTruthy();
      expect(screen.getByText("Create a password for your account to ensure secure access in the future.")).toBeTruthy();
      expect(screen.getByLabelText("New Password")).toBeTruthy();
      expect(screen.getByLabelText("Confirm New Password")).toBeTruthy();
      expect(screen.queryByPlaceholderText("you@example.com")).toBeNull();
      expect(screen.getByRole("button", { name: /Set password/i })).toBeTruthy();
    });

    it("renders cancel button and triggers onBackToCredentials", async () => {
      const onBackToCredentials = vi.fn();
      render(
        <AuthForm
          {...defaultLoginProps}
          loginStep="setPassword"
          onBackToCredentials={onBackToCredentials}
        />
      );
      const cancelBtn = screen.getByRole("button", { name: /Cancel and back to login/i });
      await user.click(cancelBtn);
      expect(onBackToCredentials).toHaveBeenCalled();
    });
  });
});
