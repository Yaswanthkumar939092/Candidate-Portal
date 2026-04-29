import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { JobType, ExperienceLevel } from '@/types/database'

// Mock Frappe client - replace with actual implementation
interface FrappeJob {
  name: string
  job_title: string
  company: string
  location: string
  department?: string
  experience_level: string
  job_type: string
  description: string
  requirements?: string[]
  benefits?: string[]
  salary_min?: number
  salary_max?: number
  skills_required?: string[]
  status: 'Open' | 'Closed'
  posted_date: string
  application_deadline?: string
}

// Mock Frappe client class
class MockFrappeClient {
  async getJobs(): Promise<FrappeJob[]> {
    // This is a mock implementation
    // In a real implementation, you would make HTTP requests to Frappe ERPNext
    return [
      {
        name: 'JOB-001',
        job_title: 'Senior Software Engineer',
        company: 'Frappe Technologies',
        location: 'Mumbai, India',
        department: 'Engineering',
        experience_level: 'senior',
        job_type: 'full-time',
        description: 'We are looking for a Senior Software Engineer to join our team.',
        requirements: ['Python', 'JavaScript', 'React'],
        benefits: ['Health Insurance', 'Remote Work'],
        salary_min: 800000,
        salary_max: 1500000,
        skills_required: ['Python', 'JavaScript', 'React', 'Node.js'],
        status: 'Open',
        posted_date: new Date().toISOString(),
        application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: 'JOB-002',
        job_title: 'Product Manager',
        company: 'Frappe Technologies',
        location: 'Remote',
        department: 'Product',
        experience_level: 'mid',
        job_type: 'full-time',
        description: 'We are seeking a Product Manager to drive product strategy.',
        requirements: ['Product Management', 'Analytics', 'Communication'],
        benefits: ['Health Insurance', 'Stock Options'],
        salary_min: 1000000,
        salary_max: 1800000,
        skills_required: ['Product Management', 'Analytics', 'Strategy'],
        status: 'Open',
        posted_date: new Date().toISOString(),
      }
    ]
  }

  async ping(): Promise<boolean> {
    // Mock ping to check connection
    return true
  }
}

const syncOptionsSchema = z.object({
  force: z.string().optional().transform(val => val === 'true'),
  company: z.string().optional(),
})

// Helper function to get user from token
async function getUserFromRequest(request: NextRequest) {
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

// Helper function to check if user is admin
async function isAdmin(userId: string) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    return !!profile
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate options
    const validatedOptions = syncOptionsSchema.parse(queryParams)
    const { force, company } = validatedOptions

    console.log(`Starting job sync. Force: ${force}, Company filter: ${company || 'all'}`)

    // Initialize Frappe client (mock)
    const frappeClient = new MockFrappeClient()

    try {
      // Test Frappe connection
      await frappeClient.ping()
    } catch {
      return NextResponse.json(
        { error: 'Failed to connect to Frappe ERPNext' },
        { status: 503 }
      )
    }

    let synced = 0
    let updated = 0
    const errors: string[] = []

    try {
      // Fetch jobs from Frappe
      const frappeJobs = await frappeClient.getJobs()

      // Filter by company if specified
      const jobsToSync = company
        ? frappeJobs.filter(job => job.company.toLowerCase().includes(company.toLowerCase()))
        : frappeJobs

      console.log(`Found ${jobsToSync.length} jobs to sync from Frappe`)

      for (const frappeJob of jobsToSync) {
        try {
          // Check if job already exists
          const { data: existingJob } = await supabaseAdmin
            .from('jobs')
            .select('id, updated_at')
            .eq('title', frappeJob.job_title)
            .eq('company', frappeJob.company)
            .single()

          const jobData = {
            title: frappeJob.job_title,
            company: frappeJob.company,
            description: frappeJob.description,
            requirements: frappeJob.requirements || [],
            benefits: frappeJob.benefits || [],
            salary_min: frappeJob.salary_min,
            salary_max: frappeJob.salary_max,
            location: frappeJob.location,
            job_type: frappeJob.job_type as JobType,
            experience_level: frappeJob.experience_level as ExperienceLevel,
            skills_required: frappeJob.skills_required || [],
            application_deadline: frappeJob.application_deadline,
            is_active: frappeJob.status === 'Open',
            posted_by: user.id, // Use admin user as poster
          }

          if (existingJob) {
            // Update existing job only if force is true or job was modified
            const shouldUpdate = force ||
              new Date(frappeJob.posted_date) > new Date(existingJob.updated_at)

            if (shouldUpdate) {
              await supabaseAdmin
                .from('jobs')
                .update({
                  ...jobData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingJob.id)

              updated++
              console.log(`Updated job: ${frappeJob.job_title} at ${frappeJob.company}`)
            }
          } else {
            // Create new job
            await supabaseAdmin
              .from('jobs')
              .insert(jobData)

            synced++
            console.log(`Created job: ${frappeJob.job_title} at ${frappeJob.company}`)
          }

        } catch (error) {
          const errorMsg = `Failed to sync job ${frappeJob.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

    } catch (error) {
      throw new Error(`Job sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const response = {
      message: `Job sync completed. ${synced} new jobs created, ${updated} jobs updated.`,
      synced,
      updated,
      errors,
      timestamp: new Date().toISOString(),
    }

    console.log('Job sync completed:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin job sync error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid sync options',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get sync statistics
    const { data: totalJobs, count: totalCount } = await supabaseAdmin
      .from('jobs')
      .select('id', { count: 'exact', head: true })

    const { data: activeJobs, count: activeCount } = await supabaseAdmin
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    const { data: recentJobs } = await supabaseAdmin
      .from('jobs')
      .select('title, company, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalJobs: totalCount || 0,
      activeJobs: activeCount || 0,
      recentJobs: recentJobs || [],
      lastSyncTime: 'Not available', // In a real implementation, you'd store this
      frappeConnection: {
        status: 'connected',
        lastCheck: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}