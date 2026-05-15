import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import {
  auth,
  createProfile,
  getEnabledOAuthProviders,
  getProfile,
  getUserRole,
  isAuthenticated,
  isOAuthProviderEnabled,
  onAuthStateChange,
  profileFromFrappeUser,
  updateProfile,
} from "@/lib/auth"
import { supabase } from "@/lib/supabase"

const mockSupabase = supabase as unknown as { from: Mock }
const fetchMock = vi.fn()

function frappePayload(message: unknown, ok = true) {
  return Promise.resolve({
    ok,
    statusText: ok ? "OK" : "Bad Request",
    text: () => Promise.resolve(JSON.stringify({ message })),
  } as Response)
}

function mockInsertChain(result: unknown) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  mockSupabase.from.mockReturnValue({ insert })
}

function mockSelectChain(result: unknown) {
  const single = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  mockSupabase.from.mockReturnValue({ select })
}

function mockUpdateChain(result: unknown) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })
  mockSupabase.from.mockReturnValue({ update })
}

describe("Frappe candidate auth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_FRAPPE_URL", "http://127.0.0.1:8005")
    vi.stubGlobal("fetch", fetchMock)
  })

  it("signs up through the recruitment Frappe API", async () => {
    fetchMock.mockResolvedValueOnce(frappePayload({
      status: "otp_required",
      user: { name: "candidate@example.com", email: "candidate@example.com", full_name: "Candidate One" },
      otp_log: "CAND-OTP-2026-00001",
      delivery_status: "Sent",
    }))

    const result = await auth.signUp({
      email: "candidate@example.com",
      password: "Candidate@12345",
      fullName: "Candidate One",
    })

    expect(result.status).toBe("otp_required")
    expect(result.user?.email).toBe("candidate@example.com")
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8005/api/method/recruitment.api.candidate_auth.signup",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: "candidate@example.com",
          password: "Candidate@12345",
          full_name: "Candidate One",
        }),
      }),
    )
  })

  it("verifies an OTP and returns a session-shaped user", async () => {
    fetchMock.mockResolvedValueOnce(frappePayload({
      status: "success",
      user: { name: "candidate@example.com", email: "candidate@example.com", full_name: "Candidate One" },
    }))

    const result = await auth.verifyOtp({
      identifier: "candidate@example.com",
      otp: "123456",
      purpose: "Signup",
      identifierType: "Email",
    })

    expect(result.session?.user.email).toBe("candidate@example.com")
    expect(result.user?.user_metadata.full_name).toBe("Candidate One")
  })

  it("logs in with password through Frappe", async () => {
    fetchMock.mockResolvedValueOnce(frappePayload({
      status: "success",
      user: { name: "candidate@example.com", email: "candidate@example.com" },
    }))

    const result = await auth.signIn({ email: "candidate@example.com", password: "Candidate@12345" })

    expect(result.user?.id).toBe("candidate@example.com")
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8005/api/method/recruitment.api.candidate_auth.login",
      expect.objectContaining({ credentials: "include" }),
    )
  })

  it("hydrates the current Frappe session", async () => {
    fetchMock.mockResolvedValueOnce(frappePayload({
      user: { name: "candidate@example.com", email: "candidate@example.com" },
    }))

    await expect(auth.getSession()).resolves.toMatchObject({
      user: { email: "candidate@example.com" },
    })
  })

  it("returns false for isAuthenticated when Frappe session lookup fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"))
    await expect(isAuthenticated()).resolves.toBe(false)
  })

  it("maps a Frappe user into the existing profile shape", () => {
    const profile = profileFromFrappeUser({
      id: "candidate@example.com",
      name: "candidate@example.com",
      email: "candidate@example.com",
      full_name: "Candidate One",
      user_metadata: {},
    })

    expect(profile.role).toBe("candidate")
    expect(profile.provider).toBe("frappe")
    expect(profile.frappe_employee_id).toBeNull()
  })

  it("keeps OAuth disabled until configured in Frappe auth", async () => {
    expect(getEnabledOAuthProviders()).toEqual([])
    expect(isOAuthProviderEnabled()).toBe(false)
    await expect(auth.signInWithOAuth("google")).rejects.toThrow("not enabled")
  })

  it("returns a noop auth-state subscription for compatibility", () => {
    const result = onAuthStateChange(vi.fn())
    expect(result.data.subscription.unsubscribe()).toBeUndefined()
  })
})

describe("profile helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a profile through the existing Supabase profile table helper", async () => {
    const profile = { id: "user-1", email: "test@example.com" }
    mockInsertChain({ data: profile, error: null })

    await expect(createProfile("user-1", { email: "test@example.com" })).resolves.toBe(profile)
  })

  it("returns null when a profile row is absent", async () => {
    mockSelectChain({ data: null, error: { code: "PGRST116", message: "No rows found" } })
    await expect(getProfile("user-1")).resolves.toBeNull()
  })

  it("updates a profile through the existing Supabase profile table helper", async () => {
    const updated = { id: "user-1", email: "new@example.com" }
    mockUpdateChain({ data: updated, error: null })

    await expect(updateProfile("user-1", { email: "new@example.com" })).resolves.toBe(updated)
  })

  it("returns the candidate role for Frappe-auth users", async () => {
    await expect(getUserRole()).resolves.toBe("candidate")
  })
})
