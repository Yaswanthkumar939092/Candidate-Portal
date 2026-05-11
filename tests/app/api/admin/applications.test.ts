import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/admin/applications/route'
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

interface ChainableMock {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

const createChainableMock = (selectData = { data: [], error: null, count: 0 }): ChainableMock => {
  const eqMock = vi.fn()
  const gteMock = vi.fn()
  const lteMock = vi.fn()
  const ilikeMock = vi.fn()
  const rangeMock = vi.fn().mockResolvedValue(selectData)
  const singleMock = vi.fn().mockResolvedValue(selectData)
  const updateMock = vi.fn().mockImplementation(() => ({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  }))

  const selectMock = vi.fn().mockImplementation(() => ({
    eq: eqMock,
    gte: gteMock,
    lte: lteMock,
    ilike: ilikeMock,
    range: rangeMock,
    single: singleMock,
  }))

  const methods = {
    select: selectMock,
    eq: eqMock,
    gte: gteMock,
    lte: lteMock,
    ilike: ilikeMock,
    range: rangeMock,
    in: vi.fn(),
    update: updateMock,
    single: singleMock,
  }

  eqMock.mockImplementation(() => methods)
  gteMock.mockImplementation(() => methods)
  lteMock.mockImplementation(() => methods)
  ilikeMock.mockImplementation(() => methods)

  return methods
}

const createMockRequest = (
  body: Record<string, unknown> | null,
  queryParams: Record<string, string> = {},
  method: 'GET' | 'PATCH' = 'GET'
): NextRequest => {
  const url = new URL('http://localhost:3000/api/admin/applications')
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const headers = new Headers()
  if (method === 'PATCH' && body) {
    headers.set('content-type', 'application/json')
  }

  return {
    url: url.toString(),
    json: body ? vi.fn().mockResolvedValue(body) : vi.fn().mockRejectedValue(new Error('No body')),
    method,
    headers,
  } as unknown as NextRequest
}

const createAuthenticatedUser = () => ({
  id: 'user-123',
  email: 'admin@example.com',
  role: 'admin',
})

const mockApplicationData = [
  {
    id: 'app-1',
    job_id: 'job-1',
    candidate_id: 'candidate-1',
    status: 'pending',
    cover_letter: 'Cover letter',
    resume_url: 'https://example.com/resume.pdf',
    applied_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    notes: null,
    rejection_reason: null,
    jobs: {
      id: 'job-1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      company_logo: 'https://example.com/logo.png',
      location: 'Remote',
      job_type: 'full-time',
      salary_min: 100000,
      salary_max: 150000,
      is_active: true,
    },
    profiles: {
      id: 'candidate-1',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      location: 'New York',
      experience_level: 'senior',
    },
  },
]

describe('Admin Applications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/applications', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest(null, {}, 'GET')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const request = createMockRequest(null, {}, 'GET')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.success).toBe(false)
    })

    it('fetches applications with valid query params', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const builder = createChainableMock({
        data: mockApplicationData,
        error: null,
        count: 1,
      })

      mockSupabaseAdmin.from.mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(null, {}, 'GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('validates pagination params', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, { page: '2', limit: '10' }, 'GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('validates status filter', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, { status: 'pending' }, 'GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('validates sort_by parameter', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, { sort_by: 'status', sort_order: 'asc' }, 'GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('handles date filters', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, {
        date_from: '2024-01-01T00:00:00Z',
        date_to: '2024-12-31T23:59:59Z',
      }, 'GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('handles candidate search', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, { candidate_search: 'john' }, 'GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('PATCH /api/admin/applications', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest(
        { application_ids: ['550e8400-e29b-41d4-a716-446655440000'], status: 'reviewing' },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const request = createMockRequest(
        { application_ids: ['550e8400-e29b-41d4-a716-446655440000'], status: 'reviewing' },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.success).toBe(false)
    })

    it('returns validation error for invalid status', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(
        { application_ids: ['550e8400-e29b-41d4-a716-446655440000'], status: 'invalid' },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns validation error for empty application_ids', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(
        { application_ids: [], status: 'reviewing' },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns validation error for invalid UUID', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(
        { application_ids: ['not-a-uuid'], status: 'reviewing' },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('processes batch update request', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const builder = createChainableMock({
        data: [{ id: 'app-1', status: 'pending', candidate_id: 'cand-1', jobs: {} }],
        error: null,
      })

      mockSupabaseAdmin.from.mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        { application_ids: ['550e8400-e29b-41d4-a716-446655440000'], status: 'reviewing' },
        {},
        'PATCH'
      )
      const response = await PATCH(request)

      expect(response.status).toBe(200)
    })

    it('validates notes length', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(
        {
          application_ids: ['550e8400-e29b-41d4-a716-446655440000'],
          status: 'reviewing',
          notes: 'x'.repeat(1001),
        },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('validates rejection reason length', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(
        {
          application_ids: ['550e8400-e29b-41d4-a716-446655440000'],
          status: 'rejected',
          rejection_reason: 'x'.repeat(501),
        },
        {},
        'PATCH'
      )
      const response = await PATCH(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })
  })
})