import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const applicationsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
  job_id: z.string().uuid().optional(),
  sort_by: z.enum(['applied_at', 'updated_at', 'status']).default('applied_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const createApplicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  cover_letter: z.string().optional(),
  resume_url: z.string().url().optional(),
  notes: z.string().optional(),
})

// Helper function to get user from token
async function getUserFromRequest(request: NextRequest) {
  const accessToken = request.cookies.get('supabase-access-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    return null
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedParams = applicationsQuerySchema.parse(queryParams)
    const { page, limit, status, job_id, sort_by, sort_order } = validatedParams

    const offset = (page - 1) * limit

    // Build query
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
        )
      `, { count: 'exact' })
      .eq('candidate_id', user.id)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (job_id) {
      query = query.eq('job_id', job_id)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    // Transform data to include job information
    const transformedApplications = applications?.map(app => ({
      ...app,
      job: app.jobs,
      jobs: undefined, // Remove the nested jobs object
    })) || []

    return NextResponse.json({
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    })

  } catch (error) {
    console.error('Get applications error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = createApplicationSchema.parse(body)

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, is_active, application_deadline')
      .eq('id', validatedData.job_id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!job.is_active) {
      return NextResponse.json(
        { error: 'Job is no longer active' },
        { status: 400 }
      )
    }

    // Check application deadline
    if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Application deadline has passed' },
        { status: 400 }
      )
    }

    // Check if user has already applied for this job
    const { data: existingApplication } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('candidate_id', user.id)
      .eq('job_id', validatedData.job_id)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 400 }
      )
    }

    // Create application
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        candidate_id: user.id,
        job_id: validatedData.job_id,
        cover_letter: validatedData.cover_letter,
        resume_url: validatedData.resume_url,
        notes: validatedData.notes,
        status: 'pending',
      })
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
        jobs (
          id,
          title,
          company,
          company_logo,
          location,
          job_type,
          salary_min,
          salary_max
        )
      `)
      .single()

    if (applicationError) {
      throw new Error(`Application creation failed: ${applicationError.message}`)
    }

    // Transform response
    const transformedApplication = {
      ...application,
      job: application.jobs,
      jobs: undefined,
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: transformedApplication,
    }, { status: 201 })

  } catch (error) {
    console.error('Create application error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}