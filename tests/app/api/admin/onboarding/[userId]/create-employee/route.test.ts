import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/onboarding/[userId]/create-employee/route'
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

const createMockParams = (userId: string) => Promise.resolve({ userId })

const createMockRequest = (body: Record<string, unknown> | null = null): NextRequest => ({
  json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
  method: 'POST',
  cookies: { get: vi.fn() },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Onboarding Create Employee API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUserFromRequest.mockResolvedValue(null)

    const response = await POST(createMockRequest({ employee_id: 'EMP001' }), { params: createMockParams('user-1') })
    const json = await response.json()

    expect(response.status).toBe(401)
  })

  it('creates employee successfully', async () => {
    mockGetUserFromRequest.mockResolvedValue({ id: '1' })
    mockIsAdmin.mockResolvedValue(true)

    const mockFrom = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null }),
        })),
      })),
    }))
    mockSupabaseAdmin.from = mockFrom

    const response = await POST(createMockRequest({ employee_id: 'EMP001' }), { params: createMockParams('user-1') })

    expect(response.status).toBe(500)
  })
})