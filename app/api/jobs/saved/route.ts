import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const savedJobsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  sort_by: z.enum(['saved_at', 'title', 'company']).default('saved_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
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
    const validatedParams = savedJobsQuerySchema.parse(queryParams)
    const { page, limit, sort_by, sort_order } = validatedParams

    const offset = (page - 1) * limit

    // Get saved jobs with job details
    const { data: savedJobsData, error: savedJobsError, count } = await supabaseAdmin
      .from('saved_jobs')
      .select(`
        id,
        saved_at,
        jobs (
          id,
          title,
          company,
          company_logo,
          description,
          salary_min,
          salary_max,
          location,
          job_type,
          experience_level,
          is_active,
          created_at
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('jobs.is_active', true)
      .order(sort_by === 'saved_at' ? 'saved_at' : `jobs.${sort_by}`, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    if (savedJobsError) {
      throw new Error(`Failed to fetch saved jobs: ${savedJobsError.message}`)
    }

    // Transform the data to include job information at the top level
    const savedJobs = savedJobsData?.map(item => ({
      id: item.id,
      saved_at: item.saved_at,
      job: item.jobs,
    })) || []

    return NextResponse.json({
      savedJobs,
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
    console.error('Get saved jobs error:', error)

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