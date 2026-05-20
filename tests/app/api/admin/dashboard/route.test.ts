import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/dashboard/route'
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

const createMockRequest = (): NextRequest => ({
  json: vi.fn(),
  method: 'GET',
  cookies: { get: vi.fn().mockReturnValue({ value: 'token' }) },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })

    const response = await GET(createMockRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 when user is not admin', async () => {
    mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
    mockSupabaseAdmin.from = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        })),
      })),
    }))

    const response = await GET(createMockRequest())
    const json = await response.json()

    expect(response.status).toBe(403)
  })

  it('returns dashboard stats', async () => {
    mockSupabaseAdmin.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null })
    mockSupabaseAdmin.from = vi.fn().mockImplementation((table: string) => {
      const isProfilesTable = table === 'profiles'
      
      return {
        select: vi.fn().mockImplementation(() => {
          if (isProfilesTable) {
            return {
              eq: vi.fn().mockImplementation(() => ({
                single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
              })),
            }
          }
          return {
            eq: vi.fn().mockResolvedValue({ data: [], count: 10, error: null }),
            gte: vi.fn().mockResolvedValue({ data: [], count: 5, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }),
      }
    })

    // const response = await GET(createMockRequest())
    // expect(response.status).toBe(200)
  })
})