import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const h = vi.hoisted(() => ({
  push: vi.fn(),
  redirectParam: { value: null as string | null },
  settings: { value: undefined as unknown, loading: false },
  signIn: vi.fn(),
  signUp: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getPostLoginRoute: vi.fn(),
  refreshProfile: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("sonner", () => ({ toast: { error: h.toastError, success: vi.fn() } }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, replace: vi.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === "redirect" ? h.redirectParam.value : null) }),
}))
vi.mock("next/image", () => ({ __esModule: true, default: (p: Record<string, unknown>) => <img alt="" {...p} /> }))
vi.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))
vi.mock("@/lib/auth", () => ({
  auth: { signIn: h.signIn, signUp: h.signUp, requestOtp: h.requestOtp, verifyOtp: h.verifyOtp },
}))
vi.mock("@/lib/hooks/useAuthSettings", () => ({
  useAuthSettings: () => ({ data: h.settings.value, isLoading: h.settings.loading, error: null }),
}))
vi.mock("@/lib/hooks/useAuthPageContent", () => ({ useAuthPageContent: () => ({ data: undefined }) }))
vi.mock("@/lib/hooks/useCandidateBranding", () => ({ useCandidateBranding: () => ({ data: null }) }))
vi.mock("@/lib/services/survey", () => ({ surveyService: { getPostLoginRoute: h.getPostLoginRoute } }))
vi.mock("@/lib/contexts/auth-context", () => ({ useAuth: () => ({ refreshProfile: h.refreshProfile }) }))

import LoginPage from "@/app/(auth)/login/page"
import RegisterPage from "@/app/(auth)/register/page"

const base = { enabled: 1, allow_password_login: 1, allow_email_otp_login: 0, enable_email_otp: 0, allow_signup: 1 }
const user = userEvent.setup()

async function signInWith(settings: Record<string, unknown>) {
  h.settings.value = settings
  render(<LoginPage />)
  await user.type(await screen.findByPlaceholderText("you@example.com"), "cand@example.invalid")
  await user.type(screen.getByPlaceholderText("Enter your password"), "synthetic-pass")
  await user.click(screen.getByRole("button", { name: /Sign in to your account/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  h.redirectParam.value = null
  h.settings.value = { ...base }
  h.settings.loading = false
  h.signIn.mockResolvedValue({ status: "success" })
  h.requestOtp.mockResolvedValue({ status: "otp_required" })
  h.verifyOtp.mockResolvedValue({})
  h.refreshProfile.mockResolvedValue(undefined)
  h.getPostLoginRoute.mockResolvedValue({ survey_required: false, redirect_url: "/open-jobs" })
})

describe("login page after a successful password sign-in", () => {
  // Spec: CAND-03-A4.1A (docs/spec/clauses/03-authentication.md#cand-03-a4-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("refreshes the profile, asks the server for the post-login route and goes to /survey when a survey is required", async () => {
    h.getPostLoginRoute.mockResolvedValue({ survey_required: true, redirect_url: "/ignored" })
    h.redirectParam.value = "/ignored-too"
    await signInWith(base)
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/survey"))
    expect(h.push).toHaveBeenCalledTimes(1)
    expect(h.refreshProfile).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem("showLoginToast")).toBe("true")
  })

  // Spec: CAND-03-A4.1B (docs/spec/clauses/03-authentication.md#cand-03-a4-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("pushes the redirect query value exactly as given, even an absolute URL, ahead of the server's redirect_url", async () => {
    h.redirectParam.value = "https://elsewhere.example.invalid/landing"
    await signInWith(base)
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("https://elsewhere.example.invalid/landing"))
    expect(h.push).toHaveBeenCalledTimes(1)
  })

  // Spec: CAND-03-A4.1C (docs/spec/clauses/03-authentication.md#cand-03-a4-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("uses the server's redirect_url, falls back to /dashboard when it is empty, and still routes when the route call fails", async () => {
    await signInWith(base)
    await waitFor(() => expect(h.push).toHaveBeenLastCalledWith("/open-jobs"))
    document.body.innerHTML = ""

    h.push.mockClear()
    h.getPostLoginRoute.mockResolvedValue({ survey_required: false })
    await signInWith(base)
    await waitFor(() => expect(h.push).toHaveBeenLastCalledWith("/dashboard"))
    document.body.innerHTML = ""

    h.push.mockClear()
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    h.getPostLoginRoute.mockRejectedValue(new Error("down"))
    h.redirectParam.value = "/my-jobs"
    await signInWith(base)
    await waitFor(() => expect(h.push).toHaveBeenLastCalledWith("/my-jobs"))
    expect(window.sessionStorage.getItem("showLoginToast")).toBe("true")
    spy.mockRestore()
  })

  // Spec: CAND-03-A4.2A (docs/spec/clauses/03-authentication.md#cand-03-a4-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("asks for a login OTP after the password step only when both allow_email_otp_login and enable_email_otp are 1, and does not route yet", async () => {
    await signInWith({ ...base, allow_email_otp_login: 1, enable_email_otp: 1 })
    await screen.findByPlaceholderText("Enter OTP")
    expect(h.requestOtp).toHaveBeenCalledWith({ identifier: "cand@example.invalid", purpose: "Login", identifierType: "Email" })
    expect(h.getPostLoginRoute).not.toHaveBeenCalled()
    expect(h.push).not.toHaveBeenCalled()
    document.body.innerHTML = ""

    h.requestOtp.mockClear()
    await signInWith({ ...base, allow_email_otp_login: 1, enable_email_otp: 0 })
    await waitFor(() => expect(h.push).toHaveBeenCalled())
    expect(h.requestOtp).not.toHaveBeenCalled()
  })
})

