import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response'
import crypto from 'crypto'

// Webhook payload schemas
const baseWebhookSchema = z.object({
  event_type: z.enum(['created', 'updated', 'deleted']),
  timestamp: z.string(),
  source: z.literal('frappe'),
  signature: z.string(),
})

const jobWebhookSchema = baseWebhookSchema.extend({
  resource: z.literal('job'),
  data: z.object({
    job_id: z.string(),
    title: z.string(),
    company: z.string(),
    description: z.string(),
    requirements: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    location: z.string(),
    job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']),
    experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']),
    skills_required: z.array(z.string()).optional(),
    application_deadline: z.string().datetime().optional(),
    is_active: z.boolean(),
    company_logo: z.string().url().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
})

const applicationWebhookSchema = baseWebhookSchema.extend({
  resource: z.literal('application'),
  data: z.object({
    application_id: z.string(),
    job_id: z.string(),
    candidate_email: z.string().email(),
    candidate_name: z.string(),
    status: z.enum(['pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn']),
    cover_letter: z.string().optional(),
    resume_url: z.string().url().optional(),
    applied_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    notes: z.string().optional(),
    rejection_reason: z.string().optional(),
  })
})

const companyWebhookSchema = baseWebhookSchema.extend({
  resource: z.literal('company'),
  data: z.object({
    company_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    website: z.string().url().optional(),
    logo_url: z.string().url().optional(),
    location: z.string().optional(),
    industry: z.string().optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
})

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.FRAPPE_WEBHOOK_SECRET || 'default-webhook-secret'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const providedSignature = signature.replace('sha256=', '')

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify content type
    const contentType = request.headers.get('content-type')
    if (contentType !== 'application/json') {
      return errorResponse('Invalid content type. Expected application/json', 400)
    }

    // Parse JSON payload
    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      return errorResponse('Invalid JSON payload', 400)
    }

    // Verify webhook signature
    const signature = request.headers.get('x-frappe-signature')
    if (!signature || !verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
      return unauthorizedResponse('Invalid webhook signature')
    }

    // Route to appropriate handler based on resource type
    const resource = (payload as { resource?: string }).resource

    switch (resource) {
      case 'job':
        return await handleJobWebhook(payload)
      case 'application':
        return await handleApplicationWebhook(payload)
      case 'company':
        return await handleCompanyWebhook(payload)
      default:
        return errorResponse(`Unsupported resource type: ${resource}`, 400)
    }

  } catch (error) {
    console.error('Webhook handler error:', error)
    return errorResponse('Webhook processing failed', 500)
  }
}

async function handleJobWebhook(payload: unknown) {
  try {
    const validatedPayload = jobWebhookSchema.parse(payload)
    const { event_type, data } = validatedPayload

    switch (event_type) {
      case 'created':
      case 'updated':
        return await upsertJob(data, event_type)
      case 'deleted':
        return await deleteJob(data.job_id)
      default:
        return errorResponse(`Unsupported job event type: ${event_type}`, 400)
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Job webhook validation error:', error.errors)
      return errorResponse('Invalid job webhook payload', 400)
    }
    throw error
  }
}

async function handleApplicationWebhook(payload: unknown) {
  try {
    const validatedPayload = applicationWebhookSchema.parse(payload)
    const { event_type, data } = validatedPayload

    switch (event_type) {
      case 'created':
      case 'updated':
        return await upsertApplication(data, event_type)
      case 'deleted':
        return await deleteApplication(data.application_id)
      default:
        return errorResponse(`Unsupported application event type: ${event_type}`, 400)
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Application webhook validation error:', error.errors)
      return errorResponse('Invalid application webhook payload', 400)
    }
    throw error
  }
}

async function handleCompanyWebhook(payload: unknown) {
  try {
    const validatedPayload = companyWebhookSchema.parse(payload)
    const { event_type, data } = validatedPayload

    switch (event_type) {
      case 'created':
      case 'updated':
        return await upsertCompany(data, event_type)
      case 'deleted':
        return await deleteCompany(data.company_id)
      default:
        return errorResponse(`Unsupported company event type: ${event_type}`, 400)
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Company webhook validation error:', error.errors)
      return errorResponse('Invalid company webhook payload', 400)
    }
    throw error
  }
}

async function upsertJob(jobData: z.infer<typeof jobWebhookSchema>['data'], eventType: string) {
  try {
    const jobRecord = {
      frappe_job_id: jobData.job_id,
      title: jobData.title,
      company: jobData.company,
      company_logo: jobData.company_logo,
      description: jobData.description,
      requirements: jobData.requirements || [],
      benefits: jobData.benefits || [],
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      location: jobData.location,
      job_type: jobData.job_type,
      experience_level: jobData.experience_level,
      skills_required: jobData.skills_required || [],
      application_deadline: jobData.application_deadline,
      is_active: jobData.is_active,
      frappe_created_at: jobData.created_at,
      frappe_updated_at: jobData.updated_at,
      synced_at: new Date().toISOString(),
    }

    // Check if job already exists
    const { data: existingJob } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('frappe_job_id', jobData.job_id)
      .single()

    if (existingJob) {
      // Update existing job
      const { data: updatedJob, error } = await supabaseAdmin
        .from('jobs')
        .update({
          ...jobRecord,
          updated_at: new Date().toISOString(),
        })
        .eq('frappe_job_id', jobData.job_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update job: ${error.message}`)
      }

      console.log(`Job ${jobData.job_id} updated via webhook`)
      return successResponse({ job: updatedJob }, 'Job updated successfully')

    } else {
      // Create new job
      const { data: newJob, error } = await supabaseAdmin
        .from('jobs')
        .insert(jobRecord)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create job: ${error.message}`)
      }

      console.log(`Job ${jobData.job_id} created via webhook`)
      return successResponse({ job: newJob }, 'Job created successfully')
    }

  } catch (error) {
    console.error('Upsert job error:', error)
    throw error
  }
}

