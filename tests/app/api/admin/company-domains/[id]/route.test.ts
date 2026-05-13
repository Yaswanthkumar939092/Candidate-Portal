import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/admin/company-domains/[id]/route'
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

const createMockParams = (id: string) => Promise.resolve({ id })

const createMockRequest = (
  body: Record<string, unknown> | null = null,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET'
): NextRequest => ({
  json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
  method,
  cookies: { get: vi.fn() },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Company Domain [id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/company-domains/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns 404 when domain not found', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(404)
    })

    it('returns domain successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', domain: 'test.com' },
              error: null,
            }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.data.domain).toBe('test.com')
    })
  })

  describe('PUT /api/admin/company-domains/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await PUT(createMockRequest({ domain: 'new.com' }, 'PUT'), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns validation error for invalid data', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const response = await PUT(createMockRequest({ domain: 'invalid' }, 'PUT'), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('updates domain successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: '1', domain: 'new.com' },
                error: null,
              }),
            })),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await PUT(createMockRequest({ domain: 'new.com' }, 'PUT'), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/admin/company-domains/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await DELETE(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('deletes domain successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        delete: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await DELETE(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })
})