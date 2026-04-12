import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

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

const mockSignIn = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    signIn: (...args: unknown[]) => mockSignIn(...args),
  },
}));

// ─── Helpers ────────────────────────────────────────────────────────
const user = userEvent.setup();

// =====================================================================
//  LOGIN PAGE  – UI TESTS
// =====================================================================
describe("LoginPage – UI Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<LoginPage />);
    expect(container).toBeTruthy();
  });

  it("renders the AuthForm in login mode with correct heading", () => {
    render(<LoginPage />);
    expect(screen.getByText("Welcome back! 👋")).toBeTruthy();
  });

  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();
  });

  it("does not show error alert on initial render", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders the sign-in button enabled initially", () => {
    render(<LoginPage />);
    const btn = screen.getByRole("button", { name: /Sign in to your account/i });
    expect(btn).not.toBeDisabled();
  });

  it("has a wrapper div with correct background styling class", () => {
    const { container } = render(<LoginPage />);
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
    mockSignIn.mockResolvedValue({
      user: { id: "1", email: "test@test.com" },
      session: { access_token: "abc" },
    });
  });

  it("calls auth.signIn with the entered credentials", async () => {
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });
  });

  it("redirects to /dashboard on successful login", async () => {
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows loading state ('Please wait...') during sign-in", async () => {
    // Make signIn hang to test loading state
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pass");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("Please wait...")).toBeTruthy();
    });
  });

  it("does not show error after successful login", async () => {
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
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
  });

  it("displays error message when auth.signIn throws an Error", async () => {
    mockSignIn.mockRejectedValue(new Error("Invalid login credentials"));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "bad@email.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeTruthy();
    });
  });

  it("displays generic message when non-Error is thrown", async () => {
    mockSignIn.mockRejectedValue("some string error");
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "bad@email.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pass");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeTruthy();
    });
  });

  it("renders error inside an Alert component with role='alert'", async () => {
    mockSignIn.mockRejectedValue(new Error("Bad creds"));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  it("does NOT redirect when login fails", async () => {
    mockSignIn.mockRejectedValue(new Error("fail"));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "fail@fail.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "fail");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("re-enables the submit button after an error", async () => {
    mockSignIn.mockRejectedValue(new Error("fail"));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    const btn = screen.getByRole("button", { name: /Sign in to your account/i });
    expect(btn).not.toBeDisabled();
  });

  it("clears previous error when attempting another login", async () => {
    mockSignIn
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce({ user: {}, session: {} });

    render(<LoginPage />);

    // First attempt – should fail
    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("First error")).toBeTruthy();
    });

    // Second attempt – should succeed and clear error
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.queryByText("First error")).toBeNull();
    });
  });
});

// =====================================================================
//  LOGIN PAGE  – EDGE CASES
// =====================================================================
describe("LoginPage – Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles network error gracefully", async () => {
    mockSignIn.mockRejectedValue(new Error("Network Error"));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeTruthy();
    });
  });

  it("logs error to console on failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignIn.mockRejectedValue(new Error("Oops"));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "pw");
    await user.click(screen.getByRole("button", { name: /Sign in to your account/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Login error:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
