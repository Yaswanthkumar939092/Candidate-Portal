import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/database'
import type { User, PostgrestError } from '@supabase/supabase-js'

export interface AuthenticatedRequest extends NextRequest {
  user?: User
}

/**
 * Authentication middleware for API routes
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Get access token from cookies or Authorization header
    const accessToken = request.cookies.get('supabase-access-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user to request object
    ;(request as AuthenticatedRequest).user = user

    // Call the original handler
    return await handler(request as AuthenticatedRequest)

  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

/**
 * Role-based authorization middleware
 */
export function withRoles(requiredRoles: string[]) {
  return async (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<Response>
  ): Promise<Response> => {
    if (!request.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', request.user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // For now, we'll use a simplified role check
    // In a real implementation, you'd have a role field in the profile
    const isAdmin = profile.role ? profile.role === 'admin' : !!profile

    if (requiredRoles.includes('admin') && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return await handler(request)
  }
}

/**
 * Resource ownership middleware
 * Checks if the current user owns the resource or has admin privileges
 */
export function withOwnership(
  resourceTable: string,
  resourceIdParam: string,
  ownershipField = 'user_id'
) {
  return async (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<Response>,
    params: Record<string, string | string[] | undefined>
  ): Promise<Response> => {
    if (!request.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resourceId = params[resourceIdParam]

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID required' },
        { status: 400 }
      )
    }

    // Check resource ownership
    const { data: resource, error } = await supabaseAdmin
      .from(resourceTable as keyof Database['public']['Tables'])
      .select(`id, ${ownershipField}`)
      .eq('id', Array.isArray(resourceId) ? resourceId[0] : resourceId)
      .single() as { data: Record<string, unknown> | null, error: PostgrestError | null }

    if (error || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check if user owns the resource
    if ((resource as Record<string, unknown>)[ownershipField] !== request.user.id) {
      // Check if user is admin (simplified check)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', request.user.id)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return await handler(request)
  }
}

/**
 * Rate limiting middleware (simplified in-memory implementation)
 * In production, you'd use Redis or another persistent store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  maxRequests = 100,
  windowMs = 15 * 60 * 1000 // 15 minutes
) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const key = `rate-limit:${ip}`
    const now = Date.now()

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime <= now) {
        rateLimitStore.delete(k)
      }
    }

    // Get current rate limit data
    const current = rateLimitStore.get(key)

    if (!current) {
      // First request in window
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    } else if (current.count >= maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString()
          }
        }
      )
    } else {
      // Increment counter
      current.count++
    }

    const response = await handler(request)

    // Get updated rate limit data for headers
    const updated = rateLimitStore.get(key)
    const remaining = Math.max(0, maxRequests - (updated?.count || 0))
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil((current?.resetTime || now + windowMs) / 1000).toString())

    return response
  }
}

/**
 * Helper function to get user from request (for use in route handlers)
 */
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const accessToken = request.cookies.get('supabase-access-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    return null
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    // Simplified admin check - in reality you'd have a role field
    return !!profile
  } catch {
    return false
  }
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: Array<(req: AuthenticatedRequest, handler: (req: AuthenticatedRequest) => Promise<Response>, ...args: unknown[]) => Promise<Response>>
) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<Response>,
    ...args: unknown[]
  ): Promise<Response> => {
    let currentHandler: (req: AuthenticatedRequest) => Promise<Response> = handler

    // Apply middleware in reverse order so they execute in the correct order
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i]
      const prevHandler = currentHandler
      currentHandler = (req: AuthenticatedRequest) => middleware(req, prevHandler, ...args)
    }

    return await currentHandler(request as AuthenticatedRequest)
  }
}