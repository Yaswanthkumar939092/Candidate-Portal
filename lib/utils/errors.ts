import { NextResponse } from 'next/server'
import { z } from 'zod'

// Custom error types
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public details: z.ZodError['issues']

  constructor(zodError: z.ZodError) {
    super('Validation failed', 400)
    this.details = zodError.issues
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409)
  }
}

export class RateLimitError extends AppError {
  public retryAfter: number

  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429)
    this.retryAfter = retryAfter
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, false)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message = 'External service error') {
    super(`${service}: ${message}`, 503, false)
  }
}

// Error handler function for API routes
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      },
      { status: 400 }
    )
  }

  // Handle custom app errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        retryAfter: error.retryAfter
      },
      {
        status: error.statusCode,
        headers: {
          'Retry-After': error.retryAfter.toString()
        }
      }
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string; details?: string }

    // Map common Supabase error codes to appropriate HTTP status codes
    if (supabaseError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    if (supabaseError.code === '23505') {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      )
    }

    if (supabaseError.code === '23503') {
      return NextResponse.json(
        { error: 'Referenced resource not found' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: supabaseError.message || 'Database error',
        ...(process.env.NODE_ENV === 'development' && {
          details: supabaseError.details,
          code: supabaseError.code
        })
      },
      { status: 500 }
    )
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'Internal server error'

  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error instanceof Error ? error.stack : undefined
      })
    },
    { status: 500 }
  )
}

// Utility function to create error responses
export const createErrorResponse = (
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse => {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

// Success response utility
export const createSuccessResponse = (
  data: Record<string, unknown>,
  message?: string,
  status: number = 200
): NextResponse => {
  return NextResponse.json(
    {
      ...(message && { message }),
      ...data,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

// Async error handler wrapper
export function asyncHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Error logging utility
export const logError = (error: unknown, context?: string) => {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ''

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr}${error.name}: ${error.message}`)
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack)
    }
  } else {
    console.error(`${timestamp} ${contextStr}Unknown error:`, error)
  }

  // In production, you might want to send errors to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, DataDog, etc.
    // sendToMonitoringService(error, context)
  }
}

// Utility to check if error is operational (expected) or programming error
export const isOperationalError = (error: unknown): boolean => {
  if (error instanceof AppError) {
    return error.isOperational
  }

  // Common operational errors
  if (error instanceof z.ZodError) {
    return true
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code

    // Supabase operational error codes
    const operationalCodes = [
      'PGRST116', // Not found
      '23505',    // Unique violation
      '23503',    // Foreign key violation
      '23514',    // Check violation
    ]

    return operationalCodes.includes(errorCode)
  }

  return false
}

// Type guards for error types
export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError
}

export const isZodError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError
}