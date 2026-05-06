import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { auth, createProfile, getProfile, updateProfile, isAuthenticated, getUserRole, getEnabledOAuthProviders, isOAuthProviderEnabled, onAuthStateChange } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const mockSupabase = supabase as any

function mockInsertChain(result: any) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  mockSupabase.from.mockReturnValue({ insert })
}

function mockSelectChain(result: any) {
  const single = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  mockSupabase.from.mockReturnValue({ select })
}

function mockUpdateChain(result: any) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })
  mockSupabase.from.mockReturnValue({ update })
}

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    ;(window as any).location = { origin: 'http://localhost:3000' }
  })

  describe('signUp', () => {
    it('signs up a new user successfully', async () => {
      const mockUser = { id: 'user-1', identities: [{ id: 'identity-1' }] }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: { token: 'abc' } },
        error: null,
      })
      mockInsertChain({ data: { id: 'user-1', email: 'test@example.com' }, error: null })

      const result = await auth.signUp({ email: 'test@example.com', password: 'password123' })
      expect(result.user).toBe(mockUser)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: { full_name: undefined } },
      })
    })

    it('signs up with fullName', async () => {
      const mockUser = { id: 'user-1', identities: [{ id: 'identity-1' }] }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })
      mockInsertChain({ data: { id: 'user-1' }, error: null })

      await auth.signUp({ email: 'test@example.com', password: 'pass', fullName: 'Alice' })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass',
        options: { data: { full_name: 'Alice' } },
      })
    })

    it('throws when supabase returns error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already in use' },
      })

      await expect(auth.signUp({ email: 'test@example.com', password: 'pass' }))
        .rejects.toThrow('Email already in use')
    })

    it('throws when user already registered (empty identities)', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-1', identities: [] }, session: null },
        error: null,
      })

      await expect(auth.signUp({ email: 'test@example.com', password: 'pass' }))
        .rejects.toThrow('User already registered')
    })
  })

  describe('signIn', () => {
    it('signs in successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { access_token: 'token' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await auth.signIn({ email: 'test@example.com', password: 'pass' })
      expect(result.user).toBe(mockUser)
      expect(result.session).toBe(mockSession)
    })

    it('throws on sign in error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      await expect(auth.signIn({ email: 'bad@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('signs out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      await expect(auth.signOut()).resolves.toBeUndefined()
    })

    it('throws on sign out error', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: { message: 'Sign out failed' } })
      await expect(auth.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('resetPassword', () => {
    it('sends reset email successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
      await expect(auth.resetPassword('test@example.com')).resolves.toBeUndefined()
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
    })

    it('throws on reset password error', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      })
      await expect(auth.resetPassword('bad@example.com')).rejects.toThrow('User not found')
    })
  })

  describe('updatePassword', () => {
    it('updates password successfully', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
      await expect(auth.updatePassword('newPassword123')).resolves.toBeUndefined()
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newPassword123' })
    })

    it('throws on update password error', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: { message: 'Weak password' } })
      await expect(auth.updatePassword('123')).rejects.toThrow('Weak password')
    })
  })

  describe('getSession', () => {
    it('returns session when authenticated', async () => {
      const session = { access_token: 'token', user: { id: 'user-1' } }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session }, error: null })
      const result = await auth.getSession()
      expect(result).toBe(session)
    })

    it('returns null when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      const result = await auth.getSession()
      expect(result).toBeNull()
    })

    it('throws on error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      })
      await expect(auth.getSession()).rejects.toThrow('Session error')
    })
  })

  describe('getCurrentUser', () => {
    it('returns current user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      const result = await auth.getCurrentUser()
      expect(result).toBe(mockUser)
    })

    it('throws on error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      })
      await expect(auth.getCurrentUser()).rejects.toThrow('Auth error')
    })
  })

  describe('signInWithGoogle', () => {
    it('initiates Google OAuth flow', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/...' },
        error: null,
      })
      const result = await auth.signInWithGoogle()
      expect(result).toBeTruthy()
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    })

    it('throws on OAuth error', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth failed' },
      })
      await expect(auth.signInWithGoogle()).rejects.toThrow('OAuth failed')
    })
  })

  describe('signInWithLinkedIn', () => {
    it('initiates LinkedIn OAuth flow', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://linkedin.com/...' },
        error: null,
      })
      await auth.signInWithLinkedIn()
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'linkedin_oidc' })
      )
    })
  })

  describe('signInWithOAuth', () => {
    it('delegates to signInWithGoogle for google provider', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://google.com' },
        error: null,
      })
      await auth.signInWithOAuth('google')
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      )
    })

    it('delegates to signInWithLinkedIn for linkedin provider', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://linkedin.com' },
        error: null,
      })
      await auth.signInWithOAuth('linkedin')
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'linkedin_oidc' })
      )
    })
  })
})

