import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { onboardingService } from '@/lib/services/onboarding'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/utils/response'

/**
 * GET /api/admin/onboarding/[userId]
 *
 * Retrieve a single user's onboarding data. Admin auth required.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const { data, error } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFoundResponse('Onboarding data')
      console.error('Error fetching onboarding data:', error)
      return errorResponse('Failed to fetch onboarding data')
    }

    // Also include the profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, lifecycle_stage, avatar_url')
      .eq('id', userId)
      .single()

    return successResponse({ ...data, profile: profile ?? null })
  } catch (error) {
    console.error('GET /api/admin/onboarding/[userId] error:', error)
    return errorResponse('Failed to fetch onboarding data')
  }
}

const updateStatusSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

/**
 * PUT /api/admin/onboarding/[userId]
 *
 * Approve or reject a submitted onboarding record. Admin auth required.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    if (parsed.data.action === 'approve') {
      await onboardingService.approveOnboarding(userId, user.id)
      return successResponse(null, 'Onboarding approved')
    }

    await onboardingService.rejectOnboarding(userId)
    return successResponse(null, 'Onboarding rejected')
  } catch (error) {
    console.error('PUT /api/admin/onboarding/[userId] error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update onboarding status',
    )
  }
}
