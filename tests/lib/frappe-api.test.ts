import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FrappeAPI } from '@/lib/frappe-api'
import { FRAPPE_PROXY_PREFIX } from '@/lib/frappe-base'

const FRAPPE_URL = 'http://localhost:8000'
// In a browser context (jsdom) requests go through the same-origin proxy so the
// session cookie stays first-party (iOS Safari ITP-safe). See lib/frappe-base.ts.
const API_BASE = FRAPPE_PROXY_PREFIX

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_FRAPPE_URL', FRAPPE_URL)
  vi.restoreAllMocks()
})

function mockFetch(body: unknown, ok = true, status = 200) {
  const response = {
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    json: vi.fn().mockResolvedValue(body),
    blob: vi.fn().mockResolvedValue(new Blob(['data'])),
    text: vi.fn().mockResolvedValue('error text'),
  }
  global.fetch = vi.fn().mockResolvedValue(response)
  return response
}

describe('FrappeAPI', () => {
  describe('uploadFile', () => {
    it('uploads a file and returns message', async () => {
      mockFetch({ message: { file_url: '/files/test.pdf' } })

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const result = await FrappeAPI.uploadFile(file)

      expect(result).toEqual({ file_url: '/files/test.pdf' })
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/method/upload_file`,
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
    })

    it('includes doctype and docname when provided', async () => {
      mockFetch({ message: { file_url: '/files/test.pdf' } })

      const file = new File(['content'], 'test.pdf')
      await FrappeAPI.uploadFile(file, 'DOC-001', 'Job Application')

      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const formData: FormData = call[1].body
      expect(formData.get('doctype')).toBe('Job Application')
      expect(formData.get('docname')).toBe('DOC-001')
    })

    it('throws on failed upload', async () => {
      mockFetch({}, false)

      const file = new File(['content'], 'test.pdf')
      await expect(FrappeAPI.uploadFile(file)).rejects.toThrow('Upload failed')
    })
  })

  describe('get', () => {
    it('makes GET request and returns message', async () => {
      mockFetch({ message: { result: 'data' } })

      const result = await FrappeAPI.get('my_method')
      expect(result).toEqual({ result: 'data' })
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/method/my_method`,
        expect.objectContaining({ method: 'GET', credentials: 'include' })
      )
    })

    it('appends query params', async () => {
      mockFetch({ message: 'ok' })

      await FrappeAPI.get('my_method', { key: 'value', foo: 'bar' })

      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('key=value')
      expect(url).toContain('foo=bar')
    })

    it('makes request without params when none provided', async () => {
      mockFetch({ message: 'ok' })

      await FrappeAPI.get('my_method')
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toBe(`${API_BASE}/api/method/my_method`)
    })

    it('throws on failed response', async () => {
      mockFetch({}, false, 500)
      await expect(FrappeAPI.get('my_method')).rejects.toThrow('API request failed')
    })
  })

  describe('getResource', () => {
    it('fetches a resource list and returns response data', async () => {
      const responseData = { data: [{ name: 'job-1' }, { name: 'job-2' }] }
      mockFetch(responseData)

      const result = await FrappeAPI.getResource('Job Application')
      expect(result).toEqual(responseData)
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/resource/Job Application`,
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('appends query params to resource URL', async () => {
      mockFetch({ data: [] })

      await FrappeAPI.getResource('Job Application', { status: 'Open' })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('status=Open')
    })

    it('unencodes bracket characters in query string', async () => {
      mockFetch({ data: [] })

      await FrappeAPI.getResource('Doctype', { 'filters[0]': 'value' })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('[')
      expect(url).toContain(']')
    })

    it('throws on failed response', async () => {
      mockFetch({}, false, 404)
      await expect(FrappeAPI.getResource('Unknown')).rejects.toThrow('API request failed')
    })
  })

  describe('getBlob', () => {
    it('returns a Blob on success', async () => {
      mockFetch({})

      const result = await FrappeAPI.getBlob('get_pdf')
      expect(result).toBeInstanceOf(Blob)
    })

    it('throws on failed response', async () => {
      mockFetch({}, false, 500)
      await expect(FrappeAPI.getBlob('get_pdf')).rejects.toThrow('API request failed')
    })

    it('appends query params', async () => {
      mockFetch({})

      await FrappeAPI.getBlob('get_pdf', { docname: 'JOB-001' })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('docname=JOB-001')
    })
  })

  describe('post', () => {
    it('makes POST request and returns message', async () => {
      mockFetch({ message: { success: true } })

      const result = await FrappeAPI.post('my_method', { key: 'value' })
      expect(result).toEqual({ success: true })

      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(call[0]).toBe(`${API_BASE}/api/method/my_method`)
      expect(call[1].method).toBe('POST')
      expect(call[1].headers['Content-Type']).toBe('application/json')
      expect(JSON.parse(call[1].body)).toEqual({ key: 'value' })
    })

    it('throws on failed response', async () => {
      mockFetch({}, false, 400)
      await expect(FrappeAPI.post('my_method', {})).rejects.toThrow('API request failed')
    })

    it('sends credentials with request', async () => {
      mockFetch({ message: 'ok' })

      await FrappeAPI.post('my_method', {})
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(call[1].credentials).toBe('include')
    })
  })

  describe('getresourceDocumentData', () => {
    it('fetches a list with default GET method', async () => {
      mockFetch({ data: [] })

      await FrappeAPI.getresourceDocumentData('Job Application')
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('/api/resource/Job Application')
    })

    it('fetches a single document when name is provided', async () => {
      mockFetch({ data: { name: 'JOB-001' } })

      await FrappeAPI.getresourceDocumentData('Job Application', { name: 'JOB-001' })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('/api/resource/Job Application/JOB-001')
    })

    it('includes fields param when specified', async () => {
      mockFetch({ data: [] })

      await FrappeAPI.getresourceDocumentData('Job Application', {
        fields: ['name', 'status'],
      })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('fields=')
    })

    it('includes filters param when specified', async () => {
      mockFetch({ data: [] })

      await FrappeAPI.getresourceDocumentData('Job Application', {
        filters: [['status', '=', 'Open']],
      })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('filters=')
    })

    it('includes pagination params', async () => {
      mockFetch({ data: [] })

      await FrappeAPI.getresourceDocumentData('Job Application', { page: 2, limit: 10 })
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(url).toContain('limit_page_length=10')
      expect(url).toContain('limit_start=10')
    })

    it('makes POST request with body data', async () => {
      mockFetch({ data: {} })

      await FrappeAPI.getresourceDocumentData('Job Application', {
        method: 'POST',
        data: { status: 'Submitted' },
      })
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(call[1].method).toBe('POST')
      expect(JSON.parse(call[1].body)).toEqual({ status: 'Submitted' })
    })

    it('throws on failed response', async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Server error details'),
        json: vi.fn(),
      }
      global.fetch = vi.fn().mockResolvedValue(response)

      await expect(FrappeAPI.getresourceDocumentData('BadDoctype'))
        .rejects.toThrow()
    })
  })
})
