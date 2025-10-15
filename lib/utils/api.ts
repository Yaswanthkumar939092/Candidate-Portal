import { NextRequest } from 'next/server'

// Utility functions for API route handlers

/**
 * Extract and validate pagination parameters from request
 */
export const getPaginationParams = (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Extract sorting parameters from request
 */
export const getSortParams = (
  request: NextRequest,
  allowedFields: string[] = [],
  defaultField = 'created_at',
  defaultOrder: 'asc' | 'desc' = 'desc'
) => {
  const { searchParams } = new URL(request.url)

  const sortBy = searchParams.get('sort_by') || defaultField
  const sortOrder = (searchParams.get('sort_order') as 'asc' | 'desc') || defaultOrder

  // Validate sort field
  const validSortBy = allowedFields.length > 0
    ? allowedFields.includes(sortBy) ? sortBy : defaultField
    : sortBy

  return {
    sortBy: validSortBy,
    sortOrder: ['asc', 'desc'].includes(sortOrder) ? sortOrder : defaultOrder
  }
}

/**
 * Extract filter parameters from request
 */
export const getFilterParams = (
  request: NextRequest,
  allowedFilters: string[] = []
): Record<string, string> => {
  const { searchParams } = new URL(request.url)
  const filters: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    if (allowedFilters.length === 0 || allowedFilters.includes(key)) {
      if (value && value.trim()) {
        filters[key] = value.trim()
      }
    }
  }

  return filters
}

/**
 * Parse array parameters from query string
 */
export const parseArrayParam = (param: string | null): string[] => {
  if (!param) return []
  return param.split(',').map(item => item.trim()).filter(Boolean)
}

/**
 * Parse boolean parameter from query string
 */
export const parseBooleanParam = (param: string | null, defaultValue = false): boolean => {
  if (!param) return defaultValue
  return param.toLowerCase() === 'true'
}

/**
 * Parse number parameter from query string
 */
export const parseNumberParam = (param: string | null, defaultValue?: number): number | undefined => {
  if (!param) return defaultValue
  const parsed = parseInt(param, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Get client IP address from request
 */
export const getClientIP = (request: NextRequest): string => {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  )
}

/**
 * Get user agent from request
 */
export const getUserAgent = (request: NextRequest): string => {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Check if request accepts JSON
 */
export const acceptsJSON = (request: NextRequest): boolean => {
  const accept = request.headers.get('accept') || ''
  return accept.includes('application/json') || accept.includes('*/*')
}

/**
 * Get content type from request
 */
export const getContentType = (request: NextRequest): string => {
  return request.headers.get('content-type') || ''
}

/**
 * Check if request is multipart/form-data
 */
export const isMultipartFormData = (request: NextRequest): boolean => {
  return getContentType(request).startsWith('multipart/form-data')
}

/**
 * Parse JSON body safely
 */
export const parseJSONBody = async (request: NextRequest): Promise<any> => {
  try {
    const text = await request.text()
    return text ? JSON.parse(text) : {}
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (
  body: Record<string, any>,
  requiredFields: string[]
): string[] => {
  const missingFields: string[] = []

  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined || body[field] === '') {
      missingFields.push(field)
    }
  }

  return missingFields
}

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ')
}

/**
 * Clean object by removing null, undefined, and empty string values
 */
export const cleanObject = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  }

  return cleaned
}

/**
 * Build database query filters
 */
export const buildQueryFilters = (
  filters: Record<string, any>,
  fieldMappings: Record<string, string> = {}
): Array<{ field: string; operator: string; value: any }> => {
  const queryFilters: Array<{ field: string; operator: string; value: any }> = []

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) continue

    const field = fieldMappings[key] || key

    if (typeof value === 'string') {
      if (value.includes('*') || value.includes('%')) {
        // Like query
        queryFilters.push({
          field,
          operator: 'ilike',
          value: value.replace(/\*/g, '%')
        })
      } else {
        // Exact match
        queryFilters.push({
          field,
          operator: 'eq',
          value
        })
      }
    } else if (Array.isArray(value)) {
      // In query
      queryFilters.push({
        field,
        operator: 'in',
        value
      })
    } else {
      // Direct value
      queryFilters.push({
        field,
        operator: 'eq',
        value
      })
    }
  }

  return queryFilters
}

/**
 * Generate cache key from request parameters
 */
export const generateCacheKey = (
  prefix: string,
  request: NextRequest,
  additionalParams: Record<string, any> = {}
): string => {
  const { searchParams, pathname } = new URL(request.url)
  const params = { ...Object.fromEntries(searchParams), ...additionalParams }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  return `${prefix}:${pathname}:${sortedParams}`
}

/**
 * Rate limiting key generator
 */
export const generateRateLimitKey = (
  prefix: string,
  request: NextRequest,
  identifier?: string
): string => {
  const id = identifier || getClientIP(request)
  return `rate-limit:${prefix}:${id}`
}

/**
 * Extract authorization token from request
 */
export const extractAuthToken = (request: NextRequest): string | null => {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try cookie as fallback
  return request.cookies.get('supabase-access-token')?.value || null
}

/**
 * Check if request is from localhost
 */
export const isLocalhost = (request: NextRequest): boolean => {
  const host = request.headers.get('host') || ''
  return host.includes('localhost') || host.includes('127.0.0.1')
}

/**
 * Get request origin
 */
export const getRequestOrigin = (request: NextRequest): string => {
  return request.headers.get('origin') || request.headers.get('referer') || 'unknown'
}

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Create audit log entry data
 */
export const createAuditLogData = (
  request: NextRequest,
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any
) => {
  return {
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: getClientIP(request),
    user_agent: getUserAgent(request),
    timestamp: new Date().toISOString()
  }
}

/**
 * Format error for logging
 */
export const formatErrorForLogging = (
  error: unknown,
  context: string,
  request?: NextRequest
): string => {
  const timestamp = new Date().toISOString()
  const ip = request ? getClientIP(request) : 'unknown'
  const userAgent = request ? getUserAgent(request) : 'unknown'

  let errorMessage = 'Unknown error'
  let errorStack = ''

  if (error instanceof Error) {
    errorMessage = error.message
    errorStack = error.stack || ''
  } else if (typeof error === 'string') {
    errorMessage = error
  } else {
    errorMessage = JSON.stringify(error)
  }

  return `[${timestamp}] ${context} - ${errorMessage} (IP: ${ip}, UA: ${userAgent})\n${errorStack}`
}