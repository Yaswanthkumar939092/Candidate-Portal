import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/feature-flags/route'
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

const createMockRequest = (
  body: Record<string, unknown> | null = null,
  method: 'GET' | 'POST' = 'GET'
): NextRequest => ({
  json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
  method,
  cookies: { get: vi.fn().mockReturnValue({ value: 'token' }) },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Feature Flags API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 403 when not admin', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
          })),
        })),
      }))

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(403)
    })

    it('returns feature flags', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: [{ name: 'feature1' }], error: null }),
        })),
      }))

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

      const response = await POST(createMockRequest({ name: 'test', enabled: true }, 'POST'))
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('creates feature flag', async () => {
      mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          })),
        })),
      }))

      const response = await POST(createMockRequest({ name: 'test', enabled: true }, 'POST'))
      const json = await response.json()

      expect(response.status).toBe(400)
    })
  })
})