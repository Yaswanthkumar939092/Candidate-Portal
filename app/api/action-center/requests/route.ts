import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  successResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response'

const createRequestSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  request_type: z.enum(['general', 'document', 'leave', 'other']),
  description: z.string().max(2000).optional(),
})

/**
 * GET /api/action-center/requests
 *
 * List all requests submitted by the current authenticated user, ordered by
 * created_at descending (most recent first).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { data: requests, error } = await supabaseAdmin
      .from('action_center_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch requests: ${error.message}`)
    }

    return successResponse(requests ?? [])
  } catch (error) {
    console.error('Get requests error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * POST /api/action-center/requests
 *
 * Create a new request. Validated with Zod. Auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validated = createRequestSchema.parse(body)

    const { data: newRequest, error } = await supabaseAdmin
      .from('action_center_requests')
      .insert({
        user_id: user.id,
        subject: validated.subject,
        request_type: validated.request_type,
        description: validated.description ?? null,
        status: 'open',
        attachments: [],
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create request: ${error.message}`)
    }

    return createdResponse(newRequest, 'Request submitted successfully')
  } catch (error) {
    console.error('Create request error:', error)

    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400)
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
