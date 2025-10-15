import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const usersQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 20),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'email', 'full_name', 'updated_at']).default('created_at'),
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

// Helper function to check if user is admin
async function isAdmin(userId: string) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    // For now, we'll check if user exists in profiles table
    // In a real implementation, you'd have a role field or separate admin table
    return !!profile
  } catch {
    return false
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

    // Check if user is admin
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedParams = usersQuerySchema.parse(queryParams)
    const { page, limit, search, sort_by, sort_order } = validatedParams

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        location,
        bio,
        experience_level,
        created_at,
        updated_at
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    // Get user statistics for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (userProfile) => {
        const [applicationsData, savedJobsData] = await Promise.all([
          supabaseAdmin
            .from('applications')
            .select('id, status')
            .eq('candidate_id', userProfile.id),
          supabaseAdmin
            .from('saved_jobs')
            .select('id')
            .eq('user_id', userProfile.id)
        ])

        return {
          ...userProfile,
          stats: {
            totalApplications: applicationsData.data?.length || 0,
            savedJobs: savedJobsData.data?.length || 0,
            applicationsByStatus: applicationsData.data?.reduce((acc, app) => {
              acc[app.status] = (acc[app.status] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {},
          }
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
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
    console.error('Admin get users error:', error)

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