import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/admin/jobs/[id]/visibility/route'
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

const createMockRequest = (body: Record<string, unknown> | null = null): NextRequest => ({
  json: body ? vi.fn().mockResolvedValue(body) : vi.fn(),
  method: 'PUT',
  cookies: { get: vi.fn() },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Job Visibility API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUserFromRequest.mockResolvedValue(null)

    const response = await PUT(createMockRequest({ is_active: true }), { params: createMockParams('1') })
    const json = await response.json()

    expect(response.status).toBe(401)
  })

  it('updates visibility successfully', async () => {
    mockGetUserFromRequest.mockResolvedValue({ id: '1' })
    mockIsAdmin.mockResolvedValue(true)

    const response = await PUT(createMockRequest({ is_active: true }), { params: createMockParams('1') })
    const json = await response.json()

    expect(response.status).toBe(400)
  })
})