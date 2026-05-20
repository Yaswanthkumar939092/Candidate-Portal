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

const updateDomainSchema = z.object({
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .optional(),
  company_name: z.string().nullable().optional(),
  frappe_company_id: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

/**
 * GET /api/admin/company-domains/[id]
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
      .from('company_domains')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFoundResponse('Company domain')
      console.error('Error fetching company domain:', error)
      return errorResponse('Failed to fetch company domain')
    }

    return successResponse(data)
  } catch (error) {
    console.error('GET /api/admin/company-domains/[id] error:', error)
    return errorResponse('Failed to fetch company domain')
  }
}

/**
 * PUT /api/admin/company-domains/[id]
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
    const parsed = updateDomainSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.domain) {
      updateData.domain = parsed.data.domain.toLowerCase()
    }

    const { data, error } = await supabaseAdmin
      .from('company_domains')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return notFoundResponse('Company domain')
      if (error.code === '23505') return errorResponse('Domain already exists', 409)
      console.error('Error updating company domain:', error)
      return errorResponse('Failed to update company domain')
    }

    return successResponse(data, 'Company domain updated successfully')
  } catch (error) {
    console.error('PUT /api/admin/company-domains/[id] error:', error)
    return errorResponse('Failed to update company domain')
  }
}

/**
 * DELETE /api/admin/company-domains/[id]
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
      .from('company_domains')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting company domain:', error)
      return errorResponse('Failed to delete company domain')
    }

    return successResponse(null, 'Company domain deleted successfully')
  } catch (error) {
    console.error('DELETE /api/admin/company-domains/[id] error:', error)
    return errorResponse('Failed to delete company domain')
  }
}