async function deleteJob(jobId: string) {
  try {
    // Soft delete by setting is_active to false
    const { data: deletedJob, error } = await supabaseAdmin
      .from('jobs')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('frappe_job_id', jobId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(`Job ${jobId} not found`, 404)
      }
      throw new Error(`Failed to delete job: ${error.message}`)
    }

    console.log(`Job ${jobId} deleted via webhook`)
    return successResponse({ job: deletedJob }, 'Job deleted successfully')

  } catch (error) {
    console.error('Delete job error:', error)
    throw error
  }
}

async function upsertApplication(appData: z.infer<typeof applicationWebhookSchema>['data'], eventType: string) {
  try {
    // Find the candidate by email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', appData.candidate_email)
      .single()

    if (!profile) {
      console.warn(`Candidate with email ${appData.candidate_email} not found`)
      return errorResponse(`Candidate not found: ${appData.candidate_email}`, 404)
    }

    // Find the job by Frappe job ID
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('frappe_job_id', appData.job_id)
      .single()

    if (!job) {
      console.warn(`Job with Frappe ID ${appData.job_id} not found`)
      return errorResponse(`Job not found: ${appData.job_id}`, 404)
    }

    const applicationRecord = {
      frappe_application_id: appData.application_id,
      job_id: job.id,
      candidate_id: profile.id,
      status: appData.status,
      cover_letter: appData.cover_letter,
      resume_url: appData.resume_url,
      notes: appData.notes,
      rejection_reason: appData.rejection_reason,
      frappe_applied_at: appData.applied_at,
      frappe_updated_at: appData.updated_at,
      synced_at: new Date().toISOString(),
    }

    // Check if application already exists
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('frappe_application_id', appData.application_id)
      .single()

    if (existingApp) {
      // Update existing application
      const { data: updatedApp, error } = await supabaseAdmin
        .from('applications')
        .update({
          ...applicationRecord,
          updated_at: new Date().toISOString(),
        })
        .eq('frappe_application_id', appData.application_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`)
      }

      console.log(`Application ${appData.application_id} updated via webhook`)
      return successResponse({ application: updatedApp }, 'Application updated successfully')

    } else {
      // Create new application
      const { data: newApp, error } = await supabaseAdmin
        .from('applications')
        .insert({
          ...applicationRecord,
          applied_at: appData.applied_at,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create application: ${error.message}`)
      }

      console.log(`Application ${appData.application_id} created via webhook`)
      return successResponse({ application: newApp }, 'Application created successfully')
    }

  } catch (error) {
    console.error('Upsert application error:', error)
    throw error
  }
}

async function deleteApplication(applicationId: string) {
  try {
    // Hard delete application
    const { data: deletedApp, error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('frappe_application_id', applicationId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(`Application ${applicationId} not found`, 404)
      }
      throw new Error(`Failed to delete application: ${error.message}`)
    }

    console.log(`Application ${applicationId} deleted via webhook`)
    return successResponse({ application: deletedApp }, 'Application deleted successfully')

  } catch (error) {
    console.error('Delete application error:', error)
    throw error
  }
}

async function upsertCompany(companyData: z.infer<typeof companyWebhookSchema>['data'], eventType: string) {
  try {
    const companyRecord = {
      frappe_company_id: companyData.company_id,
      name: companyData.name,
      description: companyData.description,
      website: companyData.website,
      logo_url: companyData.logo_url,
      location: companyData.location,
      industry: companyData.industry,
      size: companyData.size,
      frappe_created_at: companyData.created_at,
      frappe_updated_at: companyData.updated_at,
      synced_at: new Date().toISOString(),
    }

    // Check if company already exists
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('frappe_company_id', companyData.company_id)
      .single()

    if (existingCompany) {
      // Update existing company
      const { data: updatedCompany, error } = await supabaseAdmin
        .from('companies')
        .update({
          ...companyRecord,
          updated_at: new Date().toISOString(),
        })
        .eq('frappe_company_id', companyData.company_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update company: ${error.message}`)
      }

      console.log(`Company ${companyData.company_id} updated via webhook`)
      return successResponse({ company: updatedCompany }, 'Company updated successfully')

    } else {
      // Create new company
      const { data: newCompany, error } = await supabaseAdmin
        .from('companies')
        .insert(companyRecord)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create company: ${error.message}`)
      }

      console.log(`Company ${companyData.company_id} created via webhook`)
      return successResponse({ company: newCompany }, 'Company created successfully')
    }

  } catch (error) {
    console.error('Upsert company error:', error)
    throw error
  }
}

async function deleteCompany(companyId: string) {
  try {
    // Soft delete by setting is_active to false
    const { data: deletedCompany, error } = await supabaseAdmin
      .from('companies')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('frappe_company_id', companyId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(`Company ${companyId} not found`, 404)
      }
      throw new Error(`Failed to delete company: ${error.message}`)
    }

    console.log(`Company ${companyId} deleted via webhook`)
    return successResponse({ company: deletedCompany }, 'Company deleted successfully')

  } catch (error) {
    console.error('Delete company error:', error)
    throw error
  }
}

// Health check endpoint for webhooks
export async function GET() {
  return successResponse(
    {
      status: 'healthy',
      webhook_endpoint: 'active',
      supported_resources: ['job', 'application', 'company'],
      supported_events: ['created', 'updated', 'deleted']
    },
    'Webhook endpoint is healthy'
  )
}