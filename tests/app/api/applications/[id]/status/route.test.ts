import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/applications/[id]/status/route'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as auth from '@/lib/middleware/auth'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/middleware/auth', () => ({
  getUserFromRequest: vi.fn(),
  isAdmin: vi.fn(),
}))

const mockSupabaseAdmin = supabaseAdmin as ReturnType<typeof vi.fn>
const mockGetUserFromRequest = auth.getUserFromRequest as ReturnType<typeof vi.fn>
const mockIsAdmin = auth.isAdmin as ReturnType<typeof vi.fn>

const createMockParams = (id: string) => Promise.resolve({ id })

const createMockRequest = (
  body: Record<string, unknown> | null = null,
  method: 'GET' | 'PATCH' = 'GET'
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

const mockApplication = {
  id: 'app-123',
  candidate_id: 'user-123',
  job_id: 'job-123',
  status: 'pending',
  applied_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-16T10:00:00Z',
  notes: 'Good candidate',
  rejection_reason: null,
  jobs: {
    id: 'job-123',
    title: 'Software Engineer',
    company: 'Tech Corp',
  },
  profiles: {
    id: 'user-123',
    full_name: 'John Doe',
    email: 'john@example.com',
  },
}

const createQueryBuilder = (data: unknown, error: { message?: string } | null = null) => ({
  select: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      single: vi.fn().mockResolvedValue({ data, error }),
    })),
  })),
  update: vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({
          data: { ...mockApplication, status: 'reviewing' },
          error: null,
        }),
      })),
    })),
  })),
})

describe('Application Status API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('GET /api/applications/[id]/status', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest()
      const params = createMockParams('app-123')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 400 for invalid UUID format', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())

      const request = createMockRequest()
      const params = createMockParams('invalid-id')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('Invalid application ID format')
    })

    it('returns 404 when application not found', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(null, { message: 'No rows' }))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest()
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user lacks permission', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('other-user'))
      mockIsAdmin.mockResolvedValue(false)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest()
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(403)
    })

    it('returns status successfully for owner', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest()
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.data).toHaveProperty('current_status')
      expect(json.data).toHaveProperty('status_history')
      expect(json.data).toHaveProperty('job')
    })

    it('returns status successfully for admin', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('admin-user'))
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest()
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await GET(request, { params })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  describe('PATCH /api/applications/[id]/status', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest({ status: 'reviewing' }, 'PATCH')
      const params = createMockParams('app-123')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 400 for invalid UUID format', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())

      const request = createMockRequest({ status: 'reviewing' }, 'PATCH')
      const params = createMockParams('invalid-id')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('Invalid application ID format')
    })

    it('returns 404 when application not found', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(null, { message: 'No rows' }))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'reviewing' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user lacks permission', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('other-user'))
      mockIsAdmin.mockResolvedValue(false)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'reviewing' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(403)
    })

    it('returns 400 when candidate tries non-withdraw status', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'rejected' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toContain('Candidates can only withdraw')
    })

    it('allows admin to update status', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('admin-user'))
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'reviewing', notes: 'Moving to next stage' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('returns 400 for invalid status transition', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('admin-user'))
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder({ ...mockApplication, status: 'rejected' }))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'pending' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('Cannot transition')
    })

    it('returns 400 when same status provided', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('admin-user'))
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'pending' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('already in this status')
    })

    it('allows candidate to withdraw', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'withdrawn' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('returns validation error for invalid data', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('admin-user'))
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({ status: 'invalid' }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('validates notes length', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser('admin-user'))
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockReturnValue(createQueryBuilder(mockApplication))
      mockSupabaseAdmin.from = mockFrom

      const request = createMockRequest({
        status: 'reviewing',
        notes: 'x'.repeat(1001),
      }, 'PATCH')
      const params = createMockParams('550e8400-e29b-41d4-a716-446655440000')
      const response = await PATCH(request, { params })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })
  })
})