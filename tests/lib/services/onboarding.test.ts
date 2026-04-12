import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/lib/services/frappe-env', () => ({
  frappeEnvManager: { getClient: vi.fn() },
}))

import { OnboardingService } from '@/lib/services/onboarding'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('OnboardingService', () => {
  let service: OnboardingService

  beforeEach(() => {
    service = new OnboardingService()
    vi.clearAllMocks()
  })

  // Helper: mock the chain .from().select('*').eq('user_id', userId).single()
  function mockOnboardingDataLookup(resolvedValue: { data: unknown; error: unknown }) {
    const mockSingle = vi.fn().mockResolvedValue(resolvedValue)
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: mockSelect,
    })
  }

  // ---------- getOnboardingData ----------

  describe('getOnboardingData', () => {
    it('returns onboarding data when found', async () => {
      const mockData = {
        user_id: 'user1',
        personal_info: { first_name: 'John' },
        address: { line1: '123 Street' },
        status: 'draft',
      }
      mockOnboardingDataLookup({ data: mockData, error: null })

      const result = await service.getOnboardingData('user1')
      expect(result).toEqual(mockData)
    })

    it('returns null when not found', async () => {
      mockOnboardingDataLookup({ data: null, error: { code: 'PGRST116' } })

      const result = await service.getOnboardingData('unknown-user')
      expect(result).toBeNull()
    })
  })

  // ---------- submitForReview ----------

  describe('submitForReview', () => {
    // TC-9.9: submitForReview fails with missing steps
    it('throws when no onboarding data found', async () => {
      mockOnboardingDataLookup({ data: null, error: { code: 'PGRST116' } })

      await expect(service.submitForReview('user1')).rejects.toThrow(
        'No onboarding data found',
      )
    })

    it('throws when required steps are missing', async () => {
      const incompleteData = {
        user_id: 'user1',
        personal_info: { first_name: 'John' },
        address: null,
        identity_documents: null,
        bank_details: null,
        emergency_contacts: null,
        education: null,
        employment_history: null,
        status: 'draft',
      }
      mockOnboardingDataLookup({ data: incompleteData, error: null })

      await expect(service.submitForReview('user1')).rejects.toThrow(
        'Missing required steps',
      )
    })

    it('error message includes specific missing step names', async () => {
      const partialData = {
        user_id: 'user1',
        personal_info: { first_name: 'John' },
        address: { line1: '123 Main' },
        identity_documents: { pan_number: 'ABCDE1234F' },
        bank_details: null,
        emergency_contacts: null,
        education: null,
        employment_history: null,
        status: 'draft',
      }
      mockOnboardingDataLookup({ data: partialData, error: null })

      try {
        await service.submitForReview('user1')
        expect.fail('should have thrown')
      } catch (err) {
        const message = (err as Error).message
        expect(message).toContain('bank_details')
        expect(message).toContain('emergency_contacts')
        expect(message).toContain('education')
        expect(message).toContain('employment_history')
        // personal_info, address, identity_documents should NOT be in the message
        expect(message).not.toContain('personal_info')
        expect(message).not.toContain('address')
      }
    })

    it('succeeds when all required steps are present', async () => {
      const completeData = {
        user_id: 'user1',
        personal_info: { first_name: 'John' },
        address: { line1: '123 Main', city: 'City' },
        identity_documents: { pan_number: 'ABCDE1234F' },
        bank_details: { account_number: '12345' },
        emergency_contacts: { contacts: [{ name: 'Jane' }] },
        education: { qualifications: [{ degree: 'B.Tech' }] },
        employment_history: { experiences: [] },
        status: 'draft',
      }

      // First call: getOnboardingData -> .from().select().eq().single()
      const mockSingle = vi.fn().mockResolvedValue({ data: completeData, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      // Second call: update onboarding_data status
      const mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

      // Third call: update profiles lifecycle_stage
      const mockProfileUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockProfileUpdate = vi.fn().mockReturnValue({ eq: mockProfileUpdateEq })

      let callCount = 0
      ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(
        (table: string) => {
          callCount++
          if (callCount === 1) {
            // getOnboardingData
            return { select: mockSelect }
          } else if (callCount === 2) {
            // update onboarding_data
            return { update: mockUpdate }
          } else {
            // update profiles
            return { update: mockProfileUpdate }
          }
        },
      )

      // Should not throw
      await expect(service.submitForReview('user1')).resolves.toBeUndefined()
    })
  })
})
