import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/utils/response'

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']),
  notes: z.string().max(1000, 'Notes too long').optional(),
  rejection_reason: z.string().max(500, 'Rejection reason too long').optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    const applicationId = params.id

    if (!applicationId) {
      return errorResponse('Application ID is required', 400)
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(applicationId)) {
      return errorResponse('Invalid application ID format', 400)
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateStatusSchema.parse(body)

    // Get the application with user and job details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        candidate_id,
        job_id,
        status,
        notes,
        jobs (
          id,
          title,
          company
        ),
        profiles:candidate_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return notFoundResponse('Application')
    }

    // Check permissions
    const userIsAdmin = await isAdmin(user.id)
    const isOwner = application.candidate_id === user.id

    // Only admin or the candidate can update status, but candidates can only withdraw
    if (!userIsAdmin && !isOwner) {
      return forbiddenResponse('You do not have permission to update this application')
    }

    // Candidates can only withdraw their own applications
    if (!userIsAdmin && isOwner && validatedData.status !== 'withdrawn') {
      return forbiddenResponse('Candidates can only withdraw their applications')
    }

    // Check if the status transition is valid
    const validTransitions: Record<string, string[]> = {
      pending: ['reviewing', 'rejected', 'withdrawn'],
      reviewing: ['interviewing', 'offered', 'rejected', 'withdrawn'],
      interviewing: ['offered', 'rejected', 'withdrawn'],
      offered: ['withdrawn'],
      rejected: [], // Final state
      withdrawn: [], // Final state
    }

    const currentStatus = application.status
    const newStatus = validatedData.status

    if (currentStatus === newStatus) {
      return errorResponse('Application is already in this status', 400)
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return errorResponse(`Cannot transition from ${currentStatus} to ${newStatus}`, 400)
    }

    // Update the application
    const updateData: {
      status: string;
      updated_at: string;
      notes?: string;
      rejection_reason?: string;
    } = {
      status: validatedData.status,
      updated_at: new Date().toISOString(),
    }

    // Add notes if provided
    if (validatedData.notes) {
      updateData.notes = validatedData.notes
    }

    // Add rejection reason if status is rejected
    if (validatedData.status === 'rejected' && validatedData.rejection_reason) {
      updateData.rejection_reason = validatedData.rejection_reason
    }

    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
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
          salary_max
        )
      `)
      .single()

    if (updateError) {
      throw new Error(`Failed to update application: ${updateError.message}`)
    }

    // Transform response
    const transformedApplication = {
      ...updatedApplication,
      job: updatedApplication.jobs,
      jobs: undefined,
    }

    // Log the status change for audit purposes
    console.log(`Application ${applicationId} status changed from ${currentStatus} to ${newStatus} by user ${user.id}`)

    // TODO: Send notification email to candidate about status change
    // This would be implemented in the email service

    return successResponse(
      transformedApplication,
      `Application status updated to ${validatedData.status}`
    )

  } catch (error) {
    console.error('Update application status error:', error)

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    const applicationId = params.id

    if (!applicationId) {
      return errorResponse('Application ID is required', 400)
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(applicationId)) {
      return errorResponse('Invalid application ID format', 400)
    }

    // Get the application with status history
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        candidate_id,
        status,
        applied_at,
        updated_at,
        notes,
        rejection_reason,
        jobs (
          id,
          title,
          company
        )
      `)
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return notFoundResponse('Application')
    }

    // Check permissions
    const userIsAdmin = await isAdmin(user.id)
    const isOwner = application.candidate_id === user.id

    if (!userIsAdmin && !isOwner) {
      return forbiddenResponse('You do not have permission to view this application')
    }

    // Create status history (simplified - in real app, you'd have a status_history table)
    const statusHistory = [
      {
        status: 'pending',
        timestamp: application.applied_at,
        note: 'Application submitted'
      }
    ]

    if (application.status !== 'pending') {
      statusHistory.push({
        status: application.status,
        timestamp: application.updated_at,
        note: application.status === 'rejected' && application.rejection_reason
          ? application.rejection_reason
          : application.notes || `Status changed to ${application.status}`
      })
    }

    const statusData = {
      application_id: application.id,
      current_status: application.status,
      status_history: statusHistory,
      job: application.jobs,
      last_updated: application.updated_at
    }

    return successResponse(statusData)

  } catch (error) {
    console.error('Get application status error:', error)

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}