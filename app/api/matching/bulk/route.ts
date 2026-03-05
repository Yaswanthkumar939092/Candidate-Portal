import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { matchingService } from '@/lib/services/matching'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response'

/**
 * POST /api/matching/bulk
 *
 * Compute keyword-based match scores for the authenticated user against
 * all currently open jobs. Auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const results = await matchingService.computeBulkMatches(user.id)

    return successResponse(results, 'Bulk matches computed successfully')
  } catch (error) {
    console.error('Bulk match error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to compute bulk matches',
      500
    )
  }
}
