import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { auth, isAuthenticated, profileFromFrappeUser, getUserRole, requireAuth } from "@/lib/auth"

let fetchMock: ReturnType<typeof vi.fn>

function reply(body: unknown, init: { ok?: boolean; statusText?: string } = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    statusText: init.statusText ?? "OK",
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  } as Response)
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe("auth client request shape", () => {
  // Spec: CAND-03-A1.1A (docs/spec/clauses/03-authentication.md#cand-03-a1-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("sends a GET with no body for getSession and a POST with a JSON body for every other method", async () => {
    fetchMock.mockImplementation(() => reply({ message: { user: null } }))
    await auth.getSession()
    await auth.signOut()

    const [getUrl, getInit] = fetchMock.mock.calls[0]
    expect(getUrl).toBe("/backend/api/method/recruitment.api.candidate_auth.me")
    expect(getInit).toMatchObject({ method: "GET", credentials: "include", headers: undefined, body: undefined })

    const [postUrl, postInit] = fetchMock.mock.calls[1]
    expect(postUrl).toBe("/backend/api/method/recruitment.api.candidate_auth.logout")
    expect(postInit).toMatchObject({ method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
  })

  // Spec: CAND-03-A1.1B (docs/spec/clauses/03-authentication.md#cand-03-a1-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("throws the _server_messages text, else exception, else exc, else statusText, and treats exc on an ok response as failure", async () => {
    fetchMock.mockImplementationOnce(() => reply({ _server_messages: JSON.stringify([JSON.stringify({ message: "Wrong password" }), JSON.stringify({ message: "Second" })]) }, { ok: false, statusText: "Bad" }))
    await expect(auth.getSession()).rejects.toThrow("Wrong password\nSecond")

    fetchMock.mockImplementationOnce(() => reply({ _server_messages: "not json" }, { ok: false }))
    await expect(auth.getSession()).rejects.toThrow("not json")

    fetchMock.mockImplementationOnce(() => reply({ exception: "frappe.AuthenticationError: bad" }, { ok: false }))
    await expect(auth.getSession()).rejects.toThrow("frappe.AuthenticationError: bad")

    fetchMock.mockImplementationOnce(() => reply({ exc: "Traceback text" }))
    await expect(auth.getSession()).rejects.toThrow("Traceback text")

    fetchMock.mockImplementationOnce(() => reply("", { ok: false, statusText: "Forbidden" }))
    await expect(auth.getSession()).rejects.toThrow("Forbidden")

    fetchMock.mockImplementationOnce(() => reply("", { ok: false, statusText: "" }))
    await expect(auth.getSession()).rejects.toThrow("Frappe request failed")
  })

  // Spec: CAND-03-A1.1C (docs/spec/clauses/03-authentication.md#cand-03-a1-1c)
  // Characterization: pins current behaviour, not endorsed.
  it("rejects a non-JSON body with a SyntaxError and returns undefined for an empty ok body", async () => {
    fetchMock.mockImplementationOnce(() => reply("<html>oops</html>"))
    await expect(auth.requestOtp({ identifier: "a@example.invalid" })).rejects.toBeInstanceOf(SyntaxError)

    fetchMock.mockImplementationOnce(() => reply(""))
    await expect(auth.requestOtp({ identifier: "a@example.invalid" })).resolves.toBeUndefined()
  })
})

describe("auth client without a configured backend", () => {
  // Spec: CAND-03-A1.1D (docs/spec/clauses/03-authentication.md#cand-03-a1-1d)
  // Characterization: pins current behaviour, not endorsed.
  it("throws NEXT_PUBLIC_FRAPPE_URL is required, without a request, when it runs on the server with neither backend URL set", async () => {
    vi.stubGlobal("window", undefined)
    vi.stubEnv("FRAPPE_BASE_URL", "")
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "")
    await expect(auth.getSession()).rejects.toThrow("NEXT_PUBLIC_FRAPPE_URL is required")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("auth client session mapping", () => {
  // Spec: CAND-03-A2.1A (docs/spec/clauses/03-authentication.md#cand-03-a2-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("builds id, name, e-mail and full name from whichever fields the server sent, and returns null when it sent neither e-mail nor name", async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: { user: { first_name: "Test", last_name: "Candidate", name: "CAND-TEST-0001@example.invalid", user_image: "/files/a.png" }, session_id: "sid-test" } }))
    const session = await auth.getSession()
    expect(session).toMatchObject({
      session_id: "sid-test",
      user: {
        id: "CAND-TEST-0001@example.invalid",
        name: "CAND-TEST-0001@example.invalid",
        email: "CAND-TEST-0001@example.invalid",
        full_name: "Test Candidate",
        user_metadata: { full_name: "Test Candidate", avatar_url: "/files/a.png", email: "CAND-TEST-0001@example.invalid" },
      },
    })

    fetchMock.mockImplementationOnce(() => reply({ message: { user: { first_name: "No", last_name: "Identity" } } }))
    expect(await auth.getSession()).toBeNull()

    fetchMock.mockImplementationOnce(() => reply({ message: { user: { email: "only@example.invalid" } } }))
    const bare = await auth.getSession()
    expect(bare?.user.full_name).toBe("only@example.invalid")
    expect(bare?.user.user_metadata.avatar_url).toBeNull()
  })

  // Spec: CAND-03-A2.1B (docs/spec/clauses/03-authentication.md#cand-03-a2-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("reports false from isAuthenticated for a null session and a failed lookup, and true for a session", async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: { user: null } }))
    expect(await isAuthenticated()).toBe(false)
    fetchMock.mockImplementationOnce(() => reply("", { ok: false, statusText: "Forbidden" }))
    expect(await isAuthenticated()).toBe(false)
    fetchMock.mockImplementationOnce(() => reply({ message: { user: { email: "a@example.invalid" } } }))
    expect(await isAuthenticated()).toBe(true)
  })

  // Spec: CAND-03-A2.2A (docs/spec/clauses/03-authentication.md#cand-03-a2-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("builds a candidate profile with fixed role, provider and stage, and takes the domain from the e-mail", () => {
    const profile = profileFromFrappeUser({
      id: "u1", name: "u1", email: "person@Example.INVALID", full_name: null, mobile_no: "0000000000", user_image: "/files/p.png",
      user_metadata: { full_name: "Meta Name", avatar_url: null },
    })
    expect(profile).toMatchObject({
      id: "u1", email: "person@Example.INVALID", full_name: "Meta Name", avatar_url: "/files/p.png", phone: "0000000000",
      role: "candidate", provider: "frappe", lifecycle_stage: "candidate", is_internal_employee: false, frappe_employee_id: null, email_domain: "Example.INVALID",
    })
  })

  // Spec: CAND-03-A2.2B (docs/spec/clauses/03-authentication.md#cand-03-a2-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("returns the fixed 'candidate' role without any request and throws from requireAuth when there is no session", async () => {
    expect(await getUserRole()).toBe("candidate")
    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockImplementationOnce(() => reply({ message: { user: null } }))
    await expect(requireAuth()).rejects.toThrow("Authentication required")
  })
})

