import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

const WEBHOOK_SECRET = 'default-webhook-secret'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { POST, GET } from '@/app/api/webhooks/frappe/route'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

function generateValidSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

function createMockRequest(body: object, signature: string, contentType = 'application/json'): NextRequest {
  const headers = new Headers({
    'content-type': contentType,
    'x-frappe-signature': signature,
  })

  return new NextRequest('http://localhost:3000/api/webhooks/frappe', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as NextRequest
}

describe('Frappe Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/webhooks/frappe', () => {
    it('returns health status', async () => {
      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('healthy')
      expect(json.data.supported_resources).toEqual(['job', 'application', 'company'])
    })
  })

  describe('POST /api/webhooks/frappe', () => {
    describe('input validation', () => {
      it('returns 400 for non-JSON content type', async () => {
        const body = { resource: 'job', data: {} }
        const payload = JSON.stringify(body)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)

        const headers = new Headers({
          'content-type': 'text/plain',
          'x-frappe-signature': signature,
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks/frappe', {
          method: 'POST',
          headers,
          body: payload,
        }) as NextRequest

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.success).toBe(false)
      })

      it('returns 400 for invalid JSON payload', async () => {
        const payload = 'not-valid-json'
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)

        const headers = new Headers({
          'content-type': 'application/json',
          'x-frappe-signature': signature,
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks/frappe', {
          method: 'POST',
          headers,
          body: payload,
        }) as NextRequest

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.success).toBe(false)
      })

      it('returns 401 for missing signature', async () => {
        const body = { resource: 'job', data: {} }
        const headers = new Headers({ 'content-type': 'application/json' })

        const request = new NextRequest('http://localhost:3000/api/webhooks/frappe', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        }) as NextRequest

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(401)
        expect(json.success).toBe(false)
      })

      it('returns 401 for invalid signature', async () => {
        const body = {
          event_type: 'created',
          timestamp: '2024-01-01T00:00:00Z',
          source: 'frappe',
          signature: 'test',
          resource: 'job',
          data: {
            job_id: 'job-123',
            title: 'Test',
            company: 'Test Corp',
            description: 'Test',
            location: 'Remote',
            job_type: 'full-time',
            experience_level: 'mid',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }
        const payload = JSON.stringify(body)

        const headers = new Headers({
          'content-type': 'application/json',
          'x-frappe-signature': 'sha256=invalidsignature1234567890123456789012345678901234567890123',
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks/frappe', {
          method: 'POST',
          headers,
          body: payload,
        }) as NextRequest

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(401)
        expect(json.success).toBe(false)
      })

      it('returns 400 for unsupported resource type', async () => {
        const body = {
          event_type: 'created',
          timestamp: '2024-01-01T00:00:00Z',
          source: 'frappe',
          signature: 'test',
          resource: 'unsupported',
          data: {},
        }
        const payload = JSON.stringify(body)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)

        const request = createMockRequest(body, signature)

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.success).toBe(false)
      })
    })

    describe('job webhook', () => {
      const validJobPayload = {
        event_type: 'created' as const,
        timestamp: '2024-01-01T00:00:00Z',
        source: 'frappe' as const,
        signature: 'test',
        resource: 'job' as const,
        data: {
          job_id: 'job-123',
          title: 'Software Engineer',
          company: 'Tech Corp',
          description: 'Great opportunity',
          requirements: ['JavaScript', 'React'],
          benefits: ['Health insurance'],
          salary_min: 50000,
          salary_max: 80000,
          location: 'Remote',
          job_type: 'full-time' as const,
          experience_level: 'mid' as const,
          skills_required: ['JavaScript', 'TypeScript'],
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      }

      it('creates a new job', async () => {
        const payload = JSON.stringify(validJobPayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(validJobPayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-job-id', ...validJobPayload.data },
              error: null,
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'jobs') {
            return {
              select: mockSelect,
              insert: mockInsert,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('updates existing job', async () => {
        const updatePayload = { ...validJobPayload, event_type: 'updated' as const }
        const payload = JSON.stringify(updatePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(updatePayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-job-id' },
              error: null,
            }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-job-id', ...updatePayload.data },
                error: null,
              }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'jobs') {
            return {
              select: mockSelect,
              update: mockUpdate,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('deletes job (soft delete)', async () => {
        const deletePayload = { ...validJobPayload, event_type: 'deleted' as const }
        const payload = JSON.stringify(deletePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(deletePayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'job-to-delete' },
              error: null,
            }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'job-to-delete', is_active: false },
                error: null,
              }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'jobs') {
            return {
              select: mockSelect,
              update: mockUpdate,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('returns 400 for invalid job payload', async () => {
        const invalidJobPayload = {
          ...validJobPayload,
          data: {
            ...validJobPayload.data,
            job_type: 'invalid-type',
          },
        }
        const payload = JSON.stringify(invalidJobPayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(invalidJobPayload, signature)

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.success).toBe(false)
      })

      it('returns 404 when job not found on delete', async () => {
        const deletePayload = { ...validJobPayload, event_type: 'deleted' as const }
        const payload = JSON.stringify(deletePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(deletePayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'jobs') {
            return {
              select: mockSelect,
              update: mockUpdate,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(404)
        expect(json.success).toBe(false)
      })
    })

    describe('application webhook', () => {
      const validApplicationPayload = {
        event_type: 'created' as const,
        timestamp: '2024-01-01T00:00:00Z',
        source: 'frappe' as const,
        signature: 'test',
        resource: 'application' as const,
        data: {
          application_id: 'app-123',
          job_id: 'job-123',
          candidate_email: 'candidate@example.com',
          candidate_name: 'John Doe',
          status: 'pending' as const,
          cover_letter: 'Cover letter text',
          resume_url: 'https://example.com/resume.pdf',
          applied_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      }

      it('creates a new application', async () => {
        const payload = JSON.stringify(validApplicationPayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(validApplicationPayload, signature)

        const mockProfileSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-123' },
              error: null,
            }),
          }),
        })

        const mockJobSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'job-123' },
              error: null,
            }),
          }),
        })

        const mockAppSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-app-id' },
              error: null,
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'profiles') return { select: mockProfileSelect } as ReturnType<typeof supabaseAdmin.from>
          if (table === 'jobs') return { select: mockJobSelect } as ReturnType<typeof supabaseAdmin.from>
          if (table === 'applications') return { select: mockAppSelect, insert: mockInsert } as ReturnType<typeof supabaseAdmin.from>
          return { select: vi.fn() } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('updates existing application', async () => {
        const updatePayload = { ...validApplicationPayload, event_type: 'updated' as const }
        const payload = JSON.stringify(updatePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(updatePayload, signature)

        const mockProfileSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-123' },
              error: null,
            }),
          }),
        })

        const mockJobSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'job-123' },
              error: null,
            }),
          }),
        })

        const mockAppSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-app-id' },
              error: null,
            }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-app-id', ...updatePayload.data },
                error: null,
              }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'profiles') return { select: mockProfileSelect } as ReturnType<typeof supabaseAdmin.from>
          if (table === 'jobs') return { select: mockJobSelect } as ReturnType<typeof supabaseAdmin.from>
          if (table === 'applications') return { select: mockAppSelect, update: mockUpdate } as ReturnType<typeof supabaseAdmin.from>
          return { select: vi.fn() } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('returns 404 when candidate not found', async () => {
        const payload = JSON.stringify(validApplicationPayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(validApplicationPayload, signature)

        const mockProfileSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const mockJobSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'job-123' },
              error: null,
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'profiles') return { select: mockProfileSelect } as ReturnType<typeof supabaseAdmin.from>
          if (table === 'jobs') return { select: mockJobSelect } as ReturnType<typeof supabaseAdmin.from>
          return { select: vi.fn() } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(404)
        expect(json.success).toBe(false)
      })

      it('returns 404 when job not found', async () => {
        const payload = JSON.stringify(validApplicationPayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(validApplicationPayload, signature)

        const mockProfileSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-123' },
              error: null,
            }),
          }),
        })

        const mockJobSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'profiles') return { select: mockProfileSelect } as ReturnType<typeof supabaseAdmin.from>
          if (table === 'jobs') return { select: mockJobSelect } as ReturnType<typeof supabaseAdmin.from>
          return { select: vi.fn() } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(404)
        expect(json.success).toBe(false)
      })

      it('deletes application', async () => {
        const deletePayload = { ...validApplicationPayload, event_type: 'deleted' as const }
        const payload = JSON.stringify(deletePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(deletePayload, signature)

        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'app-to-delete' },
                error: null,
              }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'applications') return { delete: mockDelete } as unknown as ReturnType<typeof supabaseAdmin.from>
          return { select: vi.fn() } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })
    })

    describe('company webhook', () => {
      const validCompanyPayload = {
        event_type: 'created' as const,
        timestamp: '2024-01-01T00:00:00Z',
        source: 'frappe' as const,
        signature: 'test',
        resource: 'company' as const,
        data: {
          company_id: 'company-123',
          name: 'Tech Corp',
          description: 'A great tech company',
          website: 'https://techcorp.com',
          logo_url: 'https://techcorp.com/logo.png',
          location: 'San Francisco',
          industry: 'Technology',
          size: '201-500' as const,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      }

      it('creates a new company', async () => {
        const payload = JSON.stringify(validCompanyPayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(validCompanyPayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-company-id' },
              error: null,
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              select: mockSelect,
              insert: mockInsert,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('updates existing company', async () => {
        const updatePayload = { ...validCompanyPayload, event_type: 'updated' as const }
        const payload = JSON.stringify(updatePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(updatePayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-company-id' },
              error: null,
            }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-company-id', ...updatePayload.data },
                error: null,
              }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              select: mockSelect,
              update: mockUpdate,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('deletes company (soft delete)', async () => {
        const deletePayload = { ...validCompanyPayload, event_type: 'deleted' as const }
        const payload = JSON.stringify(deletePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(deletePayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'company-to-delete' },
              error: null,
            }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'company-to-delete', is_active: false },
                error: null,
              }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              select: mockSelect,
              update: mockUpdate,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.success).toBe(true)
      })

      it('returns 404 when company not found on delete', async () => {
        const deletePayload = { ...validCompanyPayload, event_type: 'deleted' as const }
        const payload = JSON.stringify(deletePayload)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(deletePayload, signature)

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        })

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        })

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation((table: string) => {
          if (table === 'companies') {
            return {
              select: mockSelect,
              update: mockUpdate,
            } as ReturnType<typeof supabaseAdmin.from>
          }
          return { select: mockSelect } as ReturnType<typeof supabaseAdmin.from>
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(404)
        expect(json.success).toBe(false)
      })
    })

    describe('error handling', () => {
      it('returns 500 for unexpected errors', async () => {
        const body = {
          event_type: 'created' as const,
          timestamp: '2024-01-01T00:00:00Z',
          source: 'frappe' as const,
          signature: 'test',
          resource: 'job' as const,
          data: {
            job_id: 'job-123',
            title: 'Test',
            company: 'Test Corp',
            description: 'Test',
            location: 'Remote',
            job_type: 'full-time' as const,
            experience_level: 'mid' as const,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }
        const payload = JSON.stringify(body)
        const signature = generateValidSignature(payload, WEBHOOK_SECRET)
        const request = createMockRequest(body, signature)

        const fromMock = vi.mocked(supabaseAdmin.from)
        fromMock.mockImplementation(() => {
          throw new Error('Database connection error')
        })

        const response = await POST(request)
        const json = await response.json()

        expect(response.status).toBe(500)
        expect(json.success).toBe(false)
      })
    })
  })
})