import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/lib/services/frappe-env', () => ({
  frappeEnvManager: { getClient: vi.fn() },
}))

import { InternalEmployeeDetector } from '@/lib/services/employee-detection'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { frappeEnvManager } from '@/lib/services/frappe-env'

describe('InternalEmployeeDetector', () => {
  let detector: InternalEmployeeDetector

  beforeEach(() => {
    detector = new InternalEmployeeDetector()
    vi.clearAllMocks()
  })

  // Helper: mock the Supabase chain for .from().select('*').eq().eq().single()
  function mockDomainLookup(resolvedValue: { data: unknown; error: unknown }) {
    const mockSingle = vi.fn().mockResolvedValue(resolvedValue)
    const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })
  }

  // ---------- detectByDomain ----------

  describe('detectByDomain', () => {
    // TC-8.1: Internal employee detection by email domain
    it('detects internal employee by email domain', async () => {
      mockDomainLookup({
        data: {
          domain: 'physicswallah.com',
          company_name: 'PW',
          is_active: true,
        },
        error: null,
      })

      const result = await detector.detectByDomain('user@physicswallah.com')
      expect(result.is_internal).toBe(true)
      expect(result.method).toBe('domain_match')
      expect(result.company_name).toBe('PW')
    })

    // TC-8.2: External user not detected as internal
    it('does not detect external user as internal', async () => {
      mockDomainLookup({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await detector.detectByDomain('user@gmail.com')
      expect(result.is_internal).toBe(false)
      expect(result.method).toBeUndefined()
    })

    it('returns not internal for email without @ sign', async () => {
      const result = await detector.detectByDomain('invalid-email')
      expect(result.is_internal).toBe(false)
    })
  })

  // ---------- detectByFrappe ----------

  describe('detectByFrappe', () => {
    // TC-8.3: Falls back to Frappe Employee lookup
    it('detects internal employee via Frappe lookup', async () => {
      const mockClient = {
        checkEmployeeExists: vi.fn().mockResolvedValue(true),
      }
      ;(frappeEnvManager.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockClient,
      )

      const result = await detector.detectByFrappe('user@subsidiary.com')
      expect(result.is_internal).toBe(true)
      expect(result.method).toBe('frappe_lookup')
      expect(mockClient.checkEmployeeExists).toHaveBeenCalledWith(
        'user@subsidiary.com',
      )
    })

    it('returns not internal when Frappe says employee does not exist', async () => {
      const mockClient = {
        checkEmployeeExists: vi.fn().mockResolvedValue(false),
      }
      ;(frappeEnvManager.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockClient,
      )

      const result = await detector.detectByFrappe('user@external.com')
      expect(result.is_internal).toBe(false)
    })

    it('returns not internal when Frappe is unreachable', async () => {
      ;(frappeEnvManager.getClient as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Connection refused'),
      )

      const result = await detector.detectByFrappe('user@down.com')
      expect(result.is_internal).toBe(false)
    })
  })

  // ---------- detectInternal ----------

  describe('detectInternal', () => {
    it('returns domain match when domain is recognized', async () => {
      mockDomainLookup({
        data: { domain: 'acme.com', company_name: 'Acme', is_active: true },
        error: null,
      })

      const result = await detector.detectInternal('emp@acme.com')
      expect(result.is_internal).toBe(true)
      expect(result.method).toBe('domain_match')
      // Frappe should NOT have been called since domain matched
      expect(frappeEnvManager.getClient).not.toHaveBeenCalled()
    })

    it('falls back to Frappe when domain is not recognized', async () => {
      // Domain lookup returns nothing
      mockDomainLookup({ data: null, error: { code: 'PGRST116' } })

      // Frappe lookup finds the employee
      const mockClient = {
        checkEmployeeExists: vi.fn().mockResolvedValue(true),
      }
      ;(frappeEnvManager.getClient as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockClient,
      )

      const result = await detector.detectInternal('user@subsidiary.com')
      expect(result.is_internal).toBe(true)
      expect(result.method).toBe('frappe_lookup')
    })

    it('returns not internal when both domain and Frappe fail', async () => {
      mockDomainLookup({ data: null, error: { code: 'PGRST116' } })
      ;(frappeEnvManager.getClient as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('down'),
      )

      const result = await detector.detectInternal('nobody@unknown.com')
      expect(result.is_internal).toBe(false)
    })
  })
})
