import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/utils/response'

const visibilitySchema = z.object({
  visibility: z.enum(['internal', 'external', 'both']),
})

/**
 * PUT /api/admin/jobs/[id]/visibility
 *
 * Admin override for a job's visibility setting.
 * Sets `visibility` and marks `visibility_override = true`.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = visibilitySchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        visibility: parsed.data.visibility,
        visibility_override: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFoundResponse('Job')
      console.error('Error updating job visibility:', error)
      return errorResponse('Failed to update job visibility')
    }

    return successResponse(job, 'Job visibility updated successfully')
  } catch (error) {
    console.error('PUT /api/admin/jobs/[id]/visibility error:', error)
    return errorResponse('Failed to update job visibility')
  }
}
