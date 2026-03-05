import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { matchingService } from '@/lib/services/matching'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response'

/**
 * POST /api/jobs/[id]/match
 *
 * Compute a keyword-based match score between the authenticated user's
 * resume/profile and the specified job. Auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const result = await matchingService.computeKeywordMatch(user.id, id)

    return successResponse(result, 'Match computed successfully')
  } catch (error) {
    console.error('Match computation error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to compute match',
      500
    )
  }
}
