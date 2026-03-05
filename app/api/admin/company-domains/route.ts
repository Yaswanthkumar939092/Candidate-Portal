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

const createDomainSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  company_name: z.string().min(1, 'Company name is required').optional(),
  frappe_company_id: z.string().optional(),
  is_active: z.boolean().optional(),
})

/**
 * GET /api/admin/company-domains
 *
 * List all company domains. Admin auth required.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const { data, error } = await supabaseAdmin
      .from('company_domains')
      .select('*')
      .order('domain')

    if (error) {
      console.error('Error fetching company domains:', error)
      return errorResponse('Failed to fetch company domains')
    }

    return successResponse(data || [])
  } catch (error) {
    console.error('GET /api/admin/company-domains error:', error)
    return errorResponse('Failed to fetch company domains')
  }
}

/**
 * POST /api/admin/company-domains
 *
 * Create a new company domain. Admin auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) return forbiddenResponse('Admin access required')

    const body = await request.json()
    const parsed = createDomainSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return validationErrorResponse(fieldErrors)
    }

    const { data: domain, error } = await supabaseAdmin
      .from('company_domains')
      .insert({
        domain: parsed.data.domain.toLowerCase(),
        company_name: parsed.data.company_name ?? null,
        frappe_company_id: parsed.data.frappe_company_id ?? null,
        is_active: parsed.data.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return errorResponse('Domain already exists', 409)
      }
      console.error('Error creating company domain:', error)
      return errorResponse('Failed to create company domain')
    }

    return createdResponse(domain, 'Company domain created successfully')
  } catch (error) {
    console.error('POST /api/admin/company-domains error:', error)
    return errorResponse('Failed to create company domain')
  }
}
