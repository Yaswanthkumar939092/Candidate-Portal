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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: jobId } = params

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company')
      .eq('id', jobId)
      .eq('is_active', true)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job is already saved
    const { data: existingSave } = await supabaseAdmin
      .from('saved_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .single()

    if (existingSave) {
      return NextResponse.json({
        message: 'Job is already saved',
        saved: true,
      })
    }

    // Save the job
    const { error: saveError } = await supabaseAdmin
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_id: jobId,
      })

    if (saveError) {
      throw new Error(`Failed to save job: ${saveError.message}`)
    }

    return NextResponse.json({
      message: 'Job saved successfully',
      saved: true,
    })

  } catch (error) {
    console.error('Save job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: jobId } = params

    // Remove saved job
    const { error: deleteError } = await supabaseAdmin
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)

    if (deleteError) {
      throw new Error(`Failed to unsave job: ${deleteError.message}`)
    }

    return NextResponse.json({
      message: 'Job removed from saved list',
      saved: false,
    })

  } catch (error) {
    console.error('Unsave job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}