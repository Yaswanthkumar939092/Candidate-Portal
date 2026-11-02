import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const h = vi.hoisted(() => ({
  push: vi.fn(),
  params: { value: {} as Record<string, string> },
  settings: { value: undefined as unknown },
  requestEmailSignupOtp: vi.fn(),
  resetPassword: vi.fn(),
  verifyOtp: vi.fn(),
  setPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push }),
  useSearchParams: () => ({ get: (k: string) => h.params.value[k] ?? null }),
}))
vi.mock("next/image", () => ({ __esModule: true, default: (p: Record<string, unknown>) => <img alt="" {...p} /> }))
vi.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))
vi.mock("@/lib/auth", () => ({
  auth: { requestEmailSignupOtp: h.requestEmailSignupOtp, resetPassword: h.resetPassword, verifyOtp: h.verifyOtp, setPassword: h.setPassword, signOut: h.signOut },
}))
vi.mock("@/lib/hooks/useAuthSettings", () => ({ useAuthSettings: () => ({ data: h.settings.value, isLoading: false, error: null }) }))
vi.mock("@/lib/hooks/useAuthPageContent", () => ({ useAuthPageContent: () => ({ data: undefined }) }))
vi.mock("@/lib/hooks/useCandidateBranding", () => ({ useCandidateBranding: () => ({ data: null }) }))

import VerifyEmailPage from "@/app/(auth)/verify-email/page"

const user = userEvent.setup()

beforeEach(() => {
  vi.clearAllMocks()
  h.params.value = {}
  h.settings.value = { enabled: 1, allow_signup: 1, enable_email_signup: 1 }
  h.requestEmailSignupOtp.mockResolvedValue({ otp_log: "OTPLOG-TEST-1", purpose: "Signup" })
  h.resetPassword.mockResolvedValue({ otp_log: "OTPLOG-TEST-2", purpose: "Password Reset" })
  h.verifyOtp.mockResolvedValue({})
  h.setPassword.mockResolvedValue({ status: "success" })
  h.signOut.mockResolvedValue(undefined)
})

describe("verify-email page", () => {
  // Spec: CAND-03-A6.1A (docs/spec/clauses/03-authentication.md#cand-03-a6-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows an Access unavailable notice unless enable_email_signup is exactly 1", () => {
    h.settings.value = { enabled: 1, enable_email_signup: 0 }
    const a = render(<VerifyEmailPage />)
    expect(screen.getByText("Access unavailable")).toBeTruthy()
    a.unmount()

    h.settings.value = undefined
    render(<VerifyEmailPage />)
    expect(screen.getByText("Access unavailable")).toBeTruthy()
  })

  // Spec: CAND-03-A6.2A (docs/spec/clauses/03-authentication.md#cand-03-a6-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("signup path: requests a signup OTP, verifies it with the returned otp_log and purpose, sets the password, signs out and goes to /login with the redirect", async () => {
    h.params.value = { email: "cand@example.invalid", redirect: "/open-jobs" }
    render(<VerifyEmailPage />)
    const email = screen.getByPlaceholderText("you@example.com") as HTMLInputElement
    expect(email.value).toBe("cand@example.invalid")
    await user.click(screen.getByRole("button", { name: /Send verification code/i }))
    await waitFor(() => expect(h.requestEmailSignupOtp).toHaveBeenCalledWith({ email: "cand@example.invalid", mode: "verify_email" }))

    await user.type(await screen.findByPlaceholderText("Enter OTP"), "000000")
    await user.click(screen.getByRole("button", { name: /Verify and continue/i }))
    await waitFor(() => expect(h.verifyOtp).toHaveBeenCalledWith({ identifier: "cand@example.invalid", otp: "000000", purpose: "Signup", identifierType: "Email", otp_log: "OTPLOG-TEST-1" }))

    await user.type(await screen.findByLabelText("New Password"), "synthetic-new")
    await user.type(screen.getByLabelText("Confirm New Password"), "synthetic-new")
    await user.click(screen.getByRole("button", { name: /Set password/i }))
    await waitFor(() => expect(h.setPassword).toHaveBeenCalledWith("synthetic-new"))
    expect(h.signOut).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/login?redirect=%2Fopen-jobs"))
  })

  // Spec: CAND-03-A6.2B (docs/spec/clauses/03-authentication.md#cand-03-a6-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("password-reset path: purpose=Password Reset calls resetPassword instead of requestEmailSignupOtp and verifies with the Password Reset purpose", async () => {
    h.params.value = { purpose: "Password Reset", email: "cand@example.invalid" }
    h.resetPassword.mockResolvedValue({ otp_log: "OTPLOG-TEST-2" })
    render(<VerifyEmailPage />)
    await user.click(screen.getByRole("button", { name: /Send verification code/i }))
    await waitFor(() => expect(h.resetPassword).toHaveBeenCalledWith("cand@example.invalid"))
    expect(h.requestEmailSignupOtp).not.toHaveBeenCalled()

    await user.type(await screen.findByPlaceholderText("Enter OTP"), "000000")
    await user.click(screen.getByRole("button", { name: /Verify and continue/i }))
    await waitFor(() => expect(h.verifyOtp).toHaveBeenCalledWith({ identifier: "cand@example.invalid", otp: "000000", purpose: "Password Reset", identifierType: "Email", otp_log: "OTPLOG-TEST-2" }))
  })
})
