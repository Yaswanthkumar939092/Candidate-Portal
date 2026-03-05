import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { frappeEnvManager } from '@/lib/services/frappe-env'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/utils/response'

/**
 * POST /api/admin/frappe-environments/[id]/activate
 * Activate a Frappe environment (switch to it). Admin auth required.
 * Looks up the environment_key from the ID and delegates to frappeEnvManager.switchEnvironment().
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

    // Look up the environment to get its environment_key
    const { data: environment, error: fetchError } = await supabaseAdmin
      .from('frappe_environments')
      .select('id, environment_key, label')
      .eq('id', id)
      .single()

    if (fetchError || !environment) {
      return notFoundResponse('Frappe environment')
    }

    await frappeEnvManager.switchEnvironment(environment.environment_key)

    return successResponse(
      { id: environment.id, environment_key: environment.environment_key, label: environment.label },
      `Switched active environment to ${environment.label} (${environment.environment_key})`
    )
  } catch (error) {
    console.error('Frappe environment activate error:', error)
    const message = error instanceof Error ? error.message : 'Failed to activate Frappe environment'
    return errorResponse(message)
  }
}
