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
})
