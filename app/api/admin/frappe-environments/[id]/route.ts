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
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/utils/response'

// Zod schema for updating a Frappe environment (all fields optional)
const updateEnvironmentSchema = z.object({
  environment_key: z.enum(['LOCAL', 'DEV', 'UAT', 'PROD']).optional(),
  label: z.string().min(1, 'Label cannot be empty').optional(),
  frappe_url: z.string().url('Must be a valid URL').optional(),
  api_key: z.string().nullable().optional(),
  api_secret: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  webhook_secret: z.string().nullable().optional(),
  auto_sync_enabled: z.boolean().optional(),
  sync_interval_hours: z.number().min(1).optional(),
})

/**
 * GET /api/admin/frappe-environments/[id]
 * Get a single Frappe environment by ID. Admin auth required.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const { data: environment, error } = await supabaseAdmin
      .from('frappe_environments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Frappe environment')
      }
      console.error('Error fetching Frappe environment:', error)
      return errorResponse('Failed to fetch Frappe environment')
    }

    return successResponse(environment)
  } catch (error) {
    console.error('Frappe environment GET error:', error)
    return errorResponse('Failed to fetch Frappe environment')
  }
}

/**
 * PUT /api/admin/frappe-environments/[id]
 * Update a Frappe environment. Admin auth required.
 * Invalidates the environment manager cache after update.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = updateEnvironmentSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const updateData = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    const { data: environment, error } = await supabaseAdmin
      .from('frappe_environments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Frappe environment')
      }
      console.error('Error updating Frappe environment:', error)
      return errorResponse('Failed to update Frappe environment')
    }

    // Invalidate cached config so the next request picks up changes
    frappeEnvManager.invalidateCache()

    return successResponse(environment, 'Frappe environment updated successfully')
  } catch (error) {
    console.error('Frappe environment PUT error:', error)
    return errorResponse('Failed to update Frappe environment')
  }
}

/**
 * DELETE /api/admin/frappe-environments/[id]
 * Delete a Frappe environment. Admin auth required.
 * Cannot delete an active environment.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    // Check if the environment exists and whether it is active
    const { data: environment, error: fetchError } = await supabaseAdmin
      .from('frappe_environments')
      .select('id, is_active')
      .eq('id', id)
      .single()

    if (fetchError || !environment) {
      return notFoundResponse('Frappe environment')
    }

    if (environment.is_active) {
      return errorResponse('Cannot delete an active environment. Deactivate it first by switching to another environment.', 400)
    }

    const { error: deleteError } = await supabaseAdmin
      .from('frappe_environments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting Frappe environment:', deleteError)
      return errorResponse('Failed to delete Frappe environment')
    }

    return successResponse(null, 'Frappe environment deleted successfully')
  } catch (error) {
    console.error('Frappe environment DELETE error:', error)
    return errorResponse('Failed to delete Frappe environment')
  }
}
