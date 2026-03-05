import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/utils/response'

/**
 * GET /api/admin/onboarding
 *
 * List all onboarding records with associated profile information.
 * Admin auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    // Fetch all onboarding_data rows
    const { data: onboardingRows, error: onboardingError } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .order('updated_at', { ascending: false })

    if (onboardingError) {
      console.error('Error fetching onboarding data:', onboardingError)
      return errorResponse('Failed to fetch onboarding data')
    }

    if (!onboardingRows || onboardingRows.length === 0) {
      return successResponse([])
    }

    // Collect user IDs for a batch profile lookup
    const userIds = onboardingRows.map((r) => r.user_id)

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, lifecycle_stage, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return errorResponse('Failed to fetch profiles')
    }

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p]),
    )

    const merged = onboardingRows.map((row) => ({
      ...row,
      profile: profileMap.get(row.user_id) ?? null,
    }))

    return successResponse(merged)
  } catch (error) {
    console.error('GET /api/admin/onboarding error:', error)
    return errorResponse('Failed to fetch onboarding records')
  }
}
