import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/admin/sync/jobs/route'
import { supabaseAdmin } from '@/lib/supabase-admin'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

const mockSupabaseAdmin = supabaseAdmin as unknown as {
  auth: { getUser: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
}

const createMockRequest = (
  body: Record<string, unknown> | null,
  queryParams: Record<string, string> = {},
  method: 'GET' | 'POST' = 'GET'
): NextRequest => {
  const url = new URL('http://localhost:3000/api/admin/sync/jobs')
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return {
    url: url.toString(),
    json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
    method,
    cookies: {
      get: vi.fn().mockReturnValue({ value: 'mock-token' }),
    },
    headers: new Headers(),
  } as unknown as NextRequest
}

const createAuthenticatedUser = () => ({
  id: 'user-123',
  email: 'admin@example.com',
})

describe('Admin Sync Jobs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('POST /api/admin/sync/jobs', () => {
    it('returns 401 when user is not authenticated', async () => {
      const request = createMockRequest(null, {}, 'POST')
      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No token' } }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 403 when user is not admin', async () => {
      const request = createMockRequest(null, {}, 'POST')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })
      
      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toContain('Forbidden')
    })

    it('syncs jobs with force option when Frappe is available', async () => {
      const request = createMockRequest(null, { force: 'true' }, 'POST')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows' } }),
              })),
              order: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            update: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          }
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toHaveProperty('synced')
    })

    it('syncs jobs successfully with force option', async () => {
      const request = createMockRequest(null, { force: 'true' }, 'POST')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows' } }),
              })),
              order: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            update: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          }
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toHaveProperty('synced')
      expect(json).toHaveProperty('updated')
      expect(json).toHaveProperty('errors')
    })

    it('syncs jobs with company filter', async () => {
      const request = createMockRequest(null, { company: 'Frappe' }, 'POST')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows' } }),
              })),
              order: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.message).toContain('Job sync completed')
    })

    it('handles force parameter correctly', async () => {
      const request = createMockRequest(null, { force: 'true' }, 'POST')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'No rows' } }),
              })),
              order: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            })),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
    })

    it('handles database errors gracefully', async () => {
      const request = createMockRequest(null, {}, 'POST')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockRejectedValue(new Error('Database error')),
              })),
            })),
          }
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.errors).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/admin/sync/jobs', () => {
    it('returns 401 when user is not authenticated', async () => {
      const request = createMockRequest(null, {}, 'GET')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 403 when user is not admin', async () => {
      const request = createMockRequest(null, {}, 'GET')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toContain('Forbidden')
    })

    it('returns sync statistics successfully', async () => {
      const request = createMockRequest(null, {}, 'GET')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          const mockBuilder = {
            select: vi.fn().mockImplementation((columns: string, options?: Record<string, unknown>) => {
              if (options?.count === 'exact') {
                return {
                  eq: vi.fn().mockImplementation(() => ({
                    count: 50,
                    data: [],
                    error: null,
                  })),
                  count: 100,
                  data: [],
                  error: null,
                }
              }
              return {
                order: vi.fn().mockImplementation(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      { title: 'Job 1', company: 'Company A', created_at: '2024-01-01' },
                      { title: 'Job 2', company: 'Company B', created_at: '2024-01-02' },
                    ],
                    error: null,
                  }),
                })),
              }
            }),
          }
          return mockBuilder
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toHaveProperty('totalJobs')
      expect(json).toHaveProperty('activeJobs')
      expect(json).toHaveProperty('recentJobs')
      expect(json).toHaveProperty('frappeConnection')
    })

    it('handles errors when fetching statistics', async () => {
      const request = createMockRequest(null, {}, 'GET')
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: createAuthenticatedUser() },
        error: null,
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
              })),
            })),
          }
        }
        if (table === 'jobs') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockRejectedValue(new Error('Database error')),
              })),
            })),
          }
        }
        return {}
      })
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('Internal server error')
    })
  })
})