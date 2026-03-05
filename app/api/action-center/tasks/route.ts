import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response'

/**
 * GET /api/action-center/tasks
 *
 * List all tasks assigned to the current authenticated user, ordered by
 * due_date ascending (soonest first).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { data: tasks, error } = await supabaseAdmin
      .from('action_center_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return successResponse(tasks ?? [])
  } catch (error) {
    console.error('Get tasks error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
