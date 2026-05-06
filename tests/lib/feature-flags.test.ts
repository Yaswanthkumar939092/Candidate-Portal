import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import {
  getAllFeatureFlags,
  getFeatureFlagsForUser,
  isFeatureEnabled,
  getFeatureFlagValue,
  updateFeatureFlag,
  createUserOverride,
  removeUserOverride,
  clearFeatureFlagsCache,
  DEFAULT_FLAGS,
} from '@/lib/feature-flags'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAdmin = supabaseAdmin as any

function makeChain(result: any) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ ...result, single })
  return { single, select }
}

function mockFromSelect(data: any, error: any = null) {
  const orderResult = { data, error }
  const order = vi.fn().mockResolvedValue(orderResult)
  const select = vi.fn().mockReturnValue({ order })
  mockAdmin.from.mockReturnValue({ select })
}

function mockFromSelectAll(data: any, error: any = null) {
  const selectResult = { data, error }
  const select = vi.fn().mockResolvedValue(selectResult)
  mockAdmin.from.mockReturnValue({ select })
}

describe('DEFAULT_FLAGS', () => {
  it('has expected default flag keys', () => {
    expect(DEFAULT_FLAGS).toHaveProperty('oauth_login')
    expect(DEFAULT_FLAGS).toHaveProperty('job_applications')
    expect(DEFAULT_FLAGS).toHaveProperty('application_tracking')
    expect(DEFAULT_FLAGS).toHaveProperty('email_notifications')
  })

  it('oauth_login is enabled by default', () => {
    expect(DEFAULT_FLAGS.oauth_login).toBe(true)
  })

  it('social_job_sharing is disabled by default', () => {
    expect(DEFAULT_FLAGS.social_job_sharing).toBe(false)
  })
})

describe('getAllFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('returns all feature flags', async () => {
    const flags = [
      { id: '1', key: 'oauth_login', name: 'OAuth Login', is_enabled: true },
      { id: '2', key: 'job_applications', name: 'Job Applications', is_enabled: true },
    ]
    mockFromSelect(flags)

    const result = await getAllFeatureFlags()
    expect(result).toEqual(flags)
    expect(mockAdmin.from).toHaveBeenCalledWith('feature_flags')
  })

  it('returns empty array on error', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const select = vi.fn().mockReturnValue({ order })
    mockAdmin.from.mockReturnValue({ select })

    const result = await getAllFeatureFlags()
    expect(result).toEqual([])
  })

  it('returns empty array on exception', async () => {
    mockAdmin.from.mockImplementation(() => { throw new Error('Unexpected') })
    const result = await getAllFeatureFlags()
    expect(result).toEqual([])
  })
})

describe('getFeatureFlagsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('returns DEFAULT_FLAGS on database error', async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } })
    mockAdmin.from.mockReturnValue({ select })

    const result = await getFeatureFlagsForUser(null)
    expect(result).toEqual(DEFAULT_FLAGS)
  })

  it('merges database flags with defaults', async () => {
    const dbFlags = [
      {
        id: '1',
        key: 'oauth_login',
        is_enabled: true,
        rollout_percentage: 100,
        default_value: true,
        value_type: 'boolean',
      },
    ]
    const select = vi.fn().mockResolvedValue({ data: dbFlags, error: null })
    mockAdmin.from.mockReturnValue({ select })

    const result = await getFeatureFlagsForUser(null)
    expect(result).toHaveProperty('oauth_login')
    expect(result).toHaveProperty('job_applications')
  })

  it('uses DEFAULT_FLAGS on exception', async () => {
    mockAdmin.from.mockImplementation(() => { throw new Error('Network') })
    const result = await getFeatureFlagsForUser(null)
    expect(result).toEqual(DEFAULT_FLAGS)
  })

  it('fetches user overrides when userId is provided', async () => {
    const dbFlags = [
      {
        id: 'flag-1',
        key: 'oauth_login',
        is_enabled: true,
        rollout_percentage: 100,
        default_value: true,
        value_type: 'boolean',
      },
    ]

    let callCount = 0
    mockAdmin.from.mockImplementation((table: string) => {
      if (table === 'feature_flags') {
        return { select: vi.fn().mockResolvedValue({ data: dbFlags, error: null }) }
      }
      if (table === 'feature_flag_overrides') {
        const inFn = vi.fn().mockResolvedValue({ data: [], error: null })
        const eqFn = vi.fn().mockReturnValue({ in: inFn })
        return { select: vi.fn().mockReturnValue({ eq: eqFn }) }
      }
    })

    const result = await getFeatureFlagsForUser('user-123')
    expect(result).toBeTruthy()
  })

  it('applies user override value when override exists', async () => {
    const dbFlags = [
      {
        id: 'flag-1',
        key: 'social_job_sharing',
        is_enabled: false,
        rollout_percentage: 100,
        default_value: false,
        value_type: 'boolean',
      },
    ]
    const overrides = [{ feature_flag_id: 'flag-1', user_id: 'user-1', value: true }]

    mockAdmin.from.mockImplementation((table: string) => {
      if (table === 'feature_flags') {
        return { select: vi.fn().mockResolvedValue({ data: dbFlags, error: null }) }
      }
      if (table === 'feature_flag_overrides') {
        const inFn = vi.fn().mockResolvedValue({ data: overrides, error: null })
        const eqFn = vi.fn().mockReturnValue({ in: inFn })
        return { select: vi.fn().mockReturnValue({ eq: eqFn }) }
      }
    })

    const result = await getFeatureFlagsForUser('user-1')
    expect(result['social_job_sharing']).toBe(true)
  })
})

