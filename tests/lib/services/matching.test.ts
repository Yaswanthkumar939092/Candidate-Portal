import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase-admin before importing the module under test
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { MatchingService } from '@/lib/services/matching'

describe('MatchingService', () => {
  let service: MatchingService

  beforeEach(() => {
    service = new MatchingService()
  })

  // ---------- extractKeywords ----------

  describe('extractKeywords', () => {
    // TC-5.2: Keyword extraction removes stop words and deduplicates
    it('removes stop words and deduplicates', () => {
      const keywords = service.extractKeywords(
        'I am a React and TypeScript developer with Node.js experience',
      )
      expect(keywords).toContain('react')
      expect(keywords).toContain('typescript')
      expect(keywords).toContain('node.js')
      expect(keywords).toContain('developer')
      // 'i' is a single char so filtered by length < 2
      expect(keywords).not.toContain('i')
      // 'a' is a single char so filtered by length < 2
      expect(keywords).not.toContain('a')
      // Common stop words
      expect(keywords).not.toContain('and')
      expect(keywords).not.toContain('with')
      // "experience" is listed in the job-filler stop words
      expect(keywords).not.toContain('experience')
    })

    it('returns empty array for empty string', () => {
      expect(service.extractKeywords('')).toEqual([])
    })

    it('returns empty array for null-ish input', () => {
      // The function guards with `if (!text) return []`
      expect(service.extractKeywords(undefined as unknown as string)).toEqual([])
    })

    it('lowercases all tokens', () => {
      const keywords = service.extractKeywords('React ANGULAR Vue')
      expect(keywords).toContain('react')
      expect(keywords).toContain('angular')
      expect(keywords).toContain('vue')
      expect(keywords).not.toContain('React')
    })

    it('deduplicates repeated words', () => {
      const keywords = service.extractKeywords('react react react typescript typescript')
      expect(keywords.filter((k) => k === 'react').length).toBe(1)
      expect(keywords.filter((k) => k === 'typescript').length).toBe(1)
    })

    it('filters out very short tokens (< 2 chars)', () => {
      const keywords = service.extractKeywords('I do C# and Go programming')
      // "i" and "do" are stop words anyway; single-char tokens filtered
      expect(keywords).not.toContain('i')
      // "c#" has length 2, should be kept
      expect(keywords).toContain('c#')
    })

    it('preserves technology-relevant special characters like + # .', () => {
      const keywords = service.extractKeywords('C++ C# Node.js .NET')
      expect(keywords).toContain('c++')
      expect(keywords).toContain('c#')
      expect(keywords).toContain('node.js')
      // Note: leading dots are trimmed by the regex, so .NET becomes 'net'
      expect(keywords).toContain('net')
    })
  })

  // ---------- computeOverlapScore ----------

  describe('computeOverlapScore', () => {
    it('calculates correct percentage for partial overlap', () => {
      const result = service.computeOverlapScore(
        ['react', 'typescript', 'nodejs', 'python'],
        ['react', 'typescript', 'aws', 'docker'],
      )
      expect(result.score).toBe(50)
      expect(result.matched).toEqual(['react', 'typescript'])
      expect(result.missing).toEqual(['aws', 'docker'])
    })

    it('returns 0 for no overlap', () => {
      const result = service.computeOverlapScore(
        ['python', 'django'],
        ['react', 'angular'],
      )
      expect(result.score).toBe(0)
      expect(result.matched).toEqual([])
      expect(result.missing).toEqual(['react', 'angular'])
    })

    it('returns 100 for full overlap', () => {
      const result = service.computeOverlapScore(
        ['react', 'typescript', 'aws'],
        ['react', 'typescript', 'aws'],
      )
      expect(result.score).toBe(100)
      expect(result.matched).toEqual(['react', 'typescript', 'aws'])
      expect(result.missing).toEqual([])
    })

    it('returns 0 when JD keywords are empty', () => {
      const result = service.computeOverlapScore(['react', 'typescript'], [])
      expect(result.score).toBe(0)
      expect(result.matched).toEqual([])
      expect(result.missing).toEqual([])
    })

    it('handles empty resume keywords correctly', () => {
      const result = service.computeOverlapScore([], ['react', 'typescript'])
      expect(result.score).toBe(0)
      expect(result.matched).toEqual([])
      expect(result.missing).toEqual(['react', 'typescript'])
    })

    it('rounds the score correctly', () => {
      // 1 out of 3 = 33.33... => rounds to 33
      const result = service.computeOverlapScore(
        ['react'],
        ['react', 'angular', 'vue'],
      )
      expect(result.score).toBe(33)
    })

    it('handles superset resume keywords (extra skills)', () => {
      const result = service.computeOverlapScore(
        ['react', 'typescript', 'aws', 'docker', 'kubernetes'],
        ['react', 'typescript'],
      )
      expect(result.score).toBe(100)
      expect(result.matched).toEqual(['react', 'typescript'])
      expect(result.missing).toEqual([])
    })
  })

  // ---------- computeKeywordMatch ----------
  describe('computeKeywordMatch', () => {
    it('computes match score and upserts result', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase-admin')
      
      const mockResume = { name: 'Resume', description: 'React Dev', type: 'resume' }
      const mockProfile = { id: 'u1', skills: ['React'], bio: 'Bio' }
      const mockJob = { id: 'j1', title: 'React Job', description: 'React', skills_required: ['React'], requirements: [] }

      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingleProfile = vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      const mockSingleJob = vi.fn().mockResolvedValue({ data: mockJob, error: null })

      ;(supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === 'user_documents') {
          return { select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [mockResume] }) }) }) }) }) }
        }
        if (table === 'profiles') {
          return { select: () => ({ eq: () => ({ single: mockSingleProfile }) }) }
        }
        if (table === 'jobs') {
          return { select: () => ({ eq: () => ({ single: mockSingleJob }) }) }
        }
        if (table === 'job_match_results') {
          return { upsert: mockUpsert }
        }
      })

      const result = await service.computeKeywordMatch('u1', 'j1')
      expect(result.match_score).toBeGreaterThan(0)
      expect(mockUpsert).toHaveBeenCalled()
    })
  })

  // ---------- computeBulkMatches ----------
  describe('computeBulkMatches', () => {
    it('computes matches for all active jobs', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase-admin')
      const mockJobs = [{ id: 'j1' }, { id: 'j2' }]
      
      ;(supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === 'jobs') {
          return { select: () => ({ eq: () => ({ is: () => Promise.resolve({ data: mockJobs, error: null }) }) }) }
        }
      })

      vi.spyOn(service, 'computeKeywordMatch').mockResolvedValue({
        match_score: 80,
        matched_skills: ['a'],
        missing_skills: ['b'],
        analysis: {}
      })

      const result = await service.computeBulkMatches('u1')
      expect(result).toHaveLength(2)
      expect(result[0].match_score).toBe(80)
    })
  })

  // ---------- getCachedMatch ----------
  describe('getCachedMatch', () => {
    it('returns cached match if valid', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase-admin')
      const mockData = { match_score: 90, matched_skills: ['js'], missing_skills: [], analysis: {} }
      
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })
      ;(supabaseAdmin.from as any).mockReturnValue({
        select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit: () => ({ single: mockSingle }) }) }) }) }) }) })
      })

      const result = await service.getCachedMatch('u1', 'j1', 'keyword')
      expect(result?.match_score).toBe(90)
    })
  })
})
