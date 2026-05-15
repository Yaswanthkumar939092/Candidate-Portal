import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limit configuration schema
const rateLimitConfigSchema = z.object({
  windowMs: z.number().min(1000).default(15 * 60 * 1000), // 15 minutes default
  maxRequests: z.number().min(1).default(100),
  message: z.string().default('Too many requests from this IP, please try again later'),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
  keyGenerator: z.function().optional(),
  onLimitReached: z.function().optional(),
})

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    firstRequest: number
  }
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

// In-memory store for rate limiting (in production, use Redis)
class InMemoryRateLimitStore {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  get(key: string): RateLimitStore[string] | undefined {
    return this.store[key]
  }

  set(key: string, value: RateLimitStore[string]): void {
    this.store[key] = value
  }

  increment(key: string, windowMs: number): RateLimitStore[string] {
    const now = Date.now()
    const current = this.store[key]

    if (!current || now > current.resetTime) {
      // New window or expired window
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
      }
    } else {
      // Within current window
      this.store[key].count++
    }

    return this.store[key]
  }

  reset(key: string): void {
    delete this.store[key]
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, value] of Object.entries(this.store)) {
      if (now > value.resetTime) {
        delete this.store[key]
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store = {}
  }
}

// Redis-based rate limit store (for production)
class RedisRateLimitStore {
  // This would implement Redis-based storage
  // For now, we'll use the in-memory store
  private fallback = new InMemoryRateLimitStore()

  get(key: string) {
    return this.fallback.get(key)
  }

  set(key: string, value: RateLimitStore[string]) {
    return this.fallback.set(key, value)
  }

  increment(key: string, windowMs: number) {
    return this.fallback.increment(key, windowMs)
  }

  reset(key: string) {
    return this.fallback.reset(key)
  }

  destroy() {
    return this.fallback.destroy()
  }
}

// Default store instance
const defaultStore = new InMemoryRateLimitStore()

// Rate limiter class
export class RateLimiter {
  protected config: z.infer<typeof rateLimitConfigSchema>
  private store: InMemoryRateLimitStore | RedisRateLimitStore

  constructor(
    config: Partial<z.infer<typeof rateLimitConfigSchema>> = {},
    store?: InMemoryRateLimitStore | RedisRateLimitStore
  ) {
    this.config = rateLimitConfigSchema.parse(config)
    this.store = store || defaultStore
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.generateKey(request)
    const data = this.store.increment(key, this.config.windowMs)

    const result: RateLimitResult = {
      allowed: data.count <= this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - data.count),
      resetTime: data.resetTime,
      totalHits: data.count,
    }

    // Call onLimitReached callback if limit is exceeded
    if (!result.allowed && this.config.onLimitReached) {
      try {
        await (this.config.onLimitReached as (req: NextRequest, res: RateLimitResult) => Promise<void> | void)(request, result)
      } catch (error) {
        console.error('Rate limit onLimitReached callback error:', error)
      }
    }

    return result
  }

  private generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return (this.config.keyGenerator as (req: NextRequest) => string)(request)
    }

    // Default key generation based on IP address
    const ip = this.getClientIP(request)
    const path = new URL(request.url).pathname
    return `rate-limit:${ip}:${path}`
  }

  protected getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  reset(request: NextRequest): void {
    const key = this.generateKey(request)
    this.store.reset(key)
  }
}

// Pre-configured rate limiters for common use cases
export const strictRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per window
  message: 'Too many requests, please try again later',
})

export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'API rate limit exceeded',
})

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per window
  message: 'Too many authentication attempts',
})

export const uploadRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // 20 uploads per hour
  message: 'Upload rate limit exceeded',
})

