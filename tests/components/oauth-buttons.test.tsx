import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OAuthButtons } from "@/components/oauth-buttons"
import { auth, isOAuthProviderEnabled } from "@/lib/auth"

// Mocks
vi.mock("@/lib/auth", () => ({
  auth: {
    signInWithOAuth: vi.fn(),
  },
  isOAuthProviderEnabled: vi.fn(),
}))

vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="icon-loader" />,
  AlertTriangle: () => <div data-testid="icon-alert" />,
}))

describe("OAuthButtons", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(isOAuthProviderEnabled as unknown as { mockReturnValue: (val: boolean) => void }).mockReturnValue(true)
  })

  it("renders both Google and LinkedIn buttons when enabled", () => {
    render(<OAuthButtons />)
    expect(screen.getByText("Sign in with Google")).toBeTruthy()
    expect(screen.getByText("Sign in with LinkedIn")).toBeTruthy()
  })

  it("renders sign up text when mode is signup", () => {
    render(<OAuthButtons mode="signup" />)
    expect(screen.getByText("Sign up with Google")).toBeTruthy()
    expect(screen.getByText("Sign up with LinkedIn")).toBeTruthy()
  })

  it("calls auth.signInWithOAuth when Google button is clicked", async () => {
    render(<OAuthButtons />)
    const googleButton = screen.getByText("Sign in with Google")
    
    await user.click(googleButton)
    
    expect(auth.signInWithOAuth).toHaveBeenCalledWith("google")
  })

  it("calls auth.signInWithOAuth when LinkedIn button is clicked", async () => {
    render(<OAuthButtons />)
    const linkedInButton = screen.getByText("Sign in with LinkedIn")
    
    await user.click(linkedInButton)
    
    expect(auth.signInWithOAuth).toHaveBeenCalledWith("linkedin")
  })

  it("shows loading state when a provider is clicked", async () => {
    // Mock signInWithOAuth to never resolve so we can see loading state
    ;(auth.signInWithOAuth as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue(new Promise(() => {}))
    
    render(<OAuthButtons />)
    const googleButton = screen.getByText("Sign in with Google")
    
    await user.click(googleButton)
    
    expect(screen.getByTestId("icon-loader")).toBeTruthy()
    expect(googleButton).toBeDisabled()
  })

  it("renders nothing if no providers are enabled", () => {
    ;(isOAuthProviderEnabled as unknown as { mockReturnValue: (val: boolean) => void }).mockReturnValue(false)
    const { container } = render(<OAuthButtons />)
    expect(container.firstChild).toBeNull()
  })

  it("renders only Google if only Google is enabled", () => {
    ;(isOAuthProviderEnabled as unknown as { mockImplementation: (fn: (provider: string) => boolean) => void }).mockImplementation((provider: string) => provider === "google")
    render(<OAuthButtons />)
    expect(screen.getByText("Sign in with Google")).toBeTruthy()
    expect(screen.queryByText("Sign in with LinkedIn")).toBeNull()
  })

  it("displays error message if auth fails", async () => {
    ;(auth.signInWithOAuth as unknown as { mockRejectedValue: (val: Error) => void }).mockRejectedValue(new Error("OAuth failed"))
    
    render(<OAuthButtons />)
    const googleButton = screen.getByText("Sign in with Google")
    
    await user.click(googleButton)
    
    await waitFor(() => {
      expect(screen.getByText("OAuth failed")).toBeTruthy()
    })
  })
})
