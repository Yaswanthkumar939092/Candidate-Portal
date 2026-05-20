import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Common English stop words to filter out during keyword extraction.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'done', 'down', 'each',
  'even', 'every', 'few', 'for', 'from', 'get', 'got', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'just', 'know', 'let', 'like', 'make',
  'may', 'me', 'might', 'more', 'most', 'much', 'must', 'my', 'need', 'no',
  'nor', 'not', 'now', 'of', 'off', 'on', 'one', 'only', 'or', 'other',
  'our', 'out', 'over', 'own', 'per', 'please', 'put', 'quite', 'rather',
  'really', 'same', 'say', 'she', 'should', 'show', 'so', 'some', 'still',
  'such', 'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'up',
  'upon', 'us', 'use', 'very', 'want', 'was', 'we', 'well', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
  'within', 'without', 'would', 'yes', 'yet', 'you', 'your',
  // common job-description filler
  'experience', 'work', 'working', 'team', 'ability', 'strong', 'good',
  'excellent', 'looking', 'role', 'responsible', 'responsibilities',
  'requirements', 'required', 'preferred', 'including', 'years', 'year',
  'etc', 'using', 'used', 'also', 'new', 'skills', 'skill',
])

/**
 * Service that computes keyword-based match scores between a candidate's
 * resume / profile skills and a job description.
 */
export class MatchingService {
  /**
   * Extract meaningful keywords from a block of text.
   * Splits on non-alphanumeric boundaries, lowercases, removes stop words
   * and very short tokens, and deduplicates.
   */
  extractKeywords(text: string): string[] {
    if (!text) return []

    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\-]/g, ' ')
      .split(/\s+/)
      .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, '')) // trim leading/trailing dots/hyphens
      .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))

    return [...new Set(tokens)]
  }

  /**
   * Compute overlap between two keyword sets.
   *
   * Returns a normalised score (0-100), the list of matched keywords, and
   * keywords present in the JD but missing from the resume.
   */
  computeOverlapScore(
    resumeKeywords: string[],
    jdKeywords: string[]
  ): { score: number; matched: string[]; missing: string[] } {
    if (jdKeywords.length === 0) {
      return { score: 0, matched: [], missing: [] }
    }

    const resumeSet = new Set(resumeKeywords)
    const matched: string[] = []
    const missing: string[] = []

    for (const kw of jdKeywords) {
      if (resumeSet.has(kw)) {
        matched.push(kw)
      } else {
        missing.push(kw)
      }
    }

    const score = Math.round((matched.length / jdKeywords.length) * 100)
    return { score, matched, missing }
  }

  /**
   * Main keyword match function.
   *
   * Fetches the user's primary resume text (from user_documents) and the job
   * description, extracts keywords from both, computes overlap, and caches
   * the result in `job_match_results`.
   */
  async computeKeywordMatch(
    userId: string,
    jobId: string
  ): Promise<{
    match_score: number
    matched_skills: string[]
    missing_skills: string[]
    analysis: Record<string, unknown>
  }> {
    // 1. Fetch user resume / skills data
    const { data: documents } = await supabaseAdmin
      .from('user_documents')
      .select('name, description, type')
      .eq('user_id', userId)
      .eq('type', 'resume')
      .order('is_primary', { ascending: false })
      .limit(1)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('skills, bio')
      .eq('id', userId)
      .single()

    // Build the resume text from available sources
    const resumeParts: string[] = []
    if (documents?.[0]?.description) resumeParts.push(documents[0].description)
    if (documents?.[0]?.name) resumeParts.push(documents[0].name)
    if (profile?.skills) resumeParts.push(profile.skills.join(' '))
    if (profile?.bio) resumeParts.push(profile.bio)
    const resumeText = resumeParts.join(' ')

    // 2. Fetch job description + required skills
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('description, skills_required, requirements, title')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    const jdParts: string[] = [job.description]
    if (job.skills_required) jdParts.push(job.skills_required.join(' '))
    if (job.requirements) jdParts.push(job.requirements.join(' '))
    if (job.title) jdParts.push(job.title)
    const jdText = jdParts.join(' ')

    // 3. Extract keywords + compute overlap
    const resumeKeywords = this.extractKeywords(resumeText)
    const jdKeywords = this.extractKeywords(jdText)
    const { score, matched, missing } = this.computeOverlapScore(
      resumeKeywords,
      jdKeywords
    )

    const analysis = {
      resume_keyword_count: resumeKeywords.length,
      jd_keyword_count: jdKeywords.length,
      overlap_count: matched.length,
      computed_at: new Date().toISOString(),
    }

    // 4. Cache (upsert) result in job_match_results
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // expire in 7 days

    await supabaseAdmin.from('job_match_results').upsert(
      {
        user_id: userId,
        job_id: jobId,
        match_type: 'keyword' as const,
        match_score: score,
        matched_skills: matched,
        missing_skills: missing,
        analysis,
        computed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id,job_id,match_type' }
    )

    return {
      match_score: score,
      matched_skills: matched,
      missing_skills: missing,
      analysis,
    }
  }

  /**
   * Compute keyword match against all currently open (active) jobs.
   */
  async computeBulkMatches(
    userId: string
  ): Promise<
    Array<{
      job_id: string
      match_score: number
      matched_skills: string[]
      missing_skills: string[]
    }>
  > {
    // Get all active jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (error || !jobs) {
      throw new Error('Failed to fetch open jobs')
    }

    const results: Array<{
      job_id: string
      match_score: number
      matched_skills: string[]
      missing_skills: string[]
    }> = []

    for (const job of jobs) {
      try {
        const match = await this.computeKeywordMatch(userId, job.id)
        results.push({
          job_id: job.id,
          match_score: match.match_score,
          matched_skills: match.matched_skills,
          missing_skills: match.missing_skills,
        })
      } catch (err) {
        console.error(`Failed to compute match for job ${job.id}:`, err)
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.match_score - a.match_score)
    return results
  }

  /**
   * Retrieve a previously cached match result, if it has not expired.
   */
  async getCachedMatch(
    userId: string,
    jobId: string,
    matchType: 'keyword' | 'ai'
  ): Promise<{
    match_score: number
    matched_skills: string[]
    missing_skills: string[]
    analysis: Record<string, unknown>
  } | null> {
    const { data, error } = await supabaseAdmin
      .from('job_match_results')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .eq('match_type', matchType)
      .gte('expires_at', new Date().toISOString())
      .order('computed_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return {
      match_score: data.match_score,
      matched_skills: data.matched_skills,
      missing_skills: data.missing_skills,
      analysis: data.analysis as Record<string, unknown>,
    }
  }
}

export const matchingService = new MatchingService()
