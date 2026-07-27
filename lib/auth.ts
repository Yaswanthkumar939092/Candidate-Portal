import type { Profile } from "@/types/database";
import { frappeApiBase } from "@/lib/frappe-base";

const FRAPPE_AUTH_METHOD = "recruitment.api.candidate_auth";

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  mobileNo?: string;
  candidateSource?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface RequestOtpData {
  identifier: string;
  purpose?: "Signup" | "Login" | "Verify Email" | "Verify Mobile" | "Password Reset";
  identifierType?: "Email" | "Mobile";
  mode?: "password_reset" | "verify_email";
}

export interface VerifyOtpData extends RequestOtpData {
  otp: string;
  otp_log?: string;
}

export interface RequestEmailSignupOtpData {
  email: string;
  mode?: "password_reset" | "verify_email";
}

export interface RequestEmailSignupOtpResponse {
  status: string;
  otp_log?: string;
  delivery_status?: string;
  purpose?: string;
  mode?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface OAuthProvider {
  provider: "google" | "linkedin";
  enabled: boolean;
}

export interface OAuthError extends AuthError {
  provider?: string;
}

export interface FrappeAuthUser {
  id: string;
  name: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  user_image?: string | null;
  avatar_url?: string | null;
  mobile_no?: string;
  enabled?: 0 | 1 | boolean;
  status?: string;
  user_type?: string;
  roles?: string[];
  password_setup_required?: boolean;
  user_metadata: {
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string;
  };
  last_login_at?: string | null;
}

export interface FrappeSession {
  user: FrappeAuthUser;
  session_id?: string;
}

export interface FrappeAuthSettings {
  enabled: 0 | 1;
  allow_password_login: 0 | 1;
  allow_email_otp_login: 0 | 1;
  allow_signup: 0 | 1;
  signup_requires_otp_verification: 0 | 1;
  enable_email_otp: 0 | 1;
  enable_mobile_otp: 0 | 1;
  mobile_delivery_mode: "Disabled" | "Frappe SMS Settings";
  enable_email_signup?: 0 | 1;
  redirect_to?: string;
  primary_color?: string | null;
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";

interface FrappeResponse<T> {
  message?: T;
  exc?: string;
  exception?: string;
  _server_messages?: string;
}

async function frappeMethod<T>(method: string, body?: Record<string, unknown>, init?: RequestInit): Promise<T> {
  const baseUrl = frappeApiBase();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_FRAPPE_URL is required");
  }

