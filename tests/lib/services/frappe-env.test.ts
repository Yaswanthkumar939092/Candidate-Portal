import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock supabase-admin before importing the module under test
vi.mock('@/lib/supabase-admin', () => {
  const mockFrom = vi.fn()
  return {
    supabaseAdmin: { from: mockFrom },
  }
})

import {
  FrappeClient,
  FrappeEnvironmentManager,
  FrappeAuthError,
  FrappeApiError,
} from '@/lib/services/frappe-env'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// FrappeClient
// ---------------------------------------------------------------------------

describe('FrappeClient', () => {
  let client: FrappeClient
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    client = new FrappeClient({
      frappe_url: 'http://localhost:8000',
      api_key: 'test_key',
      api_secret: 'test_secret',
      username: null,
      password: null,
      environment_key: 'LOCAL',
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  // TC-1.10: Sends authenticated request with token header
  it('sends authenticated request with token header', async () => {
    const mockResponse = { data: [{ name: 'JO-001' }] }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await client.request('/api/resource/Job Opening')

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const [calledUrl, calledOptions] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    // URL constructor encodes spaces as %20
    expect(calledUrl).toContain('/api/resource/Job%20Opening')
    expect(calledOptions.headers.Authorization).toBe('token test_key:test_secret')
    expect(result).toEqual(mockResponse)
  })

  // TC-1.11: Throws FrappeAuthError on 401
  it('throws FrappeAuthError on 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(client.request('/api/test')).rejects.toThrow(FrappeAuthError)
  })

  it('throws FrappeAuthError on 403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    })

    await expect(client.request('/api/test')).rejects.toThrow(FrappeAuthError)
  })

  it('throws FrappeApiError on non-auth HTTP errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server Error'),
    })

    await expect(client.request('/api/test')).rejects.toThrow(FrappeApiError)
  })

  // TC-1.15: Ping returns true when Frappe responds
  it('ping returns true when Frappe responds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 1 }),
    })

    expect(await client.ping()).toBe(true)
  })

  it('ping returns false when Frappe is unreachable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    expect(await client.ping()).toBe(false)
  })

  // TC-1.12: getJobOpenings returns array of jobs
  it('getJobOpenings returns array of jobs', async () => {
    const mockJobs = [
      {
        name: 'JO-001',
        job_title: 'Dev',
        company: 'Test',
        description: '',
        status: 'Open',
      },
    ]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockJobs }),
    })

    const result = await client.getJobOpenings()
    expect(result).toEqual(mockJobs)
  })

  it('getJobOpenings returns empty array when data is null', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: null }),
    })

    const result = await client.getJobOpenings()
    expect(result).toEqual([])
  })

  // TC-1.13: createJobApplicant sends POST request
  it('createJobApplicant sends POST request', async () => {
    const mockResult = { data: { name: 'HR-APP-001', status: 'Open' } }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResult),
    })

    const result = await client.createJobApplicant({
      applicant_name: 'John',
      email_id: 'john@test.com',
      job_title: 'Dev',
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const [calledUrl, calledOptions] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    // URL constructor encodes spaces as %20
    expect(calledUrl).toContain('/api/resource/Job%20Applicant')
    expect(calledOptions.method).toBe('POST')
    expect(result).toEqual(mockResult)
  })

  it('request appends query params when provided', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    })

    await client.request('/api/test', {
      params: { page: '1', limit: '10' },
    })

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('page=1')
    expect(calledUrl).toContain('limit=10')
  })

  it('request includes JSON body for POST', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await client.request('/api/test', {
      method: 'POST',
      body: { name: 'test' },
    })

    const calledOptions = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(calledOptions.body).toBe(JSON.stringify({ name: 'test' }))
  })

  it('strips trailing slash from frappe_url', async () => {
    const clientWithSlash = new FrappeClient({
      frappe_url: 'http://localhost:8000/',
      api_key: 'key',
      api_secret: 'secret',
      username: null,
      password: null,
      environment_key: 'LOCAL',
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await clientWithSlash.request('/api/test')

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    // Should not have double slashes between host and path
    expect(calledUrl).toContain('http://localhost:8000/api/test')
  })

  it('checkEmployeeExists returns true when employee found', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [{ name: 'EMP-001' }] }),
    })

    expect(await client.checkEmployeeExists('john@test.com')).toBe(true)
  })

  it('checkEmployeeExists returns false when no employee found', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    })

    expect(await client.checkEmployeeExists('john@test.com')).toBe(false)
  })

  it('checkEmployeeExists returns false on error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'))

    expect(await client.checkEmployeeExists('john@test.com')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// FrappeEnvironmentManager
// ---------------------------------------------------------------------------

describe('FrappeEnvironmentManager', () => {
  let manager: FrappeEnvironmentManager

  beforeEach(() => {
    manager = new FrappeEnvironmentManager()
    vi.clearAllMocks()
  })

  // Helper to build a Supabase chain mock:
  // supabaseAdmin.from(table).select('*').eq(col, val).eq(col2, val2).single()
  function mockSupabaseSingleChain(resolvedValue: { data: unknown; error: unknown }) {
    const mockSingle = vi.fn().mockResolvedValue(resolvedValue)
    const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })
    return { mockSelect, mockEq1, mockEq2, mockSingle }
  }

  // TC-1.1: getActiveConfig returns active environment from DB
  it('returns active environment config from DB', async () => {
    const mockEnv = {
      frappe_url: 'http://dev.example.com',
      api_key: 'dev_key',
      api_secret: 'dev_secret',
      username: null,
      password: null,
      environment_key: 'DEV',
      is_active: true,
    }

    // Build the chain: .from().select('*').eq('is_active', true).single()
    const mockSingle = vi.fn().mockResolvedValue({ data: mockEnv, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })

    const config = await manager.getActiveConfig()

    expect(supabaseAdmin.from).toHaveBeenCalledWith('frappe_environments')
    expect(config.frappe_url).toBe('http://dev.example.com')
    expect(config.api_key).toBe('dev_key')
    expect(config.environment_key).toBe('DEV')
  })

  // TC-1.3: Cache mechanism -- second call within TTL should not hit DB
  it('caches config for 5 minutes (no second DB call)', async () => {
    const mockEnv = {
      frappe_url: 'http://cached.example.com',
      api_key: 'cached_key',
      api_secret: 'cached_secret',
      username: null,
      password: null,
      environment_key: 'CACHED',
      is_active: true,
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockEnv, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })

    // First call hits DB
    const first = await manager.getActiveConfig()
    expect(first.frappe_url).toBe('http://cached.example.com')
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const second = await manager.getActiveConfig()
    expect(second.frappe_url).toBe('http://cached.example.com')
    // Still only 1 DB call total
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
  })

  it('invalidateCache forces next call to hit DB', async () => {
    const mockEnv = {
      frappe_url: 'http://cached.example.com',
      api_key: 'key',
      api_secret: 'secret',
      username: null,
      password: null,
      environment_key: 'TEST',
      is_active: true,
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockEnv, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })

    await manager.getActiveConfig()
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)

    manager.invalidateCache()

    await manager.getActiveConfig()
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(2)
  })

  // TC-1.5: switchEnvironment with invalid key throws
  it('throws on invalid environment key', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })

    await expect(manager.switchEnvironment('STAGING')).rejects.toThrow(
      "Environment 'STAGING' not found",
    )
  })

  it('getClient returns a FrappeClient instance', async () => {
    const mockEnv = {
      frappe_url: 'http://test.example.com',
      api_key: 'key',
      api_secret: 'secret',
      username: null,
      password: null,
      environment_key: 'TEST',
      is_active: true,
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockEnv, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })

    const frappeClient = await manager.getClient()
    expect(frappeClient).toBeInstanceOf(FrappeClient)
  })

  it('testConnection returns success result and updates DB', async () => {
    const mockEnv = {
      id: 'env-1',
      frappe_url: 'http://test.com',
      environment_key: 'TEST',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockEnv, error: null })
    const mockUpdateSingle = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateSingle })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

    ;(supabaseAdmin.from as any).mockImplementation((table: string) => {
      if (table === 'frappe_environments') {
        return { select: mockSelect, update: mockUpdate }
      }
    })

    // Mock ping
    vi.spyOn(FrappeClient.prototype, 'ping').mockResolvedValue(true)

    const result = await manager.testConnection('env-1')

    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('listEnvironments returns all environments from DB', async () => {
    const mockEnvs = [{ id: '1', environment_key: 'DEV' }]
    const mockOrder = vi.fn().mockResolvedValue({ data: mockEnvs, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    ;(supabaseAdmin.from as any).mockReturnValue({ select: mockSelect })

    const result = await manager.listEnvironments()
    expect(result).toEqual(mockEnvs)
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('seedLocalEnv inserts local env if none exist', async () => {
    // Mock count = 0
    const mockHead = vi.fn().mockResolvedValue({ count: 0 })
    const mockSelect = vi.fn().mockReturnValue({ count: 'exact', head: true })
    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    ;(supabaseAdmin.from as any).mockImplementation((table: string) => {
      if (table === 'frappe_environments') {
        return { select: () => ({ count: 'exact', head: mockHead }), insert: mockInsert }
      }
    })

    process.env.FRAPPE_BASE_URL = 'http://local.test'
    await manager.seedLocalEnv()

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      environment_key: 'LOCAL',
      frappe_url: 'http://local.test',
    }))
  })
})

