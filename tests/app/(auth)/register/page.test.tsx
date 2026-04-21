import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";

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

const mockSignUp = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    signUp: (...args: unknown[]) => mockSignUp(...args),
  },
}));

// ─── Helpers ────────────────────────────────────────────────────────
const user = userEvent.setup();

async function fillRegisterForm(
  overrides: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {}
) {
  const {
    fullName = "Jane Smith",
    email = "jane@example.com",
    password = "Secret123!",
    confirmPassword = "Secret123!",
  } = overrides;

  if (fullName) await user.type(screen.getByPlaceholderText("John Doe"), fullName);
  if (email) await user.type(screen.getByPlaceholderText("you@example.com"), email);
  if (password) await user.type(screen.getByPlaceholderText("Create a strong password"), password);
  if (confirmPassword) await user.type(screen.getByPlaceholderText("Re-enter your password"), confirmPassword);
}

function getForm() {
  return screen.getByPlaceholderText("you@example.com").closest("form")!;
}

function getSubmitButton() {
  return screen.getAllByRole("button").find(
    (b) => b.textContent?.includes("Create your account")
  )!;
}

// Submit form reliably (fireEvent.submit bypasses native validation in jsdom)
function submitForm() {
  fireEvent.submit(getForm());
}

// =====================================================================
//  REGISTER PAGE – UI TESTS
// =====================================================================
describe("RegisterPage – UI Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<RegisterPage />);
    expect(container).toBeTruthy();
  });

  it("renders the AuthForm in register mode with correct heading", () => {
    render(<RegisterPage />);
    expect(
      screen.getByRole("heading", { name: /Create your account/i })
    ).toBeTruthy();
  });

  it("renders all four input fields", () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText("John Doe")).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Create a strong password")).toBeTruthy();
    expect(screen.getByPlaceholderText("Re-enter your password")).toBeTruthy();
  });

  it("does not show error alert on initial render", () => {
    render(<RegisterPage />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders the submit button enabled initially", () => {
    render(<RegisterPage />);
    const btn = getSubmitButton();
    expect(btn).not.toBeDisabled();
  });

  it("has proper wrapper with min-h-screen", () => {
    const { container } = render(<RegisterPage />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains("min-h-screen")).toBe(true);
  });

  it("shows 'Already have an account?' with 'Sign in' link", () => {
    render(<RegisterPage />);
    expect(screen.getByText(/Already have an account\?/)).toBeTruthy();
    const signInLink = screen.getByText("Sign in");
    expect(signInLink.closest("a")?.getAttribute("href")).toBe("/login");
  });
});

// =====================================================================
//  REGISTER PAGE – SUCCESSFUL REGISTRATION FLOW
// =====================================================================
describe("RegisterPage – Successful Registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      user: { id: "1", email: "jane@example.com" },
      session: { access_token: "abc" },
    });
  });

  it("calls auth.signUp with email and password on successful registration", async () => {
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });

    // The register page constructs fullName from firstName + lastName
    // (both empty strings from AuthForm state) → " ".trim() = "" → || undefined
    const callArgs = mockSignUp.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.email).toBe("jane@example.com");
    expect(callArgs.password).toBe("Secret123!");
  });

  it("redirects to /dashboard on successful registration", async () => {
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows loading state during registration", async () => {
    mockSignUp.mockImplementation(() => new Promise(() => {}));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Please wait...")).toBeTruthy();
    });
  });

  it("does not show error after successful registration", async () => {
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

// =====================================================================
//  REGISTER PAGE – PASSWORD MISMATCH VALIDATION
// =====================================================================
describe("RegisterPage – Password Mismatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Passwords do not match' error when passwords differ", async () => {
    render(<RegisterPage />);
    await fillRegisterForm({
      password: "Password1",
      confirmPassword: "Password2",
    });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });
  });

  it("does NOT call auth.signUp when passwords mismatch", async () => {
    render(<RegisterPage />);
    await fillRegisterForm({
      password: "abc",
      confirmPassword: "xyz",
    });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("does NOT redirect when passwords mismatch", async () => {
    render(<RegisterPage />);
    await fillRegisterForm({
      password: "abc",
      confirmPassword: "xyz",
    });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does NOT show loading state on password mismatch", async () => {
    render(<RegisterPage />);
    await fillRegisterForm({
      password: "abc",
      confirmPassword: "xyz",
    });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });
    expect(screen.queryByText("Please wait...")).toBeNull();
  });
});

// =====================================================================
//  REGISTER PAGE – ERROR HANDLING
// =====================================================================
describe("RegisterPage – Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays error message when auth.signUp throws an Error", async () => {
    mockSignUp.mockRejectedValue(new Error("User already registered"));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("User already registered")).toBeTruthy();
    });
  });

  it("displays generic message when non-Error is thrown", async () => {
    mockSignUp.mockRejectedValue("some string error");
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeTruthy();
    });
  });

  it("renders error inside an Alert with role='alert'", async () => {
    mockSignUp.mockRejectedValue(new Error("Duplicate email"));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  it("does NOT redirect when registration fails", async () => {
    mockSignUp.mockRejectedValue(new Error("fail"));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("re-enables the submit button after an error", async () => {
    mockSignUp.mockRejectedValue(new Error("fail"));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    const btn = getSubmitButton();
    expect(btn).not.toBeDisabled();
  });

  it("clears previous error when attempting another registration", async () => {
    mockSignUp
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({ user: {}, session: {} });

    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("First error")).toBeTruthy();
    });

    // Retry
    submitForm();

    await waitFor(() => {
      expect(screen.queryByText("First error")).toBeNull();
    });
  });

  it("logs error to console on failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignUp.mockRejectedValue(new Error("Oops"));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Registration error:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});

// =====================================================================
//  REGISTER PAGE – EDGE CASES
// =====================================================================
describe("RegisterPage – Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      session: {},
    });
  });

  it("handles whitespace-only fullName without crashing", async () => {
    render(<RegisterPage />);
    await fillRegisterForm({ fullName: "   " });
    submitForm();

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
  });

  it("handles network error gracefully", async () => {
    mockSignUp.mockRejectedValue(new Error("Network Error"));
    render(<RegisterPage />);
    await fillRegisterForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeTruthy();
    });
  });
});
