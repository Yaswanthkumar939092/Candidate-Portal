import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/utils/response'

/**
 * GET /api/action-center/requests/[id]
 *
 * Get a single request by ID. Auth required; only the request owner may view it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const { data: req, error } = await supabaseAdmin
      .from('action_center_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !req) {
      return notFoundResponse('Request')
    }

    if (req.user_id !== user.id) {
      return forbiddenResponse('You can only view your own requests')
    }

    return successResponse(req)
  } catch (error) {
    console.error('Get request error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
