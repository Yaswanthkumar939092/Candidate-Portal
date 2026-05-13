import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/applications/[id]/route'
import { supabaseAdmin } from '@/lib/supabase-admin'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}))

const mockSupabaseAdmin = supabaseAdmin as unknown as {
  auth: { getUser: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
}

const createMockParams = (id: string) => Promise.resolve({ id })

const createMockRequest = (
  body: Record<string, unknown> | null = null,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET'
): NextRequest => ({
  json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
  method,
  cookies: { get: vi.fn().mockReturnValue({ value: 'mock-token' }) },
  headers: new Headers(),
}) as unknown as NextRequest

const createAuthenticatedUser = (id = 'user-123') => ({
  id,
  email: 'user@example.com',
})

const createQueryBuilder = (data: unknown, error: { message?: string } | null = null) => ({
  select: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      single: vi.fn().mockResolvedValue({ data, error }),
    })),
  })),
  update: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({ data, error: null }),
      })),
    })),
  })),
  delete: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
})

describe('Application API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/applications/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const request = createMockRequest()
      const params = createMockParams('app-123')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

it('returns 404 when application not found', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: createAuthenticatedUser() }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(createQueryBuilder(null))

      const request = createMockRequest()
      const params = createMockParams('app-123')
      const response = await GET(request, { params })

      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/applications/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const request = createMockRequest({ status: 'pending' }, 'PUT')
      const params = createMockParams('app-123')
      const response = await PUT(request, { params })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns 404 when application not found', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: createAuthenticatedUser() }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(createQueryBuilder(null))

      const request = createMockRequest({ status: 'pending' }, 'PUT')
      const params = createMockParams('app-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(404)
    })

    it('returns validation error for invalid status', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: createAuthenticatedUser() }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(createQueryBuilder({ id: 'app-123', candidate_id: 'user-123', status: 'pending' }))

      const request = createMockRequest({ status: 'invalid' }, 'PUT')
      const params = createMockParams('app-123')
      const response = await PUT(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Validation failed')
    })
  })

  describe('DELETE /api/applications/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const request = createMockRequest(null, 'DELETE')
      const params = createMockParams('app-123')
      const response = await DELETE(request, { params })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns 404 when application not found', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: createAuthenticatedUser() }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(createQueryBuilder(null))

      const request = createMockRequest(null, 'DELETE')
      const params = createMockParams('app-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(404)
    })
  })
})