describe('createProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a profile successfully', async () => {
    const profile = { id: 'user-1', email: 'test@example.com' }
    mockInsertChain({ data: profile, error: null })

    const result = await createProfile('user-1', { email: 'test@example.com' })
    expect(result).toBe(profile)
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
  })

  it('throws on database error', async () => {
    mockInsertChain({ data: null, error: { message: 'DB error' } })
    await expect(createProfile('user-1', { email: 'test@example.com' }))
      .rejects.toThrow('DB error')
  })
})

describe('getProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns profile when found', async () => {
    const profile = { id: 'user-1', email: 'test@example.com' }
    mockSelectChain({ data: profile, error: null })
    const result = await getProfile('user-1')
    expect(result).toBe(profile)
  })

  it('returns null when profile not found (PGRST116)', async () => {
    mockSelectChain({ data: null, error: { code: 'PGRST116', message: 'No rows found' } })
    const result = await getProfile('user-1')
    expect(result).toBeNull()
  })

  it('throws on other database errors', async () => {
    mockSelectChain({ data: null, error: { code: '500', message: 'Server error' } })
    await expect(getProfile('user-1')).rejects.toThrow('Server error')
  })
})

describe('updateProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates profile successfully', async () => {
    const updated = { id: 'user-1', email: 'new@example.com' }
    mockUpdateChain({ data: updated, error: null })
    const result = await updateProfile('user-1', { email: 'new@example.com' })
    expect(result).toBe(updated)
  })

  it('throws on update error', async () => {
    mockUpdateChain({ data: null, error: { message: 'Update failed' } })
    await expect(updateProfile('user-1', { email: 'new@example.com' }))
      .rejects.toThrow('Update failed')
  })
})

describe('isAuthenticated', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when session exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    })
    expect(await isAuthenticated()).toBe(true)
  })

  it('returns false when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    expect(await isAuthenticated()).toBe(false)
  })

  it('returns false on error', async () => {
    mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))
    expect(await isAuthenticated()).toBe(false)
  })
})

describe('getUserRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns experience_level from profile', async () => {
    mockSelectChain({ data: { id: 'user-1', experience_level: 'senior' }, error: null })
    expect(await getUserRole('user-1')).toBe('senior')
  })

  it('returns null when profile has no experience_level', async () => {
    mockSelectChain({ data: { id: 'user-1', experience_level: null }, error: null })
    expect(await getUserRole('user-1')).toBeNull()
  })

  it('returns null on error', async () => {
    mockSelectChain({ data: null, error: { code: 'PGRST116', message: 'not found' } })
    expect(await getUserRole('nonexistent')).toBeNull()
  })
})

describe('getEnabledOAuthProviders', () => {
  it('returns empty array when no providers configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'your-google-client-id')
    vi.stubEnv('NEXT_PUBLIC_LINKEDIN_CLIENT_ID', 'your-linkedin-client-id')
    const providers = getEnabledOAuthProviders()
    expect(providers).toEqual([])
    vi.unstubAllEnvs()
  })

  it('includes google when google client id is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'real-google-id')
    vi.stubEnv('NEXT_PUBLIC_LINKEDIN_CLIENT_ID', 'your-linkedin-client-id')
    const providers = getEnabledOAuthProviders()
    expect(providers.some(p => p.provider === 'google' && p.enabled)).toBe(true)
    vi.unstubAllEnvs()
  })

  it('includes linkedin when linkedin client id is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'your-google-client-id')
    vi.stubEnv('NEXT_PUBLIC_LINKEDIN_CLIENT_ID', 'real-linkedin-id')
    const providers = getEnabledOAuthProviders()
    expect(providers.some(p => p.provider === 'linkedin' && p.enabled)).toBe(true)
    vi.unstubAllEnvs()
  })
})

describe('isOAuthProviderEnabled', () => {
  it('returns true when provider is enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'real-google-id')
    expect(isOAuthProviderEnabled('google')).toBe(true)
    vi.unstubAllEnvs()
  })

  it('returns false when provider is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'your-google-client-id')
    expect(isOAuthProviderEnabled('google')).toBe(false)
    vi.unstubAllEnvs()
  })
})

describe('onAuthStateChange', () => {
  it('subscribes to auth state changes', () => {
    const callback = vi.fn()
    const unsubscribe = { data: { subscription: { unsubscribe: vi.fn() } } }
    mockSupabase.auth.onAuthStateChange.mockReturnValue(unsubscribe)
    const result = onAuthStateChange(callback)
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback)
    expect(result).toBe(unsubscribe)
  })
})
