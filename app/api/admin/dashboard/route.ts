import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    // Check if user is admin (simplified check)
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get dashboard statistics
    const [
      totalUsersData,
      totalJobsData,
      totalApplicationsData,
      activeJobsData,
      recentApplicationsData,
      applicationStatusData
    ] = await Promise.all([
      // Total users count
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Total jobs count
      supabaseAdmin
        .from('jobs')
        .select('id', { count: 'exact', head: true }),

      // Total applications count
      supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact', head: true }),

      // Active jobs count
      supabaseAdmin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Recent applications (last 30 days)
      supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .gte('applied_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Application status breakdown
      supabaseAdmin
        .from('applications')
        .select('status')
    ])

    // Calculate application status distribution
    const statusDistribution = applicationStatusData.data?.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent activity (last 10 applications with job details)
    const { data: recentActivity } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        applied_at,
        jobs (
          title,
          company
        ),
        profiles!applications_candidate_id_fkey (
          full_name,
          email
        )
      `)
      .order('applied_at', { ascending: false })
      .limit(10)

    const stats = {
      totalUsers: totalUsersData.count || 0,
      totalJobs: totalJobsData.count || 0,
      totalApplications: totalApplicationsData.count || 0,
      activeJobs: activeJobsData.count || 0,
      recentApplications: recentApplicationsData.count || 0,
      applicationStatusDistribution: statusDistribution,
    }

    const transformedActivity = recentActivity?.map(activity => ({
      id: activity.id,
      type: 'application_submitted',
      title: `Application for ${activity.jobs?.title} at ${activity.jobs?.company}`,
      candidate: activity.profiles?.full_name || activity.profiles?.email,
      status: activity.status,
      timestamp: activity.applied_at,
    })) || []

    return NextResponse.json({
      stats,
      recentActivity: transformedActivity,
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}