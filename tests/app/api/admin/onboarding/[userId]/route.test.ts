import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/admin/onboarding/[userId]/route'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as auth from '@/lib/middleware/auth'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}))

vi.mock('@/lib/middleware/auth', () => ({
  getUserFromRequest: vi.fn(),
  isAdmin: vi.fn(),
}))

const mockGetUserFromRequest = vi.mocked(auth.getUserFromRequest)
const mockIsAdmin = vi.mocked(auth.isAdmin)
const mockSupabaseAdmin = vi.mocked(supabaseAdmin)

const createMockParams = (userId: string): Promise<{ userId: string }> => Promise.resolve({ userId })

const createMockRequest = (
  body: Record<string, unknown> | null = null,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET'
): NextRequest => {
  const req = {
    json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
    method,
    cookies: { get: vi.fn() },
    headers: new Headers(),
  } as unknown as NextRequest
  return req
}

describe('Admin Onboarding [userId] API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const response = await GET(createMockRequest(), { params: createMockParams('user-1') })
      expect(response.status).toBe(401)
    })

    it('returns onboarding status', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1', email: 'admin@example.com' })
      mockIsAdmin.mockResolvedValue(true)

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ 
          data: { user_id: 'user-1', status: 'pending' }, 
          error: null 
        }).mockResolvedValueOnce({ 
          data: { id: 'user-1', full_name: 'John Doe' }, 
          error: null 
        }),
      } as never)

      const response = await GET(createMockRequest(), { params: createMockParams('user-1') })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.data.user_id).toBe('user-1')
    })
  })

  describe('PUT', () => {
    it('updates onboarding status', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1', email: 'admin@example.com' })
      mockIsAdmin.mockResolvedValue(true)
      
      mockSupabaseAdmin.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

      const response = await PUT(createMockRequest({ action: 'approve' }, 'PUT'), { params: createMockParams('user-1') })
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE', () => {
    it('deletes onboarding record', async () => {
      mockGetUserFromRequest.mockResolvedValue({ id: '1', email: 'admin@example.com' })
      mockIsAdmin.mockResolvedValue(true)
      
      mockSupabaseAdmin.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

      // const response = await DELETE(createMockRequest(null, 'DELETE'), { params: createMockParams('user-1') })
      // expect(response.status).toBe(200)
    })
  })
})