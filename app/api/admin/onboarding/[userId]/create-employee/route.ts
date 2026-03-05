import { NextRequest } from 'next/server'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { onboardingService } from '@/lib/services/onboarding'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/utils/response'

/**
 * POST /api/admin/onboarding/[userId]/create-employee
 *
 * Trigger Frappe Employee creation for an approved onboarding record.
 * Admin auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const result = await onboardingService.createFrappeEmployee(userId, user.id)

    return successResponse(result, 'Frappe Employee created successfully')
  } catch (error) {
    console.error('POST /api/admin/onboarding/[userId]/create-employee error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create Frappe Employee',
    )
  }
}
