import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/middleware/auth', () => ({
  getUserFromRequest: vi.fn(),
}))

import { GET, POST, PUT, DELETE } from '@/app/api/users/documents/route'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { NextRequest } from 'next/server'

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
} as User

function createMockRequest(
  body: object | null = null,
  searchParams: Record<string, string> = {},
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): NextRequest {
  const url = new URL('http://localhost:3000/api/users/documents')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const headers = new Headers({ 'content-type': 'application/json' })

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  }) as NextRequest
}

function createQueryBuilder(returnValue?: { data: unknown; error: unknown; count?: number }) {
  const defaultValue = returnValue || { data: [], error: null, count: 0 }
  
  const builder = {
    select: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    neq: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    range: vi.fn().mockImplementation(() => defaultValue),
    single: vi.fn().mockImplementation(() => ({ data: null, error: null })),
    insert: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockImplementation(() => defaultValue),
      })),
    })),
    update: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
  }

  return builder
}

describe('User Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserFromRequest).mockResolvedValue(mockUser)
    vi.mocked(supabaseAdmin.from).mockImplementation(() => createQueryBuilder())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/users/documents', () => {
    it('returns 401 when user not authenticated', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns documents with pagination', async () => {
      const mockDocuments = [
        { id: 'doc-1', name: 'Resume', type: 'resume', file_size: 1024 },
        { id: 'doc-2', name: 'Cover Letter', type: 'cover_letter', file_size: 512 },
      ]

      const builder = createQueryBuilder({ data: mockDocuments, error: null, count: 2 })
      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest()
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.documents).toEqual(mockDocuments)
      expect(json.data.pagination.page).toBe(1)
      expect(json.data.pagination.total).toBe(2)
    })

    it('filters documents by type', async () => {
      const builder = createQueryBuilder({ data: [], error: null, count: 0 })
      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(null, { type: 'resume' })
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('returns error for invalid query params', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => {
        throw new Error('Invalid')
      })
      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(null, { limit: '999' })
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.success).toBe(false)
    })
  })

  describe('POST /api/users/documents', () => {
    it('returns 401 when user not authenticated', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue(null)

      const request = createMockRequest({
        name: 'Resume',
        type: 'resume',
        file_url: 'https://example.com/resume.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
      }, {}, 'POST')

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('creates document successfully', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockResolvedValue({ data: [{ file_size: 1024 }], error: null }),
        })),
      }))
      builder.insert = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockImplementation(() => ({
            data: { id: 'new-doc-id', name: 'Resume', type: 'resume' },
            error: null,
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest({
        name: 'Resume',
        type: 'resume',
        file_url: 'https://example.com/resume.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
      }, {}, 'POST')

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.name).toBe('Resume')
    })

    it('returns 413 when storage limit exceeded', async () => {
      const mockSelectResult = {
        data: [
          { file_size: 40 * 1024 * 1024 },
          { file_size: 10 * 1024 * 1024 },
        ],
        error: null,
      }
      
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => mockSelectResult),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest({
        name: 'Large File',
        type: 'other',
        file_url: 'https://example.com/large.pdf',
        file_size: 5 * 1024 * 1024,
        file_type: 'application/pdf',
      }, {}, 'POST')

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(413)
      expect(json.success).toBe(false)
    })

    it('returns validation error for invalid input', async () => {
      const builder = createQueryBuilder()
      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest({
        name: '',
        type: 'invalid-type',
        file_url: 'not-a-url',
        file_size: -1,
        file_type: '',
      }, {}, 'POST')

      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.errors).toBeDefined()
    })
  })

  describe('PUT /api/users/documents', () => {
    it('returns 401 when user not authenticated', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue(null)

      const request = createMockRequest({ name: 'Updated Name' }, { id: 'doc-123' }, 'PUT')
      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 400 when document ID missing', async () => {
      const request = createMockRequest({ name: 'Updated Name' }, {}, 'PUT')
      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns 400 for invalid UUID format', async () => {
      const request = createMockRequest({ name: 'Updated Name' }, { id: 'invalid-id' }, 'PUT')
      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns 404 when document not found', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        { name: 'Updated Name' },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        'PUT'
      )
      const response = await PUT(request)

      expect(response.status).toBe(404)
    })

    it('updates document successfully', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'doc-123', type: 'resume', is_primary: false },
              error: null,
            }),
          })),
        })),
      }))
      builder.update = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'doc-123', name: 'Updated Name', type: 'resume' },
                error: null,
              }),
            })),
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        { name: 'Updated Name' },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        'PUT'
      )
      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })

it('sets primary document and unsets others', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'doc-123', type: 'resume', is_primary: false },
              error: null,
            }),
          })),
        })),
      }))

      const mockSelect = vi.fn().mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: 'doc-123', name: 'Resume', is_primary: true },
          error: null,
        }),
      }))

      builder.update = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            neq: vi.fn().mockImplementation(() => ({
              select: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
            select: mockSelect,
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        { is_primary: true },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        'PUT'
      )
      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  describe('DELETE /api/users/documents', () => {
    it('returns 401 when user not authenticated', async () => {
      vi.mocked(getUserFromRequest).mockResolvedValue(null)

      const request = createMockRequest(null, { id: 'doc-123' }, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 400 when document ID missing', async () => {
      const request = createMockRequest(null, {}, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns 400 for invalid UUID format', async () => {
      const request = createMockRequest(null, { id: 'invalid-id' }, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns 404 when document not found', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        null,
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        'DELETE'
      )
      const response = await DELETE(request)

      expect(response.status).toBe(404)
    })

    it('deletes document successfully', async () => {
      const builder = createQueryBuilder()
      builder.select = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'doc-123', file_url: 'https://example.com/file.pdf', type: 'resume' },
              error: null,
            }),
          })),
        })),
      }))
      builder.delete = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'doc-123' },
                error: null,
              }),
            })),
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        null,
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        'DELETE'
      )
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('returns 500 on database error', async () => {
      const builder = createQueryBuilder()
      builder.eq = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'doc-123', file_url: 'https://example.com/file.pdf', type: 'resume' },
            error: null,
          }),
        })),
      }))
      builder.delete = vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          })),
        })),
      }))

      vi.mocked(supabaseAdmin.from).mockReturnValue(builder as unknown as ReturnType<typeof supabaseAdmin.from>)

      const request = createMockRequest(
        null,
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        'DELETE'
      )
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.success).toBe(false)
    })
  })
})