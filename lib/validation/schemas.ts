import { z } from 'zod'

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Authentication schemas
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
})

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  skills: z.array(z.string()).optional(),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  preferred_salary_min: z.number().min(0, 'Salary must be positive').optional(),
  preferred_salary_max: z.number().min(0, 'Salary must be positive').optional(),
  preferred_job_types: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.preferred_salary_min && data.preferred_salary_max) {
    return data.preferred_salary_min <= data.preferred_salary_max
  }
  return true
}, {
  message: 'Minimum salary cannot be greater than maximum salary',
  path: ['preferred_salary_min']
})

// Job schemas
export const jobsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  search: z.string().optional(),
  location: z.string().optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  skills: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  salary_min: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  salary_max: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  company: z.string().optional(),
  sort_by: z.enum(['created_at', 'title', 'company', 'salary_min']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const jobBaseSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(255, 'Title too long'),
  company: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
  company_logo: z.string().url('Invalid logo URL').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  salary_min: z.number().min(0, 'Minimum salary must be positive').optional(),
  salary_max: z.number().min(0, 'Maximum salary must be positive').optional(),
  location: z.string().min(1, 'Location is required'),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']),
  skills_required: z.array(z.string()).optional(),
  application_deadline: z.string().datetime().optional(),
})

export const createJobSchema = jobBaseSchema.refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_min <= data.salary_max
  }
  return true
}, {
  message: 'Minimum salary cannot be greater than maximum salary',
  path: ['salary_min']
})

export const updateJobSchema = jobBaseSchema.partial().extend({
  is_active: z.boolean().optional(),
}).refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_min <= data.salary_max
  }
  return true
}, {
  message: 'Minimum salary cannot be greater than maximum salary',
  path: ['salary_min']
})


// Application schemas
export const applicationsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
  job_id: uuidSchema.optional(),
  sort_by: z.enum(['applied_at', 'updated_at', 'status']).default('applied_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

export const createApplicationSchema = z.object({
  job_id: uuidSchema,
  cover_letter: z.string().max(2000, 'Cover letter too long').optional(),
  resume_url: z.string().url('Invalid resume URL').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
  cover_letter: z.string().max(2000, 'Cover letter too long').optional(),
  resume_url: z.string().url('Invalid resume URL').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Admin schemas
export const adminUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 20),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'email', 'full_name', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

export const syncOptionsSchema = z.object({
  force: z.string().optional().transform(val => val === 'true'),
  company: z.string().optional(),
})

// Saved jobs schema
export const savedJobsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  sort_by: z.enum(['saved_at', 'title', 'company']).default('saved_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Custom validation functions
export const validateUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Simple phone validation - can be enhanced based on requirements
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export const validateURL = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Sanitization functions
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ')
}

export const sanitizeHTML = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Error types for validation
export class ValidationError extends Error {
  public issues: z.ZodError['issues']

  constructor(zodError: z.ZodError) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.issues = zodError.issues
  }
}

// Helper function to handle validation errors
export const handleValidationError = (error: unknown) => {
  if (error instanceof z.ZodError) {
    throw new ValidationError(error)
  }
  throw error
}