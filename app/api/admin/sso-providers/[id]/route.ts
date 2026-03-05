import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/utils/response'
import type { Json, SSOProviderUpdate } from '@/types/database'

const updateProviderSchema = z.object({
  provider_type: z.enum(['saml', 'oidc', 'frappe_sso']).optional(),
  name: z.string().min(1).optional(),
  is_enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  email_domain_restriction: z.array(z.string()).optional(),
  auto_create_profile: z.boolean().optional(),
  default_role: z.string().optional(),
})

/**
 * GET /api/admin/sso-providers/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const { data, error } = await supabaseAdmin
      .from('sso_providers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFoundResponse('SSO provider')
      console.error('Error fetching SSO provider:', error)
      return errorResponse('Failed to fetch SSO provider')
    }

    return successResponse(data)
  } catch (error) {
    console.error('GET /api/admin/sso-providers/[id] error:', error)
    return errorResponse('Failed to fetch SSO provider')
  }
}

/**
 * PUT /api/admin/sso-providers/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = updateProviderSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const { config: rawConfig, ...rest } = parsed.data
    const updatePayload: SSOProviderUpdate = {
      ...rest,
      updated_at: new Date().toISOString(),
    }

    // Cast config to Json for Supabase compatibility
    if (rawConfig) {
      updatePayload.config = rawConfig as Json
    }

    const { data, error } = await supabaseAdmin
      .from('sso_providers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFoundResponse('SSO provider')
      console.error('Error updating SSO provider:', error)
      return errorResponse('Failed to update SSO provider')
    }

    return successResponse(data, 'SSO provider updated successfully')
  } catch (error) {
    console.error('PUT /api/admin/sso-providers/[id] error:', error)
    return errorResponse('Failed to update SSO provider')
  }
}

/**
 * DELETE /api/admin/sso-providers/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const { error } = await supabaseAdmin
      .from('sso_providers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting SSO provider:', error)
      return errorResponse('Failed to delete SSO provider')
    }

    return successResponse(null, 'SSO provider deleted successfully')
  } catch (error) {
    console.error('DELETE /api/admin/sso-providers/[id] error:', error)
    return errorResponse('Failed to delete SSO provider')
  }
}
