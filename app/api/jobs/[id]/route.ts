import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const updateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  company: z.string().min(1, 'Company is required').optional(),
  company_logo: z.string().url().optional(),
  description: z.string().min(1, 'Description is required').optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  location: z.string().min(1, 'Location is required').optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  skills_required: z.array(z.string()).optional(),
  application_deadline: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
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
    const { id } = await params

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get related jobs from same company
    const { data: relatedJobs } = await supabase
      .from('jobs')
      .select('id, title, location, job_type, salary_min, salary_max, created_at')
      .eq('company', job.company)
      .eq('is_active', true)
      .neq('id', id)
      .limit(5)
      .order('created_at', { ascending: false })

    // Check if user has applied or saved this job (if authenticated)
    const user = await getUserFromRequest(request)
    let userJobStatus = null

    if (user) {
      const [applicationData, savedJobData] = await Promise.all([
        supabase
          .from('applications')
          .select('id, status')
          .eq('job_id', id)
          .eq('candidate_id', user.id)
          .single(),
        supabase
          .from('saved_jobs')
          .select('id')
          .eq('job_id', id)
          .eq('user_id', user.id)
          .single()
      ])

      userJobStatus = {
        hasApplied: !!applicationData.data,
        applicationStatus: applicationData.data?.status || null,
        isSaved: !!savedJobData.data,
      }
    }

    return NextResponse.json({
      job,
      relatedJobs: relatedJobs || [],
      userJobStatus,
    })

  } catch (error) {
    console.error('Get job error:', error)
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
    const validatedData = updateJobSchema.parse(body)

    // Check if user owns this job
    const { data: existingJob, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('posted_by')
      .eq('id', id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (existingJob.posted_by !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update jobs you posted' },
        { status: 403 }
      )
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Job update failed: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Job updated successfully',
      job: updatedJob,
    })

  } catch (error) {
    console.error('Update job error:', error)

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

    // Check if user owns this job
    const { data: existingJob, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('posted_by')
      .eq('id', id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (existingJob.posted_by !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete jobs you posted' },
        { status: 403 }
      )
    }

    // Soft delete job by setting is_active to false
    const { error: deleteError } = await supabaseAdmin
      .from('jobs')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (deleteError) {
      throw new Error(`Job deletion failed: ${deleteError.message}`)
    }

    return NextResponse.json({
      message: 'Job deleted successfully'
    })

  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}