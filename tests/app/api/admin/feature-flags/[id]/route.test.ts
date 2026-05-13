import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/admin/feature-flags/[id]/route'
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
  cookies: { get: vi.fn().mockReturnValue({ value: 'token' }) },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Feature Flag [id] API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns feature flag', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          })),
          eq2: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'test' }, error: null }),
          })),
        })),
      }))

      const response = await GET(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
    })
  })

  describe('PUT', () => {
    it('updates feature flag', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          })),
        })),
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'updated' }, error: null }),
            })),
          })),
        })),
      }))

      const response = await PUT(createMockRequest({ enabled: false }, 'PUT'), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE', () => {
    it('deletes feature flag', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          })),
        })),
        delete: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }))

      const response = await DELETE(createMockRequest(), { params: createMockParams('1') })
      const json = await response.json()

      expect(response.status).toBe(200)
    })
  })
})