describe("auth client sign-in results", () => {
  // Spec: CAND-03-A3.1A (docs/spec/clauses/03-authentication.md#cand-03-a3-1a)
  // Characterization: pins current behaviour, not endorsed.
  it("gives signIn a session only when the server status is exactly 'success', while signUp accepts any reply that carries a user", async () => {
    const user = { name: "c@example.invalid", email: "c@example.invalid" }
    fetchMock.mockImplementationOnce(() => reply({ message: { status: "success", user, session_id: "s1" } }))
    expect((await auth.signIn({ email: "c@example.invalid", password: "x" })).session).toMatchObject({ session_id: "s1" })

    fetchMock.mockImplementationOnce(() => reply({ message: { status: "password_verified", user } }))
    expect((await auth.signIn({ email: "c@example.invalid", password: "x" })).session).toBeNull()

    fetchMock.mockImplementationOnce(() => reply({ message: { status: "otp_required", user } }))
    expect((await auth.signUp({ email: "c@example.invalid", password: "x" })).session).not.toBeNull()

    fetchMock.mockImplementationOnce(() => reply({ message: { status: "otp_required", user: null } }))
    expect((await auth.signUp({ email: "c@example.invalid", password: "x" })).session).toBeNull()
  })

  // Spec: CAND-03-A3.1B (docs/spec/clauses/03-authentication.md#cand-03-a3-1b)
  // Characterization: pins current behaviour, not endorsed.
  it("gives verifyOtp a session whenever a user comes back, whatever the status", async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: { status: "anything", user: { email: "c@example.invalid" }, session_id: "s2" } }))
    const out = await auth.verifyOtp({ identifier: "c@example.invalid", otp: "000000" })
    expect(out.session).toMatchObject({ session_id: "s2" })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ identifier: "c@example.invalid", otp: "000000", purpose: "Login", identifier_type: "Email" })
  })

  // Spec: CAND-03-A3.2A (docs/spec/clauses/03-authentication.md#cand-03-a3-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("maps resetPassword to a Password Reset OTP request and rejects updatePassword and every OAuth sign-in without a network call", async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: { status: "otp_required" } }))
    await auth.resetPassword("c@example.invalid")
    expect(fetchMock.mock.calls[0][0]).toBe("/backend/api/method/recruitment.api.candidate_auth.request_otp")
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ identifier: "c@example.invalid", purpose: "Password Reset", identifier_type: "Email", mode: "password_reset" })

    fetchMock.mockClear()
    await expect(auth.updatePassword()).rejects.toThrow("Password updates are managed from Frappe for candidate accounts.")
    await expect(auth.signInWithGoogle()).rejects.toThrow("Google sign-in is not enabled for Frappe candidate auth yet.")
    await expect(auth.signInWithLinkedIn()).rejects.toThrow("LinkedIn sign-in is not enabled for Frappe candidate auth yet.")
    await expect(auth.signInWithOAuth("linkedin")).rejects.toThrow("linkedin sign-in is not enabled for Frappe candidate auth yet.")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Spec: CAND-03-A3.3A (docs/spec/clauses/03-authentication.md#cand-03-a3-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("requests the auth settings with a GET to get_auth_settings and returns the message unchanged", async () => {
    const settings = { enabled: 1, allow_password_login: 1, allow_signup: 0 }
    fetchMock.mockImplementationOnce(() => reply({ message: settings }))
    expect(await auth.getAuthSettings()).toEqual(settings)
    expect(fetchMock.mock.calls[0][0]).toBe("/backend/api/method/recruitment.api.candidate_auth.get_auth_settings")
    expect(fetchMock.mock.calls[0][1].method).toBe("GET")
  })
})