describe('FrappeClient methods', () => {
  let client: FrappeClient

  beforeEach(() => {
    client = new FrappeClient({
      frappe_url: 'http://localhost:8000',
      api_key: 'key',
      api_secret: 'secret',
      username: null,
      password: null,
      environment_key: 'LOCAL',
    })
  })

  it('createUser sends POST request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { name: 'user1' } }),
    })

    const result = await client.createUser({ email: 'test@test.com', first_name: 'John' })
    expect(result.data.name).toBe('user1')
  })

  it('createEmployee sends POST request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { name: 'emp1' } }),
    })

    const result = await client.createEmployee({ employee_name: 'John', first_name: 'John', company: 'Acme' })
    expect(result.data.name).toBe('emp1')
  })
})

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

describe('FrappeAuthError', () => {
  it('has correct name and message', () => {
    const error = new FrappeAuthError('Auth failed')
    expect(error.name).toBe('FrappeAuthError')
    expect(error.message).toBe('Auth failed')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('FrappeApiError', () => {
  it('has correct name, status, and responseBody', () => {
    const error = new FrappeApiError('API failed', 500, '{"error":"bad"}')
    expect(error.name).toBe('FrappeApiError')
    expect(error.status).toBe(500)
    expect(error.responseBody).toBe('{"error":"bad"}')
    expect(error).toBeInstanceOf(Error)
  })
})
