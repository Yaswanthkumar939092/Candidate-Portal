import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get application details with job information
    const { data: application, error: applicationError } = await supabaseAdmin
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
          description,
          requirements,
          benefits,
          salary_min,
          salary_max,
          location,
          job_type,
          experience_level,
          skills_required,
          is_active,
          posted_by
        )
      `)
      .eq('id', id)
      .eq('candidate_id', user.id)
      .single()

    if (applicationError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Transform response
    const transformedApplication = {
      ...application,
      job: application.jobs,
      jobs: undefined,
    }

    return NextResponse.json({
      application: transformedApplication,
    })

  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = updateApplicationSchema.parse(body)

    // Check if application exists and belongs to user
    const { data: existingApplication, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, candidate_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    if (existingApplication.candidate_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own applications' },
        { status: 403 }
      )
    }

    // Validate status transitions for candidates
    // Candidates can only withdraw their applications or update details
    if (validatedData.status && validatedData.status !== 'withdrawn') {
      if (validatedData.status !== existingApplication.status) {
        return NextResponse.json(
          { error: 'Candidates can only withdraw applications. Status changes are managed by employers.' },
          { status: 400 }
        )
      }
    }

    // Update application
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

    if (updateError) {
      throw new Error(`Application update failed: ${updateError.message}`)
    }

    // Transform response
    const transformedApplication = {
      ...updatedApplication,
      job: updatedApplication.jobs,
      jobs: undefined,
    }

    return NextResponse.json({
      message: 'Application updated successfully',
      application: transformedApplication,
    })

  } catch (error) {
    console.error('Update application error:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if application exists and belongs to user
    const { data: existingApplication, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, candidate_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    if (existingApplication.candidate_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own applications' },
        { status: 403 }
      )
    }

    // Only allow deletion of applications in certain statuses
    const deletableStatuses = ['pending', 'withdrawn']
    if (!deletableStatuses.includes(existingApplication.status)) {
      return NextResponse.json(
        { error: 'Applications can only be deleted if they are pending or withdrawn' },
        { status: 400 }
      )
    }

    // Delete application
    const { error: deleteError } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new Error(`Application deletion failed: ${deleteError.message}`)
    }

    return NextResponse.json({
      message: 'Application deleted successfully'
    })

  } catch (error) {
    console.error('Delete application error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}