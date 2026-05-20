import type { Profile, ProfileInsert } from "@/types/database";

const FRAPPE_AUTH_METHOD = "recruitment.api.candidate_auth";

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  mobileNo?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface RequestOtpData {
  identifier: string;
  purpose?: "Signup" | "Login" | "Verify Email" | "Verify Mobile" | "Password Reset";
  identifierType?: "Email" | "Mobile";
}

export interface VerifyOtpData extends RequestOtpData {
  otp: string;
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
  enabled?: 0 | 1 | boolean;
  user_type?: string;
  roles?: string[];
  user_metadata: {
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string;
  };
}

export interface FrappeSession {
  user: FrappeAuthUser;
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
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";

interface FrappeResponse<T> {
  message?: T;
  exc?: string;
  exception?: string;
  _server_messages?: string;
}

function frappeBaseUrl() {
  const configuredUrl = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    configuredUrl.startsWith("http://127.0.0.1:")
  ) {
    return configuredUrl.replace("http://127.0.0.1:", "http://localhost:");
  }
  return configuredUrl;
}

async function frappeMethod<T>(method: string, body?: Record<string, unknown>, init?: RequestInit): Promise<T> {
  const baseUrl = frappeBaseUrl();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_FRAPPE_URL is required");
  }

  const isGet = !body;
  const url = new URL(`${baseUrl}/api/method/${method}`);
  const response = await fetch(url.toString(), {
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
    avatar_url: user.user_image || user.user_metadata.avatar_url || null,
    phone: null,
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
  };
}

export const auth = {
  signUp: async ({ email, password, fullName, mobileNo }: SignUpData) => {
    const data = await frappeMethod<{ status: string; user: FrappeAuthUser; otp_log?: string; delivery_status?: string }>(
      `${FRAPPE_AUTH_METHOD}.signup`,
      { email, password, full_name: fullName, mobile_no: mobileNo },
    );
    const user = mapUser(data.user);
    return { ...data, user, session: data.status === "success" && user ? { user } : null };
  },

  signIn: async ({ email, password }: SignInData) => {
    const data = await frappeMethod<{ status: string; user: FrappeAuthUser }>(
      `${FRAPPE_AUTH_METHOD}.login`,
      { email, password },
    );
    const user = mapUser(data.user);
    return { ...data, user, session: data.status === "success" && user ? { user } : null };
  },

  requestOtp: async ({ identifier, purpose = "Login", identifierType = "Email" }: RequestOtpData) => {
    return frappeMethod<{ status: string; otp_log?: string; delivery_status?: string }>(
      `${FRAPPE_AUTH_METHOD}.request_otp`,
      { identifier, purpose, identifier_type: identifierType },
    );
  },

  verifyOtp: async ({ identifier, otp, purpose = "Login", identifierType = "Email" }: VerifyOtpData) => {
    const data = await frappeMethod<{ status: string; user: FrappeAuthUser }>(
      `${FRAPPE_AUTH_METHOD}.verify_otp`,
      { identifier, otp, purpose, identifier_type: identifierType },
    );
    const user = mapUser(data.user);
    return { user, session: user ? { user } : null };
  },

  signOut: async () => {
    await frappeMethod(`${FRAPPE_AUTH_METHOD}.logout`, {});
  },

  resetPassword: async (email: string) => {
    await auth.requestOtp({ identifier: email, purpose: "Password Reset" });
  },

  updatePassword: async () => {
    throw new Error("Password updates are managed from Frappe for candidate accounts.");
  },

  getSession: async (): Promise<FrappeSession | null> => {
    const data = await frappeMethod<{ user: FrappeAuthUser | null }>(`${FRAPPE_AUTH_METHOD}.me`);
    const user = mapUser(data.user);
    return user ? { user } : null;
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

async function getSupabaseClient() {
  const { supabase } = await import("./supabase");
  return supabase;
}

export const createProfile = async (userId: string, profileData: Omit<ProfileInsert, "id">) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("profiles").insert({ id: userId, ...profileData }).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
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
