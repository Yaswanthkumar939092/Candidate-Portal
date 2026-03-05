import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { z } from 'zod'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/utils/response'

const syncRequestSchema = z.object({
  entity_type: z.enum(['jobs', 'applications', 'all']).default('all'),
  force: z.boolean().default(false),
  company_filter: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  batch_size: z.number().min(1).max(100).default(10),
})

const syncStatusSchema = z.object({
  sync_id: z.string().uuid().optional(),
})

interface SyncJob {
  id: string
  entity_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  total_items: number
  processed_items: number
  success_count: number
  error_count: number
  errors: any[]
  created_by: string
}

// In-memory sync job storage (in production, use Redis or database)
const activeSyncJobs = new Map<string, SyncJob>()

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return forbiddenResponse('Admin access required')
    }

    const body = await request.json()

    // Validate input
    const validatedData = syncRequestSchema.parse(body)

    // Check if there's already a running sync job
    const runningSyncJob = Array.from(activeSyncJobs.values()).find(
      job => job.status === 'running' && job.entity_type === validatedData.entity_type
    )

    if (runningSyncJob && !validatedData.force) {
      return errorResponse(
        `A sync job for ${validatedData.entity_type} is already running. Use force=true to override.`,
        409
      )
    }

    // Create sync job
    const syncJobId = crypto.randomUUID()
    const syncJob: SyncJob = {
      id: syncJobId,
      entity_type: validatedData.entity_type,
      status: 'pending',
      started_at: new Date().toISOString(),
      total_items: 0,
      processed_items: 0,
      success_count: 0,
      error_count: 0,
      errors: [],
      created_by: user.id,
    }

    activeSyncJobs.set(syncJobId, syncJob)

    // Start sync process asynchronously
    processSync(syncJobId, validatedData).catch(error => {
      console.error(`Sync job ${syncJobId} failed:`, error)
      const job = activeSyncJobs.get(syncJobId)
      if (job) {
        job.status = 'failed'
        job.completed_at = new Date().toISOString()
        job.errors.push({ message: error.message, timestamp: new Date().toISOString() })
      }
    })

    return successResponse({
      sync_job: {
        id: syncJobId,
        status: 'pending',
        entity_type: validatedData.entity_type,
        started_at: syncJob.started_at,
      }
    }, 'Sync job started successfully')

  } catch (error) {
    console.error('Start sync error:', error)

    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      )
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return forbiddenResponse('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const syncId = searchParams.get('sync_id')

    if (syncId) {
      // Get specific sync job status
      const syncJob = activeSyncJobs.get(syncId)

      if (!syncJob) {
        return errorResponse('Sync job not found', 404)
      }

      return successResponse({
        sync_job: {
          ...syncJob,
          progress_percentage: syncJob.total_items > 0
            ? Math.round((syncJob.processed_items / syncJob.total_items) * 100)
            : 0
        }
      })
    } else {
      // Get all sync jobs
      const allJobs = Array.from(activeSyncJobs.values()).map(job => ({
        ...job,
        progress_percentage: job.total_items > 0
          ? Math.round((job.processed_items / job.total_items) * 100)
          : 0
      }))

      return successResponse({
        sync_jobs: allJobs,
        summary: {
          total_jobs: allJobs.length,
          running_jobs: allJobs.filter(j => j.status === 'running').length,
          completed_jobs: allJobs.filter(j => j.status === 'completed').length,
          failed_jobs: allJobs.filter(j => j.status === 'failed').length,
        }
      })
    }

  } catch (error) {
    console.error('Get sync status error:', error)

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return forbiddenResponse('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const syncId = searchParams.get('sync_id')

    if (!syncId) {
      return errorResponse('Sync job ID is required', 400)
    }

    const syncJob = activeSyncJobs.get(syncId)

    if (!syncJob) {
      return errorResponse('Sync job not found', 404)
    }

    if (syncJob.status === 'running') {
      // Cancel running job
      syncJob.status = 'cancelled'
      syncJob.completed_at = new Date().toISOString()
      console.log(`Sync job ${syncId} cancelled by user ${user.id}`)
    } else {
      // Remove completed/failed job from memory
      activeSyncJobs.delete(syncId)
    }

    return successResponse(
      { sync_job_id: syncId },
      'Sync job cancelled/removed successfully'
    )

  } catch (error) {
    console.error('Cancel sync error:', error)

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

// Helper function to process sync jobs
async function processSync(syncJobId: string, options: z.infer<typeof syncRequestSchema>) {
  const job = activeSyncJobs.get(syncJobId)
  if (!job) return

  try {
    job.status = 'running'

    if (options.entity_type === 'jobs' || options.entity_type === 'all') {
      await syncJobs(job, options)
    }

    if (options.entity_type === 'applications' || options.entity_type === 'all') {
      await syncApplications(job, options)
    }

    job.status = 'completed'
    job.completed_at = new Date().toISOString()

  } catch (error) {
    job.status = 'failed'
    job.completed_at = new Date().toISOString()
    job.errors.push({
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

async function syncJobs(job: SyncJob, options: z.infer<typeof syncRequestSchema>) {
  // Mock Frappe API call - replace with actual Frappe integration
  console.log('Starting job sync...', options)

  // Simulate fetching jobs from Frappe
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Get existing jobs to compare
  let query = supabaseAdmin
    .from('jobs')
    .select('id, frappe_job_id, updated_at')

  if (options.company_filter) {
    query = query.ilike('company', `%${options.company_filter}%`)
  }

  const { data: existingJobs } = await query

  // Mock sync process
  const mockFrappeJobs: Array<{ id: string }> = [
    // This would be replaced with actual Frappe API data
  ]

  job.total_items += mockFrappeJobs.length

  for (const frappeJob of mockFrappeJobs) {
    if (job.status === 'cancelled') break

    try {
      // Process individual job sync
      // Implementation would go here
      job.processed_items++
      job.success_count++

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      job.error_count++
      job.errors.push({
        entity_id: frappeJob.id,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }
}

async function syncApplications(job: SyncJob, options: z.infer<typeof syncRequestSchema>) {
  // Mock application sync - replace with actual Frappe integration
  console.log('Starting application sync...', options)

  // Simulate fetching applications from Frappe
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Get existing applications
  let query = supabaseAdmin
    .from('applications')
    .select('id, frappe_application_id, updated_at')

  if (options.date_from) {
    query = query.gte('applied_at', options.date_from)
  }

  if (options.date_to) {
    query = query.lte('applied_at', options.date_to)
  }

  const { data: existingApplications } = await query

  // Mock sync process
  const mockFrappeApplications: Array<{ id: string }> = [
    // This would be replaced with actual Frappe API data
  ]

  job.total_items += mockFrappeApplications.length

  for (const frappeApp of mockFrappeApplications) {
    if (job.status === 'cancelled') break

    try {
      // Process individual application sync
      // Implementation would go here
      job.processed_items++
      job.success_count++

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      job.error_count++
      job.errors.push({
        entity_id: frappeApp.id,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Clean up old sync jobs periodically (in production, this would be a cron job)
setInterval(() => {
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

  for (const [id, job] of activeSyncJobs.entries()) {
    if (job.status !== 'running' && new Date(job.started_at) < cutoffTime) {
      activeSyncJobs.delete(id)
    }
  }
}, 60 * 60 * 1000) // Run every hour