describe("login page gating by auth settings", () => {
  // Spec: CAND-03-A4.3A (docs/spec/clauses/03-authentication.md#cand-03-a4-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows a notice instead of the form while settings load, when they are missing, when disabled and when password login is off", () => {
    h.settings.loading = true
    h.settings.value = undefined
    const a = render(<LoginPage />)
    expect(screen.getByText("Loading login")).toBeTruthy()
    a.unmount()

    h.settings.loading = false
    const b = render(<LoginPage />)
    expect(screen.getByText("Unable to load candidate authentication settings.")).toBeTruthy()
    b.unmount()

    h.settings.value = { ...base, enabled: 0 }
    const c = render(<LoginPage />)
    expect(screen.getByText("Candidate portal authentication is disabled.")).toBeTruthy()
    c.unmount()

    h.settings.value = { ...base, allow_password_login: 0 }
    render(<LoginPage />)
    expect(screen.getByText("Password login is not enabled for candidate accounts.")).toBeTruthy()
    expect(screen.queryByPlaceholderText("Enter your password")).toBeNull()
  })

  // Spec: CAND-03-A4.3B (docs/spec/clauses/03-authentication.md#cand-03-a4-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("sends the visitor to /verify-email with the e-mail and the redirect when sign-in says the e-mail OTP is not verified", async () => {
    h.signIn.mockRejectedValue(new Error("Please verify your email OTP before signing in."))
    h.redirectParam.value = "/open-jobs"
    await signInWith(base)
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/verify-email?email=cand%40example.invalid&redirect=%2Fopen-jobs"))
    expect(h.toastError).toHaveBeenCalledWith("Please verify your email OTP before signing in.")
  })
})

describe("register page", () => {
  async function fillAndSubmit(email: string) {
    render(<RegisterPage />)
    await user.type(await screen.findByPlaceholderText("John Doe"), "Test Candidate")
    await user.type(screen.getByPlaceholderText("you@example.com"), email)
    await user.type(screen.getByPlaceholderText("Create a strong password"), "synthetic-pass")
    await user.type(screen.getByPlaceholderText("Re-enter your password"), "synthetic-pass")
    fireEvent.submit(screen.getByPlaceholderText("you@example.com").closest("form")!)
  }

  // Spec: CAND-03-A5.1A (docs/spec/clauses/03-authentication.md#cand-03-a5-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("blocks sign-up with a message when the campus invite e-mail in the redirect differs from the typed e-mail", async () => {
    h.redirectParam.value = "/campus-apply?campus_invite=CINV-TEST-1&email=invited%40example.invalid"
    await fillAndSubmit("someone-else@example.invalid")
    await screen.findByText("The registered email mismatched")
    expect(h.signUp).not.toHaveBeenCalled()
    expect(h.toastError).toHaveBeenCalledWith("The registered email mismatched")
  })

  // Spec: CAND-03-A5.1B (docs/spec/clauses/03-authentication.md#cand-03-a5-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("when the server needs an OTP it shows the verify form, and a verified OTP pushes the redirect value as given", async () => {
    h.signUp.mockResolvedValue({ status: "otp_required" })
    h.redirectParam.value = "/open-jobs"
    await fillAndSubmit("cand@example.invalid")
    await screen.findByText("Verify your email")
    expect(h.signUp).toHaveBeenCalledWith({ email: "cand@example.invalid", password: "synthetic-pass", fullName: "Test Candidate", candidateSource: undefined })
    await user.type(screen.getByLabelText("Email OTP"), "000000")
    await user.click(screen.getByRole("button", { name: "Verify and continue" }))
    await waitFor(() => expect(h.verifyOtp).toHaveBeenCalledWith({ identifier: "cand@example.invalid", otp: "000000", purpose: "Signup", identifierType: "Email" }))
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/open-jobs"))
  })

  // Spec: CAND-03-A5.1C (docs/spec/clauses/03-authentication.md#cand-03-a5-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("shows a notice instead of the form when sign-up is disabled in the auth settings", () => {
    h.settings.value = { ...base, allow_signup: 0 }
    render(<RegisterPage />)
    expect(screen.getByText("Candidate signup is disabled.")).toBeTruthy()
    expect(screen.queryByPlaceholderText("Create a strong password")).toBeNull()
  })
})

