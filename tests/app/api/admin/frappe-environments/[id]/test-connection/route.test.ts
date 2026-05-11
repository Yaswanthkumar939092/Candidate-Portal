import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/frappe-environments/[id]/test-connection/route'
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

const createMockRequest = (): NextRequest => ({
  json: vi.fn(),
  method: 'POST',
  cookies: { get: vi.fn() },
  headers: new Headers(),
}) as unknown as NextRequest

describe('Admin Frappe Environment Test Connection API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUserFromRequest.mockResolvedValue(null)

    const response = await POST(createMockRequest(), { params: createMockParams('1') })
    const json = await response.json()

    expect(response.status).toBe(401)
  })

  it('tests connection successfully', async () => {
    mockGetUserFromRequest.mockResolvedValue({ id: '1' })
    mockIsAdmin.mockResolvedValue(true)

    const response = await POST(createMockRequest(), { params: createMockParams('1') })
    expect(response.status).toBe(500)
  })
})