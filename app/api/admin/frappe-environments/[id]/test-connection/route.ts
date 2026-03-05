import { NextRequest } from 'next/server'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { frappeEnvManager } from '@/lib/services/frappe-env'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/utils/response'

/**
 * POST /api/admin/frappe-environments/[id]/test-connection
 * Test the connection for a specific Frappe environment. Admin auth required.
 * Returns { success, response_time_ms, error }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const result = await frappeEnvManager.testConnection(id)

    return successResponse(result)
  } catch (error) {
    console.error('Frappe environment test-connection error:', error)
    const message = error instanceof Error ? error.message : 'Failed to test connection'
    return errorResponse(message)
  }
}
