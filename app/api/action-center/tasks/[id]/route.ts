import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/utils/response'

const updateTaskSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'overdue'])
    .optional(),
})

/**
 * PUT /api/action-center/tasks/[id]
 *
 * Update a task's status. Only the owner of the task may update it.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    // Check ownership
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('action_center_tasks')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !task) {
      return notFoundResponse('Task')
    }

    if (task.user_id !== user.id) {
      return forbiddenResponse('You can only update your own tasks')
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString(),
    }

    if (validated.status === 'completed') {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('action_center_tasks')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update task: ${updateError.message}`)
    }

    return successResponse(updated, 'Task updated successfully')
  } catch (error) {
    console.error('Update task error:', error)

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400)
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
