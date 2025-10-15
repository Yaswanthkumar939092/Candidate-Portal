import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const jobsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  search: z.string().optional(),
  location: z.string().optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  skills: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  salary_min: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  salary_max: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  company: z.string().optional(),
  sort_by: z.enum(['created_at', 'title', 'company', 'salary_min']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  company_logo: z.string().url().optional(),
  description: z.string().min(1, 'Description is required'),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  location: z.string().min(1, 'Location is required'),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']),
  skills_required: z.array(z.string()).optional(),
  application_deadline: z.string().datetime().optional(),
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
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedParams = jobsQuerySchema.parse(queryParams)

    const { page, limit, search, location, job_type, experience_level, skills, salary_min, salary_max, company, sort_by, sort_order } = validatedParams

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (job_type) {
      query = query.eq('job_type', job_type)
    }

    if (experience_level) {
      query = query.eq('experience_level', experience_level)
    }

    if (company) {
      query = query.ilike('company', `%${company}%`)
    }

    if (skills && skills.length > 0) {
      query = query.overlaps('skills_required', skills)
    }

    if (salary_min) {
      query = query.gte('salary_min', salary_min)
    }

    if (salary_max) {
      query = query.lte('salary_max', salary_max)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`)
    }

    return NextResponse.json({
      jobs: jobs || [],
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
    console.error('Get jobs error:', error)

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
    const validatedData = createJobSchema.parse(body)

    // Create job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        ...validatedData,
        posted_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Job creation failed: ${jobError.message}`)
    }

    return NextResponse.json({
      message: 'Job created successfully',
      job,
    }, { status: 201 })

  } catch (error) {
    console.error('Create job error:', error)

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