  const isGet = !body;
  // baseUrl may be a same-origin relative prefix ("/backend"), so build a plain
  // string rather than `new URL()` which requires an absolute URL.
  const url = `${baseUrl}/api/method/${method}`;
  const response = await fetch(url, {
    method: isGet ? "GET" : "POST",
    credentials: "include",
    headers: isGet ? undefined : { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as FrappeResponse<T>) : {};
  if (!response.ok || payload.exc || payload.exception) {
    throw new Error(extractFrappeError(payload) || response.statusText || "Frappe request failed");
  }

  return payload.message as T;
}

function extractFrappeError(payload: FrappeResponse<unknown>) {
  if (payload._server_messages) {
    try {
      const messages = JSON.parse(payload._server_messages) as string[];
      const parsed = messages.map((message) => JSON.parse(message).message).filter(Boolean);
      if (parsed.length) return parsed.join("\n");
    } catch {
      return payload._server_messages;
    }
  }
  return payload.exception || payload.exc;
}

function mapUser(user: Partial<FrappeAuthUser> | null | undefined): FrappeAuthUser | null {
  if (!user?.email && !user?.name) return null;
  const email = user.email || user.name || "";
  const fullName = user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || email;
  return {
    ...user,
    id: user.name || email,
    name: user.name || email,
    email,
    full_name: fullName,
    user_metadata: {
      full_name: fullName,
      avatar_url: user.user_image || null,
      email,
      ...(user.user_metadata || {}),
    },
  } as FrappeAuthUser;
}

export function profileFromFrappeUser(user: FrappeAuthUser): Profile {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name || user.user_metadata.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || user.avatar_url || user.user_image || null,
    phone: user.mobile_no || null,
    location: null,
    bio: null,
    skills: null,
    experience_level: null,
    preferred_salary_min: null,
    preferred_salary_max: null,
    preferred_job_types: null,
    role: "candidate",
    provider: "frappe",
    lifecycle_stage: "candidate",
    frappe_employee_id: null,
    is_internal_employee: false,
    email_domain: user.email.split("@")[1] || null,
    created_at: now,
    updated_at: now,
    last_login_at: user.last_login_at || null,
  };
}

export const auth = {
  signUp: async ({ email, password, fullName, mobileNo, candidateSource }: SignUpData) => {
    const data = await frappeMethod<{ status?: string; user: FrappeAuthUser; session_id?: string; otp_log?: string; delivery_status?: string }>(
      `${FRAPPE_AUTH_METHOD}.signup`,
      { email, password, full_name: fullName, mobile_no: mobileNo, candidate_source: candidateSource },
    );
    const user = mapUser(data.user);
    const isSuccess = data.status === "success" || !!user;
    return { ...data, user, session: isSuccess && user ? { user, session_id: data.session_id } : null };
  },

  signIn: async ({ email, password }: SignInData) => {
    const data = await frappeMethod<{ status?: string; user: FrappeAuthUser; session_id?: string }>(
      `${FRAPPE_AUTH_METHOD}.login`,
      { email, password },
    );
    const user = mapUser(data.user);
    const isSuccess = data.status === "success";
    return { ...data, user, session: isSuccess && user ? { user, session_id: data.session_id } : null };
  },

  requestOtp: async ({ identifier, purpose = "Login", identifierType = "Email", mode }: RequestOtpData) => {
    return frappeMethod<{ status: string; otp_log?: string; delivery_status?: string; purpose?: string; mode?: string }>(
      `${FRAPPE_AUTH_METHOD}.request_otp`,
      { identifier, purpose, identifier_type: identifierType, mode },
    );
  },

  requestEmailSignupOtp: async ({ email, mode = "verify_email" }: RequestEmailSignupOtpData): Promise<RequestEmailSignupOtpResponse> => {
    return frappeMethod<RequestEmailSignupOtpResponse>(
      `${FRAPPE_AUTH_METHOD}.request_email_signup_otp`,
      { email, mode },
    );
  },

  verifyOtp: async ({ identifier, otp, purpose = "Login", identifierType = "Email", otp_log }: VerifyOtpData) => {
    const data = await frappeMethod<{ status?: string; user: FrappeAuthUser; session_id?: string }>(
      `${FRAPPE_AUTH_METHOD}.verify_otp`,
      { identifier, otp, purpose, identifier_type: identifierType, otp_log },
    );
    const user = mapUser(data.user);
    return { user, session: user ? { user, session_id: data.session_id } : null };
  },

  signOut: async () => {
    await frappeMethod(`${FRAPPE_AUTH_METHOD}.logout`, {});
  },

  resetPassword: async (email: string) => {
    return auth.requestOtp({ identifier: email, purpose: "Password Reset", mode: "password_reset" });
  },

  updatePassword: async () => {
    throw new Error("Password updates are managed from Frappe for candidate accounts.");
  },

  setPassword: async (password: string): Promise<{ status?: string; user: FrappeAuthUser | null }> => {
    const data = await frappeMethod<{ status?: string; user: FrappeAuthUser }>(
      `${FRAPPE_AUTH_METHOD}.set_password`,
      { password },
    );
    const user = mapUser(data.user);
    return { status: data.status, user };
  },

  getSession: async (): Promise<FrappeSession | null> => {
    const data = await frappeMethod<{ user: FrappeAuthUser | null; session_id?: string }>(`${FRAPPE_AUTH_METHOD}.me`);
    const user = mapUser(data.user);
    return user ? { user, session_id: data.session_id } : null;
  },

  getCurrentUser: async () => {
    const session = await auth.getSession();
    return session?.user || null;
  },

  getAuthSettings: async (): Promise<FrappeAuthSettings> => {
    return frappeMethod<FrappeAuthSettings>(`${FRAPPE_AUTH_METHOD}.get_auth_settings`);
  },

  signInWithGoogle: async () => {
    throw new Error("Google sign-in is not enabled for Frappe candidate auth yet.");
  },

  signInWithLinkedIn: async () => {
    throw new Error("LinkedIn sign-in is not enabled for Frappe candidate auth yet.");
  },

  signInWithOAuth: async (provider: "google" | "linkedin") => {
    throw new Error(`${provider} sign-in is not enabled for Frappe candidate auth yet.`);
  },
};

export const onAuthStateChange = (
  _callback: (event: AuthChangeEvent, session: FrappeSession | null) => void,
) => {
  return { data: { subscription: { unsubscribe: () => undefined } } };
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    return Boolean(await auth.getSession());
  } catch {
    return false;
  }
};

export const getUserRole = async (): Promise<string | null> => "candidate";

export const getEnabledOAuthProviders = (): OAuthProvider[] => [];

export const isOAuthProviderEnabled = (): boolean => false;

export const requireAuth = async () => {
  const session = await auth.getSession();
  if (!session) throw new Error("Authentication required");
  return session;
};
