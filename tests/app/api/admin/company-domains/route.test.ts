import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/company-domains/route'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as auth from '@/lib/middleware/auth'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('@/lib/middleware/auth', () => ({
  getUserFromRequest: vi.fn(),
  isAdmin: vi.fn(),
}))

const mockSupabaseAdmin = supabaseAdmin as ReturnType<typeof vi.fn>
const mockGetUserFromRequest = auth.getUserFromRequest as ReturnType<typeof vi.fn>
const mockIsAdmin = auth.isAdmin as ReturnType<typeof vi.fn>

const createMockRequest = (
  body: Record<string, unknown> | null = null,
  method: 'GET' | 'POST' = 'GET'
): NextRequest => ({
  json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
  method,
  cookies: { get: vi.fn() },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Company Domains API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/company-domains', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(false)

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(403)
    })

    it('fetches domains successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', domain: 'example.com' }],
            error: null,
          }),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
    })
  })

  describe('POST /api/admin/company-domains', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await POST(createMockRequest({ domain: 'test.com' }, 'POST'))
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(false)

      const response = await POST(createMockRequest({ domain: 'test.com' }, 'POST'))
      const json = await response.json()

      expect(response.status).toBe(403)
    })

    it('returns validation error for invalid domain', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const response = await POST(createMockRequest({ domain: 'invalid' }, 'POST'))
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('creates domain successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        insert: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', domain: 'test.com' },
              error: null,
            }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await POST(createMockRequest({ domain: 'test.com', company_name: 'Test Co' }, 'POST'))
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)
    })
  })
})