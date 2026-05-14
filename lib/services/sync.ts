import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { FrappeEnvironmentManager, FrappeClient, frappeEnvManager } from '@/lib/services/frappe-env'

// Sync configuration schemas
const syncOptionsSchema = z.object({
  entityType: z.enum(['jobs', 'applications', 'companies', 'all']),
  batchSize: z.number().min(1).max(100).default(10),
  force: z.boolean().default(false),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
})

// Frappe entity schemas
const frappeJobSchema = z.object({
  name: z.string(),
  job_title: z.string(),
  company: z.string(),
  description: z.string(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  min_salary: z.number().optional(),
  max_salary: z.number().optional(),
  location: z.string(),
  employment_type: z.string(),
  experience_level: z.string(),
  skills_required: z.array(z.string()).optional(),
  application_deadline: z.string().datetime().optional(),
  status: z.string(),
  creation: z.string().datetime(),
  modified: z.string().datetime(),
})

const frappeApplicationSchema = z.object({
  name: z.string(),
  job_opening: z.string(),
  applicant_email: z.string().email(),
  applicant_name: z.string(),
  status: z.string(),
  cover_letter: z.string().optional(),
  resume_attachment: z.string().optional(),
  application_date: z.string().datetime(),
  notes: z.string().optional(),
  creation: z.string().datetime(),
  modified: z.string().datetime(),
})

const frappeCompanySchema = z.object({
  name: z.string(),
  company_name: z.string(),
  company_description: z.string().optional(),
  website: z.string().url().optional(),
  company_logo: z.string().url().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  creation: z.string().datetime(),
  modified: z.string().datetime(),
})

interface SyncResult {
  success: boolean
  created: number
  updated: number
  skipped: number
  errors: Array<{
    entity_id: string
    error: string
    timestamp: string
  }>
}

interface SyncProgress {
  total: number
  processed: number
  percentage: number
  current_entity?: string
}

class FrappeSyncService {
  private readonly supabase = supabaseAdmin
  private envManager: FrappeEnvironmentManager

  constructor(envManager?: FrappeEnvironmentManager) {
    this.envManager = envManager || frappeEnvManager
  }

  private async getClient(): Promise<FrappeClient> {
    return this.envManager.getClient()
  }

  private async frappeRequest(
    endpoint: string,
    _options: RequestInit = {}
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const client = await this.getClient()
      const data = await client.request(endpoint)
      return { success: true, data }
    } catch (error) {
      console.error('Frappe API request error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error'
      }
    }
  }

  /**
   * Sync jobs from Frappe
   */
  async syncJobs(options: z.infer<typeof syncOptionsSchema>): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    try {
      // Build filters
      const filters: Record<string, unknown> = {}
      if (options.dateFrom) {
        filters.modified = ['>=', options.dateFrom]
      }
      if (options.dateTo) {
        filters.creation = ['<=', options.dateTo]
      }
      if (options.filters) {
        Object.assign(filters, options.filters)
      }

      // Fetch jobs from Frappe
      const { success, data, error } = await this.frappeRequest(
        `/api/resource/Job Opening?filters=${JSON.stringify(filters)}&limit_page_length=${options.batchSize}&fields=["*"]`
      )

      if (!success || !data) {
        result.success = false
        result.errors.push({
          entity_id: 'all',
          error: error || 'Failed to fetch jobs from Frappe',
          timestamp: new Date().toISOString()
        })
        return result
      }

      const frappeJobs = (data as { data: Record<string, unknown>[] }).data || []

      // Process each job
      for (const frappeJob of frappeJobs) {
        try {
          const validatedJob = frappeJobSchema.parse(frappeJob)
          await this.processJob(validatedJob, result)
        } catch (error) {
          result.errors.push({
            entity_id: (frappeJob.name as string) || 'unknown',
            error: error instanceof Error ? error.message : 'Job processing failed',
            timestamp: new Date().toISOString()
          })
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push({
        entity_id: 'sync',
        error: error instanceof Error ? error.message : 'Job sync failed',
        timestamp: new Date().toISOString()
      })
    }

    return result
  }

  /**
   * Process individual job
   */
  private async processJob(frappeJob: z.infer<typeof frappeJobSchema>, result: SyncResult) {
    try {
      // Check if job already exists
      const { data: existingJob } = await this.supabase
        .from('jobs')
        .select('id, frappe_updated_at')
        .eq('frappe_job_id', frappeJob.name)
        .single()

      const jobData = {
        frappe_job_id: frappeJob.name,
        title: frappeJob.job_title,
        company: frappeJob.company,
        description: frappeJob.description,
        requirements: frappeJob.requirements || [],
        benefits: frappeJob.benefits || [],
        salary_min: frappeJob.min_salary,
        salary_max: frappeJob.max_salary,
        location: frappeJob.location,
        job_type: this.mapEmploymentType(frappeJob.employment_type) as 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship',
        experience_level: this.mapExperienceLevel(frappeJob.experience_level) as 'entry' | 'junior' | 'mid' | 'senior' | 'lead',
        skills_required: frappeJob.skills_required || [],
        application_deadline: frappeJob.application_deadline,
        is_active: frappeJob.status === 'Open',
        frappe_created_at: frappeJob.creation,
        frappe_updated_at: frappeJob.modified,
        synced_at: new Date().toISOString(),
        posted_by: 'system', // Synced jobs are attributed to system
      }

      if (existingJob) {
        // Check if update is needed
        const frappeModified = new Date(frappeJob.modified)
        const lastSynced = new Date(existingJob.frappe_updated_at || 0)

        if (frappeModified <= lastSynced) {
          result.skipped++
          return
        }

        // Update existing job
        const { error } = await this.supabase
          .from('jobs')
          .update({
            ...jobData,
            updated_at: new Date().toISOString(),
          })
          .eq('frappe_job_id', frappeJob.name)

        if (error) {
          throw new Error(`Update failed: ${error.message}`)
        }

        result.updated++
      } else {
        // Create new job
        const { error } = await this.supabase
          .from('jobs')
          .insert(jobData)

        if (error) {
          throw new Error(`Insert failed: ${error.message}`)
        }

        result.created++
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Sync applications from Frappe
   */
  async syncApplications(options: z.infer<typeof syncOptionsSchema>): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    try {
      // Build filters
      const filters: Record<string, unknown> = {}
      if (options.dateFrom) {
        filters.modified = ['>=', options.dateFrom]
      }
      if (options.dateTo) {
        filters.creation = ['<=', options.dateTo]
      }
      if (options.filters) {
        Object.assign(filters, options.filters)
      }

      // Fetch applications from Frappe
      const { success, data, error } = await this.frappeRequest(
        `/api/resource/Job Applicant?filters=${JSON.stringify(filters)}&limit_page_length=${options.batchSize}&fields=["*"]`
      )

      if (!success || !data) {
        result.success = false
        result.errors.push({
          entity_id: 'all',
          error: error || 'Failed to fetch applications from Frappe',
          timestamp: new Date().toISOString()
        })
        return result
      }

      const frappeApplications = (data as { data: Record<string, unknown>[] }).data || []

      // Process each application
      for (const frappeApp of frappeApplications) {
        try {
          const validatedApp = frappeApplicationSchema.parse(frappeApp)
          await this.processApplication(validatedApp, result)
        } catch (error) {
          result.errors.push({
            entity_id: (frappeApp.name as string) || 'unknown',
            error: error instanceof Error ? error.message : 'Application processing failed',
            timestamp: new Date().toISOString()
          })
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push({
        entity_id: 'sync',
        error: error instanceof Error ? error.message : 'Application sync failed',
        timestamp: new Date().toISOString()
      })
    }

    return result
  }

  /**
   * Process individual application
   */
  private async processApplication(frappeApp: z.infer<typeof frappeApplicationSchema>, result: SyncResult) {
    try {
      // Find corresponding candidate and job
      const { data: candidate } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', frappeApp.applicant_email)
        .single()

      if (!candidate) {
        throw new Error(`Candidate not found: ${frappeApp.applicant_email}`)
      }

      const { data: job } = await this.supabase
        .from('jobs')
        .select('id')
        .eq('frappe_job_id', frappeApp.job_opening)
        .single()

      if (!job) {
        throw new Error(`Job not found: ${frappeApp.job_opening}`)
      }

      // Check if application already exists
      const { data: existingApp } = await this.supabase
        .from('applications')
        .select('id, frappe_updated_at')
        .eq('frappe_application_id', frappeApp.name)
        .single()

      const applicationData = {
        frappe_application_id: frappeApp.name,
        job_id: job.id,
        candidate_id: candidate.id,
        status: this.mapApplicationStatus(frappeApp.status) as 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn',
        cover_letter: frappeApp.cover_letter,
        resume_url: frappeApp.resume_attachment,
        notes: frappeApp.notes,
        frappe_applied_at: frappeApp.application_date,
        frappe_updated_at: frappeApp.modified,
        synced_at: new Date().toISOString(),
      }

      if (existingApp) {
        // Check if update is needed
        const frappeModified = new Date(frappeApp.modified)
        const lastSynced = new Date(existingApp.frappe_updated_at || 0)

        if (frappeModified <= lastSynced) {
          result.skipped++
          return
        }

        // Update existing application
        const { error } = await this.supabase
          .from('applications')
          .update({
            ...applicationData,
            updated_at: new Date().toISOString(),
          })
          .eq('frappe_application_id', frappeApp.name)

        if (error) {
          throw new Error(`Update failed: ${error.message}`)
        }

        result.updated++
      } else {
        // Create new application
        const { error } = await this.supabase
          .from('applications')
          .insert({
            ...applicationData,
            applied_at: frappeApp.application_date,
          })

        if (error) {
          throw new Error(`Insert failed: ${error.message}`)
        }

        result.created++
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Sync companies from Frappe
   */
  async syncCompanies(options: z.infer<typeof syncOptionsSchema>): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    try {
      // Build filters
      const filters: Record<string, unknown> = {}
      if (options.dateFrom) {
        filters.modified = ['>=', options.dateFrom]
      }
      if (options.dateTo) {
        filters.creation = ['<=', options.dateTo]
      }

      // Fetch companies from Frappe
      const { success, data, error } = await this.frappeRequest(
        `/api/resource/Company?filters=${JSON.stringify(filters)}&limit_page_length=${options.batchSize}&fields=["*"]`
      )

      if (!success || !data) {
        result.success = false
        result.errors.push({
          entity_id: 'all',
          error: error || 'Failed to fetch companies from Frappe',
          timestamp: new Date().toISOString()
        })
        return result
      }

      const frappeCompanies = (data as { data: Record<string, unknown>[] }).data || []

      // Process each company
      for (const frappeCompany of frappeCompanies) {
        try {
          const validatedCompany = frappeCompanySchema.parse(frappeCompany)
          await this.processCompany(validatedCompany, result)
        } catch (error) {
          result.errors.push({
            entity_id: (frappeCompany.name as string) || 'unknown',
            error: error instanceof Error ? error.message : 'Company processing failed',
            timestamp: new Date().toISOString()
          })
        }
      }

    } catch (error) {
      result.success = false
      result.errors.push({
        entity_id: 'sync',
        error: error instanceof Error ? error.message : 'Company sync failed',
        timestamp: new Date().toISOString()
      })
    }

    return result
  }

  /**
   * Process individual company
   */
  private async processCompany(frappeCompany: z.infer<typeof frappeCompanySchema>, result: SyncResult) {
    try {
      // Check if company already exists
      const { data: existingCompany } = await this.supabase
        .from('companies')
        .select('id, frappe_updated_at')
        .eq('frappe_company_id', frappeCompany.name)
        .single()

      const companyData = {
        frappe_company_id: frappeCompany.name,
        name: frappeCompany.company_name,
        description: frappeCompany.company_description,
        website: frappeCompany.website,
        logo_url: frappeCompany.company_logo,
        location: frappeCompany.address,
        industry: frappeCompany.industry,
        frappe_created_at: frappeCompany.creation,
        frappe_updated_at: frappeCompany.modified,
        synced_at: new Date().toISOString(),
      }

      if (existingCompany) {
        // Check if update is needed
        const frappeModified = new Date(frappeCompany.modified)
        const lastSynced = new Date(existingCompany.frappe_updated_at || 0)

        if (frappeModified <= lastSynced) {
          result.skipped++
          return
        }

        // Update existing company
        const { error } = await this.supabase
          .from('companies')
          .update({
            ...companyData,
            updated_at: new Date().toISOString(),
          })
          .eq('frappe_company_id', frappeCompany.name)

        if (error) {
          throw new Error(`Update failed: ${error.message}`)
        }

        result.updated++
      } else {
        // Create new company
        const { error } = await this.supabase
          .from('companies')
          .insert(companyData)

        if (error) {
          throw new Error(`Insert failed: ${error.message}`)
        }

        result.created++
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Full sync of all entities
   */
  async syncAll(options: Omit<z.infer<typeof syncOptionsSchema>, 'entityType'>): Promise<{
    jobs: SyncResult
    applications: SyncResult
    companies: SyncResult
    summary: {
      total_created: number
      total_updated: number
      total_skipped: number
      total_errors: number
    }
  }> {
    const jobsResult = await this.syncJobs({ ...options, entityType: 'jobs' })
    const applicationsResult = await this.syncApplications({ ...options, entityType: 'applications' })
    const companiesResult = await this.syncCompanies({ ...options, entityType: 'companies' })

    const summary = {
      total_created: jobsResult.created + applicationsResult.created + companiesResult.created,
      total_updated: jobsResult.updated + applicationsResult.updated + companiesResult.updated,
      total_skipped: jobsResult.skipped + applicationsResult.skipped + companiesResult.skipped,
      total_errors: jobsResult.errors.length + applicationsResult.errors.length + companiesResult.errors.length,
    }

    return {
      jobs: jobsResult,
      applications: applicationsResult,
      companies: companiesResult,
      summary
    }
  }

  /**
   * Test Frappe connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = await this.getClient()
      const success = await client.ping()
      return { success, error: success ? undefined : 'Ping failed' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  // Helper methods for mapping Frappe values to local values
  private mapEmploymentType(frappeType: string): string {
    const mapping: Record<string, string> = {
      'Full-time': 'full-time',
      'Part-time': 'part-time',
      'Contract': 'contract',
      'Freelance': 'freelance',
      'Internship': 'internship',
    }
    return mapping[frappeType] || 'full-time'
  }

  private mapExperienceLevel(frappeLevel: string): string {
    const mapping: Record<string, string> = {
      'Entry Level': 'entry',
      'Junior': 'junior',
      'Mid Level': 'mid',
      'Senior': 'senior',
      'Lead': 'lead',
    }
    return mapping[frappeLevel] || 'mid'
  }

  private mapApplicationStatus(frappeStatus: string): string {
    const mapping: Record<string, string> = {
      'Open': 'pending',
      'Replied': 'reviewing',
      'Accepted': 'offered',
      'Rejected': 'rejected',
      'Hold': 'reviewing',
    }
    return mapping[frappeStatus] || 'pending'
  }
}

// Export singleton instance (uses default frappeEnvManager)
export const frappeSyncService = new FrappeSyncService()

// Export class for testing with custom envManager
export { FrappeSyncService }

// Export types
export type { SyncResult, SyncProgress }
export { syncOptionsSchema }