// Middleware wrapper function
export function withRateLimit(
  rateLimiter: RateLimiter,
  options: {
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
    onLimitReached?: (request: NextRequest, result: RateLimitResult) => Promise<void>
  } = {}
) {
  return async function (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    try {
      // Check rate limit
      const result = await rateLimiter.checkLimit(request)

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

        // Call custom onLimitReached if provided
        if (options.onLimitReached) {
          await options.onLimitReached(request, result)
        }

        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP, please try again later',
            retryAfter,
            limit: rateLimiter['config'].maxRequests,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        )
      }

      // Execute the handler
      const response = await handler(request)

      // Add rate limit headers based on options
      let shouldSetHeaders = true
      if (response.status < 400 && options.skipSuccessfulRequests) {
        shouldSetHeaders = false
      }
      if (response.status >= 400 && options.skipFailedRequests) {
        shouldSetHeaders = false
      }

      if (shouldSetHeaders) {
        response.headers.set('X-RateLimit-Limit', rateLimiter['config'].maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
      }

      return response

    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // Continue without rate limiting if there's an error
      return await handler(request)
    }
  }
}

// Dynamic rate limiter that adjusts based on user type
export class DynamicRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map()

  constructor(
    private configs: {
      anonymous: Partial<z.infer<typeof rateLimitConfigSchema>>
      authenticated: Partial<z.infer<typeof rateLimitConfigSchema>>
      admin: Partial<z.infer<typeof rateLimitConfigSchema>>
      premium: Partial<z.infer<typeof rateLimitConfigSchema>>
    }
  ) {
    // Create rate limiters for each user type
    this.limiters.set('anonymous', new RateLimiter(configs.anonymous))
    this.limiters.set('authenticated', new RateLimiter(configs.authenticated))
    this.limiters.set('admin', new RateLimiter(configs.admin))
    this.limiters.set('premium', new RateLimiter(configs.premium))
  }

  async checkLimit(
    request: NextRequest,
    userType: 'anonymous' | 'authenticated' | 'admin' | 'premium' = 'anonymous'
  ): Promise<RateLimitResult> {
    const limiter = this.limiters.get(userType) || this.limiters.get('anonymous')!
    return await limiter.checkLimit(request)
  }

  getLimiter(userType: string): RateLimiter | undefined {
    return this.limiters.get(userType)
  }
}

// Default dynamic rate limiter
export const dynamicRateLimit = new DynamicRateLimiter({
  anonymous: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    message: 'Rate limit exceeded for anonymous users',
  },
  authenticated: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Rate limit exceeded for authenticated users',
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 500,
    message: 'Rate limit exceeded for admin users',
  },
  premium: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 200,
    message: 'Rate limit exceeded for premium users',
  },
})

// Utility functions for rate limiting specific operations
export function createFileUploadRateLimit() {
  return new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 uploads per hour
    message: 'File upload rate limit exceeded',
  })
}

export function createSearchRateLimit() {
  return new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    message: 'Search rate limit exceeded',
  })
}

export function createAPIKeyRateLimit(apiKey: string) {
  return new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per window for API key
    message: 'API key rate limit exceeded',
    keyGenerator: (_request: NextRequest) => `api-key:${apiKey}`,
  })
}

// Rate limit bypass for specific IPs (whitelisting)
export class WhitelistRateLimiter extends RateLimiter {
  private whitelist: Set<string>

  constructor(
    config: Partial<z.infer<typeof rateLimitConfigSchema>> = {},
    whitelist: string[] = []
  ) {
    super(config)
    this.whitelist = new Set(whitelist)
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const ip = this.getClientIPAddress(request)

    // Check if IP is whitelisted
    if (this.whitelist.has(ip)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        totalHits: 0,
      }
    }

    return super.checkLimit(request)
  }

  private getClientIPAddress(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  addToWhitelist(ip: string): void {
    this.whitelist.add(ip)
  }

  removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip)
  }

  isWhitelisted(ip: string): boolean {
    return this.whitelist.has(ip)
  }
}

// Export store classes for advanced usage
export { InMemoryRateLimitStore, RedisRateLimitStore }

// Export types
export type { RateLimitResult, RateLimitStore }