describe('isFeatureEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('returns true when flag is enabled', async () => {
    const dbFlags = [
      {
        id: '1',
        key: 'oauth_login',
        is_enabled: true,
        rollout_percentage: 100,
        default_value: true,
        value_type: 'boolean',
      },
    ]
    const select = vi.fn().mockResolvedValue({ data: dbFlags, error: null })
    mockAdmin.from.mockReturnValue({ select })

    const result = await isFeatureEnabled('oauth_login')
    expect(result).toBe(true)
  })

  it('returns DEFAULT_FLAGS value on error', async () => {
    mockAdmin.from.mockImplementation(() => { throw new Error('err') })
    const result = await isFeatureEnabled('oauth_login')
    expect(result).toBe(DEFAULT_FLAGS.oauth_login)
  })
})

describe('getFeatureFlagValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('returns flag value', async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } })
    mockAdmin.from.mockReturnValue({ select })

    const result = await getFeatureFlagValue('oauth_login')
    expect(result).toBeDefined()
  })

  it('returns defaultValue when flag not found and defaultValue provided', async () => {
    mockAdmin.from.mockImplementation(() => { throw new Error('err') })
    const result = await getFeatureFlagValue('job_recommendations', null, false)
    expect(result).toBe(false)
  })
})

describe('updateFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('updates a feature flag', async () => {
    const updated = { id: 'flag-1', key: 'oauth_login', is_enabled: false }
    const single = vi.fn().mockResolvedValue({ data: updated, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    mockAdmin.from.mockReturnValue({ update })

    const result = await updateFeatureFlag('flag-1', { is_enabled: false })
    expect(result).toBe(updated)
  })

  it('returns null on error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    mockAdmin.from.mockReturnValue({ update })

    const result = await updateFeatureFlag('flag-1', { is_enabled: false })
    expect(result).toBeNull()
  })
})

describe('createUserOverride', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('creates a user override', async () => {
    const override = { id: 'override-1', feature_flag_id: 'flag-1', user_id: 'user-1', value: true }
    const single = vi.fn().mockResolvedValue({ data: override, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    mockAdmin.from.mockReturnValue({ upsert })

    const result = await createUserOverride('flag-1', 'user-1', true)
    expect(result).toBe(override)
  })

  it('returns null on error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    mockAdmin.from.mockReturnValue({ upsert })

    const result = await createUserOverride('flag-1', 'user-1', true)
    expect(result).toBeNull()
  })
})

describe('removeUserOverride', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearFeatureFlagsCache()
  })

  it('removes a user override and returns true', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })
    mockAdmin.from.mockReturnValue({ delete: del })

    const result = await removeUserOverride('flag-1', 'user-1')
    expect(result).toBe(true)
  })

  it('returns false on error', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: { message: 'error' } })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })
    mockAdmin.from.mockReturnValue({ delete: del })

    const result = await removeUserOverride('flag-1', 'user-1')
    expect(result).toBe(false)
  })
})

describe('clearFeatureFlagsCache', () => {
  it('clears the cache so next call re-fetches', async () => {
    clearFeatureFlagsCache()
    // After clearing, the next getFeatureFlagsForUser call should hit the DB
    const select = vi.fn().mockResolvedValue({ data: [], error: null })
    mockAdmin.from.mockReturnValue({ select })

    await getFeatureFlagsForUser(null)
    expect(mockAdmin.from).toHaveBeenCalled()
  })
})
