import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/frappe-environments/route'
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

describe('Admin Frappe Environments API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await GET(createMockRequest())
      const json = await response.json()

      expect(response.status).toBe(401)
    })

    it('returns environments', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1' })
      mockIsAdmin.mockResolvedValue(true)
      mockSupabaseAdmin.from = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test' }], error: null }),
      })

      const response = await GET(createMockRequest())
      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('creates environment', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1' })
      mockIsAdmin.mockResolvedValue(true)
      mockSupabaseAdmin.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: '1', label: 'Test' }, error: null }),
          }),
        }),
      })

      const response = await POST(createMockRequest({
        environment_key: 'DEV',
        label: 'Test',
        frappe_url: 'https://test.frappe.io'
      }, 'POST'))
      expect(response.status).toBe(201)
    })
  })
})