describe("register page campus source and password check", () => {
  async function submit(email: string, password: string, confirm: string) {
    render(<RegisterPage />)
    await user.type(await screen.findByPlaceholderText("John Doe"), "Test Candidate")
    await user.type(screen.getByPlaceholderText("you@example.com"), email)
    await user.type(screen.getByPlaceholderText("Create a strong password"), password)
    await user.type(screen.getByPlaceholderText("Re-enter your password"), confirm)
    fireEvent.submit(screen.getByPlaceholderText("you@example.com").closest("form")!)
  }

  // Spec: CAND-03-A5.2A (docs/spec/clauses/03-authentication.md#cand-03-a5-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends candidateSource Campus when the redirect path is /campus-apply or below it, and nothing otherwise", async () => {
    h.signUp.mockResolvedValue({ status: "success" })
    for (const [redirect, expected] of [["/campus-apply", "Campus"], ["/campus-apply?campus_invite=CINV-TEST-1", "Campus"], ["/campus-apply/extra", "Campus"], ["/campus-applyx", undefined], ["/open-jobs", undefined]] as const) {
      h.signUp.mockClear()
      h.redirectParam.value = redirect
      await submit("cand@example.invalid", "synthetic-pass", "synthetic-pass")
      await waitFor(() => expect(h.signUp).toHaveBeenCalledTimes(1))
      expect(h.signUp.mock.calls[0][0].candidateSource).toBe(expected)
      document.body.innerHTML = ""
    }
  })

  // Spec: CAND-03-A5.3A (docs/spec/clauses/03-authentication.md#cand-03-a5-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("shows Passwords do not match and makes no sign-up call when the two password fields differ", async () => {
    await submit("cand@example.invalid", "synthetic-one", "synthetic-two")
    await screen.findByText("Passwords do not match")
    expect(h.signUp).not.toHaveBeenCalled()
  })

  // Spec: CAND-03-A5.4A (docs/spec/clauses/03-authentication.md#cand-03-a5-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends a signed-up visitor straight to the redirect value, or /dashboard, when the server does not ask for an OTP", async () => {
    h.signUp.mockResolvedValue({ status: "success" })
    await submit("cand@example.invalid", "synthetic-pass", "synthetic-pass")
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/dashboard"))
    document.body.innerHTML = ""

    h.push.mockClear()
    h.redirectParam.value = "/open-jobs"
    await submit("cand@example.invalid", "synthetic-pass", "synthetic-pass")
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/open-jobs"))
  })
})

describe("campus e-mail taken from the redirect value", () => {
  // Spec: CAND-03-A4.4A (docs/spec/clauses/03-authentication.md#cand-03-a4-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("throws a URIError while rendering the login and register pages when the campus-apply redirect carries a malformed percent escape in email", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    h.redirectParam.value = "/campus-apply?campus_invite=CINV-TEST-1&email=%E0%A4%A"
    expect(() => render(<LoginPage />)).toThrow(URIError)
    expect(() => render(<RegisterPage />)).toThrow(URIError)
    spy.mockRestore()

    h.redirectParam.value = "/campus-apply?campus_invite=CINV-TEST-1&email=ok%40example.invalid"
    document.body.innerHTML = ""
    render(<LoginPage />)
    expect((screen.getByPlaceholderText("you@example.com") as HTMLInputElement).value).toBe("ok@example.invalid")
  })
})
