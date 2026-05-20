import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  createdResponse,
  validationErrorResponse,
} from '@/lib/utils/response'
import type { Json } from '@/types/database'

const createProviderSchema = z.object({
  provider_type: z.enum(['saml', 'oidc', 'frappe_sso']),
  name: z.string().min(1, 'Name is required'),
  is_enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  email_domain_restriction: z.array(z.string()).optional(),
  auto_create_profile: z.boolean().optional(),
  default_role: z.string().optional(),
})

/**
 * GET /api/admin/sso-providers
 *
 * List all SSO providers. Admin auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const { data, error } = await supabaseAdmin
      .from('sso_providers')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching SSO providers:', error)
      return errorResponse('Failed to fetch SSO providers')
    }

    return successResponse(data || [])
  } catch (error) {
    console.error('GET /api/admin/sso-providers error:', error)
    return errorResponse('Failed to fetch SSO providers')
  }
}

/**
 * POST /api/admin/sso-providers
 *
 * Create a new SSO provider. Admin auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = createProviderSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const { data: provider, error } = await supabaseAdmin
      .from('sso_providers')
      .insert({
        provider_type: parsed.data.provider_type,
        name: parsed.data.name,
        is_enabled: parsed.data.is_enabled ?? false,
        config: (parsed.data.config ?? {}) as Json,
        email_domain_restriction: parsed.data.email_domain_restriction ?? [],
        auto_create_profile: parsed.data.auto_create_profile ?? true,
        default_role: parsed.data.default_role ?? 'candidate',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating SSO provider:', error)
      return errorResponse('Failed to create SSO provider')
    }

    return createdResponse(provider, 'SSO provider created successfully')
  } catch (error) {
    console.error('POST /api/admin/sso-providers error:', error)
    return errorResponse('Failed to create SSO provider')
  }
}
