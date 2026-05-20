import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET, DELETE } from '@/app/api/admin/sync/route'
import * as auth from '@/lib/middleware/auth'

vi.mock('@/lib/middleware/auth', () => ({
  getUserFromRequest: vi.fn(),
  isAdmin: vi.fn(),
}))

const mockGetUserFromRequest = auth.getUserFromRequest as ReturnType<typeof vi.fn>
const mockIsAdmin = auth.isAdmin as ReturnType<typeof vi.fn>

const createMockRequest = (
  body: Record<string, unknown> | null,
  queryParams: Record<string, string> = {},
  method: 'POST' | 'GET' | 'DELETE' = 'GET'
): NextRequest => {
  const url = new URL('http://localhost:3000/api/admin/sync')
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const request = {
    url: url.toString(),
    json: vi.fn().mockResolvedValue(body),
    method,
    headers: new Headers(),
  } as unknown as NextRequest

  return request
}

const createAuthenticatedUser = () => ({
  id: 'user-123',
  email: 'admin@example.com',
  role: 'admin',
})

describe('Admin Sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/admin/sync', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest({ entity_type: 'jobs' }, {}, 'POST')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const request = createMockRequest({ entity_type: 'jobs' }, {}, 'POST')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.success).toBe(false)
    })

    it('returns validation error for invalid entity_type', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest({ entity_type: 'invalid' }, {}, 'POST')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns 409 when sync job is already running', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const firstRequest = createMockRequest({ entity_type: 'jobs', force: true }, {}, 'POST')
      await POST(firstRequest)

      const request = createMockRequest({ entity_type: 'jobs', force: false }, {}, 'POST')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.success).toBe(false)
      expect(json.error).toContain('already running')
    })

    it('starts sync job successfully with force flag', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest({ entity_type: 'jobs', force: true }, {}, 'POST')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.sync_job).toHaveProperty('id')
      expect(json.data.sync_job.status).toBe('pending')
      expect(json.data.sync_job.entity_type).toBe('jobs')
    })

    it('starts sync job for all entities successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest({ entity_type: 'all', batch_size: 50 }, {}, 'POST')
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.sync_job.entity_type).toBe('all')
    })
  })

  describe('GET /api/admin/sync', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest(null, {}, 'GET')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const request = createMockRequest(null, {}, 'GET')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.success).toBe(false)
    })

    it('returns 404 when sync job not found', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, { sync_id: 'non-existent-id' }, 'GET')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.success).toBe(false)
    })

    it('returns sync job with progress percentage', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const postRequest = createMockRequest({ entity_type: 'jobs', force: true }, {}, 'POST')
      await POST(postRequest)

      const postResponse = await POST(postRequest)
      const postJson = await postResponse.json()
      const syncId = postJson.data.sync_job.id

      const getRequest = createMockRequest(null, { sync_id: syncId }, 'GET')
      const getResponse = await GET(getRequest)
      const getJson = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getJson.success).toBe(true)
      expect(getJson.data.sync_job).toHaveProperty('progress_percentage')
    })

    it('returns all sync jobs with summary', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, {}, 'GET')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.sync_jobs).toBeInstanceOf(Array)
      expect(json.data.summary).toHaveProperty('total_jobs')
      expect(json.data.summary).toHaveProperty('running_jobs')
      expect(json.data.summary).toHaveProperty('completed_jobs')
      expect(json.data.summary).toHaveProperty('failed_jobs')
    })
  })

  describe('DELETE /api/admin/sync', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUserFromRequest.mockResolvedValue(null)

      const request = createMockRequest(null, { sync_id: 'some-id' }, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('returns 403 when user is not admin', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(false)

      const request = createMockRequest(null, { sync_id: 'some-id' }, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.success).toBe(false)
    })

    it('returns 400 when sync_id is missing', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, {}, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
    })

    it('returns 404 when sync job not found', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const request = createMockRequest(null, { sync_id: 'non-existent-id' }, 'DELETE')
      const response = await DELETE(request)
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.success).toBe(false)
    })

    it('cancels running sync job successfully', async () => {
      mockGetUserFromRequest.mockResolvedValue(createAuthenticatedUser())
      mockIsAdmin.mockResolvedValue(true)

      const postRequest = createMockRequest({ entity_type: 'jobs', force: true }, {}, 'POST')
      await POST(postRequest)

      const postResponse = await POST(postRequest)
      const postJson = await postResponse.json()
      const syncId = postJson.data.sync_job.id

      const deleteRequest = createMockRequest(null, { sync_id: syncId }, 'DELETE')
      const deleteResponse = await DELETE(deleteRequest)
      const deleteJson = await deleteResponse.json()

      expect(deleteResponse.status).toBe(200)
      expect(deleteJson.success).toBe(true)
      expect(deleteJson.data.sync_job_id).toBe(syncId)
    })
  })
})