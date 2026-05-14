import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  uuidSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,
  signupSchema,
  signinSchema,
  updateProfileSchema,
  jobsQuerySchema,
  createJobSchema,
  updateJobSchema,
  applicationsQuerySchema,
  createApplicationSchema,
  adminUsersQuerySchema,
  syncOptionsSchema,
  savedJobsQuerySchema,
  validateUUID,
  validateEmail,
  validatePhone,
  validateURL,
  sanitizeString,
  sanitizeHTML,
  ValidationError,
  handleValidationError,
} from '@/lib/validation/schemas'

describe('Validation Schemas & Utils', () => {
  describe('Common Schemas', () => {
    it('uuidSchema validates UUIDs correctly', () => {
      expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    })

    it('emailSchema validates emails correctly', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true)
      expect(emailSchema.safeParse('invalid-email').success).toBe(false)
    })

    it('passwordSchema enforces minimum length', () => {
      expect(passwordSchema.safeParse('12345678').success).toBe(true)
      expect(passwordSchema.safeParse('1234567').success).toBe(false)
    })
  })

  describe('Pagination Schema', () => {
    it('transforms strings to numbers and sets defaults', () => {
      const result = paginationSchema.parse({ page: '2', limit: '30' })
      expect(result).toEqual({
        page: 2,
        limit: 30,
        sort_order: 'desc',
        sort_by: undefined,
      })
    })

    it('uses defaults for missing fields', () => {
      const result = paginationSchema.parse({})
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sort_order: 'desc',
      })
    })

    it('caps limit at 100', () => {
      const result = paginationSchema.parse({ limit: '150' })
      expect(result.limit).toBe(100)
    })
  })

  describe('Authentication Schemas', () => {
    it('signupSchema validates valid data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        experienceLevel: 'mid',
      }
      expect(signupSchema.safeParse(data).success).toBe(true)
    })

    it('signinSchema requires email and password', () => {
      expect(signinSchema.safeParse({ email: 'test@example.com', password: 'p' }).success).toBe(true)
      expect(signinSchema.safeParse({ email: 'test@example.com' }).success).toBe(false)
    })

    it('updateProfileSchema validates salary range', () => {
      const valid = { preferred_salary_min: 50000, preferred_salary_max: 100000 }
      const invalid = { preferred_salary_min: 100000, preferred_salary_max: 50000 }
      const partial = { preferred_salary_min: 50000 }
      expect(updateProfileSchema.safeParse(valid).success).toBe(true)
      expect(updateProfileSchema.safeParse(invalid).success).toBe(false)
      expect(updateProfileSchema.safeParse(partial).success).toBe(true)
      expect(updateProfileSchema.safeParse({}).success).toBe(true)
    })
  })

  describe('Job Schemas', () => {
    it('jobsQuerySchema transforms query parameters', () => {
      const result = jobsQuerySchema.parse({
        page: '1',
        limit: '30',
        skills: 'react,nodejs',
        salary_min: '50000',
        salary_max: '100000',
      })
      expect(result.limit).toBe(30)
      expect(result.skills).toEqual(['react', 'nodejs'])
      expect(result.salary_min).toBe(50000)
      expect(result.salary_max).toBe(100000)
    })

    it('jobsQuerySchema handles empty parameters', () => {
      const result = jobsQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.skills).toBeUndefined()
      expect(result.salary_min).toBeUndefined()
      expect(result.salary_max).toBeUndefined()
    })

    it('createJobSchema validates salary range', () => {
      const base = {
        title: 'Dev',
        company: 'Acme',
        description: 'A very long description here',
        location: 'Remote',
        job_type: 'full-time',
        experience_level: 'mid',
      }
      expect(createJobSchema.safeParse({ ...base, salary_min: 50, salary_max: 100 }).success).toBe(true)
      expect(createJobSchema.safeParse({ ...base, salary_min: 100, salary_max: 50 }).success).toBe(false)
      expect(createJobSchema.safeParse({ ...base, salary_min: 50 }).success).toBe(true)
      expect(createJobSchema.safeParse(base).success).toBe(true)
    })

    it('updateJobSchema validates partial data and salary range', () => {
      expect(updateJobSchema.safeParse({ title: 'New Title' }).success).toBe(true)
      expect(updateJobSchema.safeParse({ salary_min: 100, salary_max: 50 }).success).toBe(false)
      expect(updateJobSchema.safeParse({ salary_min: 50, salary_max: 100 }).success).toBe(true)
      expect(updateJobSchema.safeParse({ salary_min: 50 }).success).toBe(true)
    })
  })

  describe('Application Schemas', () => {
    it('applicationsQuerySchema transforms parameters', () => {
      const result = applicationsQuerySchema.parse({ page: '3', limit: '40' })
      expect(result.page).toBe(3)
      expect(result.limit).toBe(40)
    })

    it('applicationsQuerySchema handles empty parameters', () => {
      const result = applicationsQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('createApplicationSchema requires job_id', () => {
      const job_id = '550e8400-e29b-41d4-a716-446655440000'
      expect(createApplicationSchema.safeParse({ job_id }).success).toBe(true)
      expect(createApplicationSchema.safeParse({}).success).toBe(false)
    })
  })

  describe('Admin Schemas', () => {
    it('adminUsersQuerySchema transforms parameters', () => {
      const result = adminUsersQuerySchema.parse({ page: '5', limit: '50' })
      expect(result.page).toBe(5)
      expect(result.limit).toBe(50)
    })

    it('adminUsersQuerySchema handles empty parameters', () => {
      const result = adminUsersQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('syncOptionsSchema transforms force param', () => {
      expect(syncOptionsSchema.parse({ force: 'true' }).force).toBe(true)
      expect(syncOptionsSchema.parse({ force: 'false' }).force).toBe(false)
      expect(syncOptionsSchema.parse({}).force).toBe(false)
    })
  })

  describe('Saved Jobs Schemas', () => {
    it('savedJobsQuerySchema transforms parameters', () => {
      const result = savedJobsQuerySchema.parse({ page: '2', limit: '10' })
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
    })

    it('savedJobsQuerySchema handles empty parameters', () => {
      const result = savedJobsQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })
  })

  describe('Custom Validation Functions', () => {
    it('validateUUID', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(validateUUID('invalid')).toBe(false)
    })

    it('validateEmail', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid')).toBe(false)
    })

    it('validatePhone', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('12345')).toBe(false)
    })

    it('validateURL', () => {
      expect(validateURL('https://example.com')).toBe(true)
      expect(validateURL('not-a-url')).toBe(false)
    })
  })

  describe('Sanitization Functions', () => {
    it('sanitizeString trims and collapses whitespace', () => {
      expect(sanitizeString('  hello   world  ')).toBe('hello world')
    })

    it('sanitizeHTML escapes basic tags', () => {
      expect(sanitizeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })
  })

  describe('Error Handling', () => {
    it('ValidationError captures Zod issues', () => {
      const result = z.string().safeParse(123)
      if (!result.success) {
        const error = new ValidationError(result.error)
        expect(error.issues).toHaveLength(1)
        expect(error.message).toBe('Validation failed')
      }
    })

    it('handleValidationError throws ValidationError for ZodError', () => {
      const zodError = new z.ZodError([])
      expect(() => handleValidationError(zodError)).toThrow(ValidationError)
    })

    it('handleValidationError rethrows other errors', () => {
      const otherError = new Error('Other')
      expect(() => handleValidationError(otherError)).toThrow('Other')
    })
  })
})
