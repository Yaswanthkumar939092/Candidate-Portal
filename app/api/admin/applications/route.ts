import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { z } from 'zod'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/utils/response'

const adminApplicationsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 20),
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
  job_id: z.string().uuid().optional(),
  candidate_search: z.string().optional(), // Search by candidate name or email
  company: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(['applied_at', 'updated_at', 'status', 'candidate_name', 'job_title']).default('applied_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const batchUpdateSchema = z.object({
  application_ids: z.array(z.string().uuid()).min(1, 'At least one application ID is required'),
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']),
  notes: z.string().max(1000, 'Notes too long').optional(),
  rejection_reason: z.string().max(500, 'Rejection reason too long').optional(),
})

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
    const queryParams = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedParams = adminApplicationsQuerySchema.parse(queryParams)
    const {
      page,
      limit,
      status,
      job_id,
      candidate_search,
      company,
      date_from,
      date_to,
      sort_by,
      sort_order
    } = validatedParams

    const offset = (page - 1) * limit

    // Build query with joins
    let query = supabaseAdmin
      .from('applications')
      .select(`
        id,
        job_id,
        candidate_id,
        status,
        cover_letter,
        resume_url,
        applied_at,
        updated_at,
        notes,
        rejection_reason,
        jobs (
          id,
          title,
          company,
          company_logo,
          location,
          job_type,
          salary_min,
          salary_max,
          is_active
        ),
        profiles:candidate_id (
          id,
          full_name,
          email,
          phone,
          location,
          experience_level
        )
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (job_id) {
      query = query.eq('job_id', job_id)
    }

    if (date_from) {
      query = query.gte('applied_at', date_from)
    }

    if (date_to) {
      query = query.lte('applied_at', date_to)
    }

    // Apply company filter through jobs relation
    if (company) {
      query = query.ilike('jobs.company', `%${company}%`)
    }

    // Apply pagination first
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    let filteredApplications = applications || []

    // Apply candidate search filter (post-query due to profile join complexity)
    if (candidate_search) {
      const searchTerm = candidate_search.toLowerCase()
      filteredApplications = filteredApplications.filter(app => {
        const profile = app.profiles
        if (!profile) return false

        const fullName = profile.full_name?.toLowerCase() || ''
        const email = profile.email?.toLowerCase() || ''

        return fullName.includes(searchTerm) || email.includes(searchTerm)
      })
    }

    // Apply sorting
    filteredApplications.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sort_by) {
        case 'applied_at':
          aValue = new Date(a.applied_at).getTime()
          bValue = new Date(b.applied_at).getTime()
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'candidate_name':
          aValue = a.profiles?.full_name || ''
          bValue = b.profiles?.full_name || ''
          break
        case 'job_title':
          aValue = a.jobs?.title || ''
          bValue = b.jobs?.title || ''
          break
        default:
          aValue = new Date(a.applied_at).getTime()
          bValue = new Date(b.applied_at).getTime()
      }

      if (sort_order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
    })

    // Transform data
    const transformedApplications = filteredApplications.map(app => ({
      ...app,
      job: app.jobs,
      candidate: app.profiles,
      jobs: undefined,
      profiles: undefined,
    }))

    // Get summary statistics
    const { data: stats } = await supabaseAdmin
      .from('applications')
      .select('status')

    const statusCounts = stats?.reduce((acc: Record<string, number>, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {}) || {}

    return successResponse({
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
      statistics: {
        total_applications: stats?.length || 0,
        status_breakdown: statusCounts,
        active_applications: (statusCounts.pending || 0) + (statusCounts.reviewing || 0) + (statusCounts.interviewing || 0)
      }
    })

  } catch (error) {
    console.error('Get admin applications error:', error)

    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.issues.map(err => ({
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

export async function PATCH(request: NextRequest) {
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
    const validatedData = batchUpdateSchema.parse(body)

    const results = []
    const errors = []

    // Process each application
    for (const applicationId of validatedData.application_ids) {
      try {
        // Get current application
        const { data: application, error: fetchError } = await supabaseAdmin
          .from('applications')
          .select('id, status, candidate_id, jobs(title, company)')
          .eq('id', applicationId)
          .single()

        if (fetchError || !application) {
          errors.push({
            application_id: applicationId,
            error: 'Application not found'
          })
          continue
        }

        // Check status transition validity
        const validTransitions: Record<string, string[]> = {
          pending: ['reviewing', 'rejected', 'withdrawn'],
          reviewing: ['interviewing', 'offered', 'rejected', 'withdrawn'],
          interviewing: ['offered', 'rejected', 'withdrawn'],
          offered: ['withdrawn'],
          rejected: [],
          withdrawn: [],
        }

        const currentStatus = application.status
        const newStatus = validatedData.status

        if (currentStatus === newStatus) {
          errors.push({
            application_id: applicationId,
            error: `Application is already in ${newStatus} status`
          })
          continue
        }

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          errors.push({
            application_id: applicationId,
            error: `Cannot transition from ${currentStatus} to ${newStatus}`
          })
          continue
        }

        // Update application
        const updateData: any = {
          status: validatedData.status,
          updated_at: new Date().toISOString(),
        }

        if (validatedData.notes) {
          updateData.notes = validatedData.notes
        }

        if (validatedData.status === 'rejected' && validatedData.rejection_reason) {
          updateData.rejection_reason = validatedData.rejection_reason
        }

        const { error: updateError } = await supabaseAdmin
          .from('applications')
          .update(updateData)
          .eq('id', applicationId)

        if (updateError) {
          errors.push({
            application_id: applicationId,
            error: updateError.message
          })
          continue
        }

        results.push({
          application_id: applicationId,
          old_status: currentStatus,
          new_status: newStatus,
          success: true
        })

        // Log the change
        console.log(`Admin ${user.id} updated application ${applicationId} from ${currentStatus} to ${newStatus}`)

      } catch (err) {
        errors.push({
          application_id: applicationId,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return successResponse({
      results,
      errors,
      summary: {
        total: validatedData.application_ids.length,
        successful: results.length,
        failed: errors.length
      }
    }, `Batch update completed: ${results.length} successful, ${errors.length} failed`)

  } catch (error) {
    console.error('Batch update applications error:', error)

    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.issues.map(err => ({
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