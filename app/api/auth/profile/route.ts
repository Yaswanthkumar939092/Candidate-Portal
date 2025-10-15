import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  preferred_salary_min: z.number().optional(),
  preferred_salary_max: z.number().optional(),
  preferred_job_types: z.array(z.string()).optional(),
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

    // Get user profile with statistics
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get user statistics
    const [applicationsData, savedJobsData] = await Promise.all([
      supabaseAdmin
        .from('applications')
        .select('id, status')
        .eq('candidate_id', user.id),
      supabaseAdmin
        .from('saved_jobs')
        .select('id')
        .eq('user_id', user.id)
    ])

    const stats = {
      totalApplications: applicationsData.data?.length || 0,
      applicationsByStatus: applicationsData.data?.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      savedJobs: savedJobsData.data?.length || 0,
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile,
        stats,
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const validatedData = updateProfileSchema.parse(body)

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Profile update failed: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    })

  } catch (error) {
    console.error('Update profile error:', error)

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