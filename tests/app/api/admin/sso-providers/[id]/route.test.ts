import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/admin/sso-providers/[id]/route'
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

describe('Admin SSO Provider [id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns SSO provider', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Google' }, error: null }),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
    })
  })

  describe('PUT', () => {
    it('updates SSO provider', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1' })
      mockIsAdmin.mockResolvedValue(true)

      const mockFrom = vi.fn().mockImplementation(() => ({
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'Updated' }, error: null }),
            })),
          })),
        })),
      }))
      mockSupabaseAdmin.from = mockFrom

      const response = await PUT(createMockRequest({ name: 'Updated' }, 'PUT'), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE', () => {
    it('deletes SSO provider', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1' })
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
    })
  })
})