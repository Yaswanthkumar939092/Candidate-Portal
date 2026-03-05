import { supabase } from './supabase'
import { Profile, ProfileInsert } from '@/types/database'

export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthError {
  message: string
  status?: number
}

export interface OAuthProvider {
  provider: 'google' | 'linkedin'
  enabled: boolean
}

export interface OAuthError extends AuthError {
  provider?: string
}

// Authentication functions
export const auth = {
  // Sign up a new user
  signUp: async ({ email, password, fullName }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Supabase returns a user with an empty identities array when the email
    // is already registered (and email confirmations are enabled).  Detect
    // this case and surface a clear error instead of silently proceeding.
    if (
      data.user &&
      (!data.user.identities || data.user.identities.length === 0)
    ) {
      throw new Error('User already registered')
    }

    // Create profile after successful signup
    if (data.user) {
      await createProfile(data.user.id, {
        email,
        full_name: fullName || null,
      })
    }

    return { user: data.user, session: data.session }
  },

  // Sign in an existing user
  signIn: async ({ email, password }: SignInData) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign in')
    }
  },

  // Sign out current user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign out')
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send reset email')
    }
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update password')
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        throw new Error(error.message)
      }
      return session
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get session')
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        throw new Error(error.message)
      }
      return user
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get current user')
    }
  },

  // OAuth sign-in functions
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign in with Google')
    }
  },

  signInWithLinkedIn: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'profile email openid',
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to sign in with LinkedIn')
    }
  },

  signInWithOAuth: async (provider: 'google' | 'linkedin') => {
    try {
      if (provider === 'google') {
        return await auth.signInWithGoogle()
      } else if (provider === 'linkedin') {
        return await auth.signInWithLinkedIn()
      } else {
        throw new Error(`Unsupported OAuth provider: ${provider}`)
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : `Failed to sign in with ${provider}`)
    }
  },
}

// Profile management functions
export const createProfile = async (userId: string, profileData: Omit<ProfileInsert, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create profile')
  }
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get profile')
  }
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update profile')
  }
}

// Hook for auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Helper to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await auth.getSession()
    return !!session
  } catch {
    return false
  }
}

// Helper to get user role from profile
export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const profile = await getProfile(userId)
    return profile?.experience_level || null
  } catch {
    return null
  }
}

// Helper to check if OAuth providers are enabled
export const getEnabledOAuthProviders = (): OAuthProvider[] => {
  const providers: OAuthProvider[] = []

  // Check if Google OAuth is configured
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (googleClientId && googleClientId !== 'your-google-client-id') {
    providers.push({ provider: 'google', enabled: true })
  }

  // Check if LinkedIn OAuth is configured
  const linkedInClientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
  if (linkedInClientId && linkedInClientId !== 'your-linkedin-client-id') {
    providers.push({ provider: 'linkedin', enabled: true })
  }

  return providers
}

// Helper to check if a specific OAuth provider is enabled
export const isOAuthProviderEnabled = (provider: 'google' | 'linkedin'): boolean => {
  const enabledProviders = getEnabledOAuthProviders()
  return enabledProviders.some(p => p.provider === provider && p.enabled)
}

// Middleware function for protecting routes
export const requireAuth = async () => {
  const session = await auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}