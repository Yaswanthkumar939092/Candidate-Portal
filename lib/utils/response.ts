import { NextResponse } from 'next/server'

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Array<{
    field: string
    message: string
    code?: string
  }>
  meta?: {
    timestamp: string
    version?: string
    requestId?: string
  }
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Success response builders
export const successResponse = <T>(
  data: T,
  message?: string,
  status: number = 200,
  meta?: Partial<ApiResponse['meta']>
): NextResponse => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  }

  return NextResponse.json(response, { status })
}

export const successResponseWithPagination = <T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  status: number = 200
): NextResponse => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    ...(message && { message }),
    pagination,
    meta: {
      timestamp: new Date().toISOString()
    }
  }

  return NextResponse.json(response, { status })
}

export const createdResponse = <T>(
  data: T,
  message: string = 'Resource created successfully'
): NextResponse => {
  return successResponse(data, message, 201)
}

export const noContentResponse = (
  message: string = 'Operation completed successfully'
): NextResponse => {
  return NextResponse.json(
    {
      success: true,
      message,
      meta: {
        timestamp: new Date().toISOString()
      }
    },
    { status: 200 }
  )
}

// Error response builders
export const errorResponse = (
  error: string,
  status: number = 500,
  errors?: Array<{ field: string; message: string; code?: string }>
): NextResponse => {
  const response: ApiResponse = {
    success: false,
    error,
    ...(errors && { errors }),
    meta: {
      timestamp: new Date().toISOString()
    }
  }

  return NextResponse.json(response, { status })
}

export const validationErrorResponse = (
  errors: Array<{ field: string; message: string; code?: string }>
): NextResponse => {
  return errorResponse(
    'Validation failed',
    400,
    errors
  )
}

export const unauthorizedResponse = (
  message: string = 'Authentication required'
): NextResponse => {
  return errorResponse(message, 401)
}

export const forbiddenResponse = (
  message: string = 'Insufficient permissions'
): NextResponse => {
  return errorResponse(message, 403)
}

export const notFoundResponse = (
  resource: string = 'Resource'
): NextResponse => {
  return errorResponse(`${resource} not found`, 404)
}

export const conflictResponse = (
  message: string = 'Resource already exists'
): NextResponse => {
  return errorResponse(message, 409)
}

export const rateLimitResponse = (
  retryAfter: number
): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded',
      meta: {
        timestamp: new Date().toISOString(),
        retryAfter
      }
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0'
      }
    }
  )
}

export const serviceUnavailableResponse = (
  service?: string
): NextResponse => {
  const message = service
    ? `${service} service is currently unavailable`
    : 'Service temporarily unavailable'

  return errorResponse(message, 503)
}

// Utility functions for pagination
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

// Response headers utilities
export const setCacheHeaders = (
  response: NextResponse,
  maxAge: number = 300 // 5 minutes default
): NextResponse => {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}`)
  response.headers.set('ETag', `"${Date.now()}"`)
  return response
}

export const setSecurityHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export const setCorsHeaders = (
  response: NextResponse,
  allowedOrigins: string[] = ['http://localhost:3000']
): NextResponse => {
  const origin = response.headers.get('origin')

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

// Health check response
export const healthCheckResponse = (
  status: 'healthy' | 'unhealthy' = 'healthy',
  services?: Record<string, 'healthy' | 'unhealthy'>,
  uptime?: number
): NextResponse => {
  const data = {
    status,
    timestamp: new Date().toISOString(),
    ...(uptime && { uptime: `${Math.floor(uptime)}s` }),
    ...(services && { services })
  }

  return NextResponse.json(data, {
    status: status === 'healthy' ? 200 : 503
  })
}

// Batch operation response
export const batchOperationResponse = (
  results: Array<{
    id: string
    success: boolean
    error?: string
  }>,
  message?: string
): NextResponse => {
  const successful = results.filter(r => r.success).length
  const failed = results.length - successful

  return successResponse(
    {
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    },
    message || `Batch operation completed: ${successful} successful, ${failed} failed`
  )
}

// File upload response
export const fileUploadResponse = (
  file: {
    id: string
    name: string
    url: string
    size: number
    type: string
  },
  message: string = 'File uploaded successfully'
): NextResponse => {
  return createdResponse(file, message)
}

// Export response
export const exportResponse = (
  data: any,
  filename: string,
  format: 'json' | 'csv' = 'json'
): NextResponse => {
  const headers: Record<string, string> = {
    'Content-Disposition': `attachment; filename="${filename}"`
  }

  if (format === 'json') {
    headers['Content-Type'] = 'application/json'
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers
    })
  }

  if (format === 'csv') {
    headers['Content-Type'] = 'text/csv'
    // Convert data to CSV format (simplified)
    const csvData = Array.isArray(data)
      ? data.map(row => Object.values(row).join(',')).join('\n')
      : 'No data available'

    return new NextResponse(csvData, {
      status: 200,
      headers
    })
  }

  return errorResponse('Unsupported export format', 400)
}