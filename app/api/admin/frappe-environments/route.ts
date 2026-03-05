import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, isAdmin } from '@/lib/middleware/auth'
import { frappeEnvManager } from '@/lib/services/frappe-env'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  createdResponse,
  validationErrorResponse,
} from '@/lib/utils/response'

// Zod schema for creating a new Frappe environment
const createEnvironmentSchema = z.object({
  environment_key: z.enum(['LOCAL', 'DEV', 'UAT', 'PROD']),
  label: z.string().min(1, 'Label is required'),
  frappe_url: z.string().url('Must be a valid URL'),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  webhook_secret: z.string().optional(),
  auto_sync_enabled: z.boolean().optional(),
  sync_interval_hours: z.number().min(1).optional(),
})

/**
 * GET /api/admin/frappe-environments
 * List all Frappe environments. Admin auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const environments = await frappeEnvManager.listEnvironments()

    return successResponse(environments)
  } catch (error) {
    console.error('Frappe environments GET error:', error)
    return errorResponse('Failed to fetch Frappe environments')
  }
}

/**
 * POST /api/admin/frappe-environments
 * Create a new Frappe environment. Admin auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = createEnvironmentSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const { data } = parsed

    const { data: environment, error } = await supabaseAdmin
      .from('frappe_environments')
      .insert({
        environment_key: data.environment_key,
        label: data.label,
        frappe_url: data.frappe_url,
        api_key: data.api_key ?? null,
        api_secret: data.api_secret ?? null,
        username: data.username ?? null,
        password: data.password ?? null,
        webhook_secret: data.webhook_secret ?? null,
        auto_sync_enabled: data.auto_sync_enabled ?? false,
        sync_interval_hours: data.sync_interval_hours ?? 6,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating Frappe environment:', error)
      return errorResponse('Failed to create Frappe environment')
    }

    return createdResponse(environment, 'Frappe environment created successfully')
  } catch (error) {
    console.error('Frappe environments POST error:', error)
    return errorResponse('Failed to create Frappe environment')
  }
}
