import { supabaseAdmin } from '@/lib/supabase-admin'
import { FrappeEnvironment } from '@/types/database'

// ---------- FrappeClient ----------

export interface FrappeRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
  params?: Record<string, string>
  timeout?: number
}

export interface FrappeConfig {
  frappe_url: string
  api_key: string | null
  api_secret: string | null
  username: string | null
  password: string | null
  environment_key: string
}

export class FrappeClient {
  private config: FrappeConfig
  private authToken: string | null = null

  constructor(config: FrappeConfig) {
    this.config = config
  }

  private getBaseUrl(): string {
    return this.config.frappe_url.replace(/\/$/, '')
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (this.config.api_key && this.config.api_secret) {
      headers['Authorization'] = `token ${this.config.api_key}:${this.config.api_secret}`
    } else if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    } else if (this.config.username && this.config.password) {
      // Login with username/password to get session
      await this.loginWithCredentials()
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }
    }

    return headers
  }

  private async loginWithCredentials(): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/api/method/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usr: this.config.username,
        pwd: this.config.password,
      }),
    })

    if (!response.ok) {
      throw new Error(`Frappe login failed: ${response.status} ${response.statusText}`)
    }

    const cookies = response.headers.get('set-cookie')
    if (cookies) {
      const sidMatch = cookies.match(/sid=([^;]+)/)
      if (sidMatch) {
        this.authToken = sidMatch[1]
      }
    }
  }

  async request<T = unknown>(endpoint: string, options: FrappeRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params, timeout = 30000 } = options
    const url = new URL(`${this.getBaseUrl()}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const headers = await this.getAuthHeaders()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (response.status === 401 || response.status === 403) {
        throw new FrappeAuthError(`Authentication failed: ${response.status}`)
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new FrappeApiError(
          `Frappe API error: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        )
      }

      return await response.json() as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.request('/api/method/frappe.client.get_count', {
        params: { doctype: 'DocType' },
        timeout: 10000,
      })
      return true
    } catch {
      return false
    }
  }

  async getJobOpenings(filters?: Record<string, unknown>): Promise<FrappeJobOpening[]> {
    const params: Record<string, string> = {
      fields: JSON.stringify(['name', 'job_title', 'company', 'description', 'status', 'designation', 'location', 'publish']),
      filters: JSON.stringify(filters || { status: 'Open' }),
      limit_page_length: '0',
    }

    const result = await this.request<{ data: FrappeJobOpening[] }>(
      '/api/resource/Job Opening',
      { params }
    )
    return result.data || []
  }

  async createJobApplicant(data: {
    applicant_name: string
    email_id: string
    job_title: string
    resume_link?: string
    cover_letter?: string
  }): Promise<{ data: { name: string; status: string } }> {
    return this.request('/api/resource/Job Applicant', {
      method: 'POST',
      body: data,
    })
  }

  async createUser(data: {
    email: string
    first_name: string
    last_name?: string
    send_welcome_email?: boolean
  }): Promise<{ data: { name: string } }> {
    return this.request('/api/resource/User', {
      method: 'POST',
      body: {
        ...data,
        send_welcome_email: data.send_welcome_email ?? false,
        enabled: 1,
      },
    })
  }

  async createEmployee(data: {
    employee_name: string
    first_name: string
    last_name?: string
    company: string
    date_of_birth?: string
    date_of_joining?: string
    gender?: string
    user_id?: string
    personal_email?: string
    cell_phone?: string
  }): Promise<{ data: { name: string } }> {
    return this.request('/api/resource/Employee', {
      method: 'POST',
      body: data,
    })
  }

  async checkEmployeeExists(email: string): Promise<boolean> {
    try {
      const result = await this.request<{ data: unknown[] }>('/api/resource/Employee', {
        params: {
          filters: JSON.stringify({ user_id: email }),
          fields: JSON.stringify(['name']),
          limit_page_length: '1',
        },
      })
      return (result.data?.length ?? 0) > 0
    } catch {
      return false
    }
  }
}

// ---------- Error classes ----------

export class FrappeAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FrappeAuthError'
  }
}

export class FrappeApiError extends Error {
  status: number
  responseBody: string

  constructor(message: string, status: number, responseBody: string) {
    super(message)
    this.name = 'FrappeApiError'
    this.status = status
    this.responseBody = responseBody
  }
}

// ---------- Frappe types ----------

export interface FrappeJobOpening {
  name: string
  job_title: string
  company: string
  description: string
  status: string
  designation?: string
  location?: string
  publish?: boolean
}

// ---------- FrappeEnvironmentManager ----------

interface CachedConfig {
  config: FrappeConfig
  fetchedAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export class FrappeEnvironmentManager {
  private cache: CachedConfig | null = null

  async getActiveConfig(): Promise<FrappeConfig> {
    // Check cache
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.config
    }

    // Try DB first
    const { data, error } = await supabaseAdmin
      .from('frappe_environments')
      .select('*')
      .eq('is_active', true)
      .single()

    if (data && !error) {
      const config: FrappeConfig = {
        frappe_url: data.frappe_url,
        api_key: data.api_key,
        api_secret: data.api_secret,
        username: data.username,
        password: data.password,
        environment_key: data.environment_key,
      }
      this.cache = { config, fetchedAt: Date.now() }
      return config
    }

    // Fallback to .env.local
    return this.getEnvFallback()
  }

  private getEnvFallback(): FrappeConfig {
    const frappe_url = process.env.FRAPPE_BASE_URL
    if (!frappe_url) {
      throw new Error('FRAPPE_BASE_URL is required in .env.local')
    }

    const config: FrappeConfig = {
      frappe_url,
      api_key: process.env.FRAPPE_API_KEY || null,
      api_secret: process.env.FRAPPE_API_SECRET || null,
      username: process.env.FRAPPE_USERNAME || null,
      password: process.env.FRAPPE_PASSWORD || null,
      environment_key: 'LOCAL',
    }

    this.cache = { config, fetchedAt: Date.now() }
    return config
  }

  async getClient(): Promise<FrappeClient> {
    const config = await this.getActiveConfig()
    return new FrappeClient(config)
  }

  async switchEnvironment(envKey: string): Promise<void> {
    // Verify environment exists
    const { data: target, error: findError } = await supabaseAdmin
      .from('frappe_environments')
      .select('id')
      .eq('environment_key', envKey as 'LOCAL' | 'DEV' | 'UAT' | 'PROD')
      .single()

    if (findError || !target) {
      throw new Error(`Environment '${envKey}' not found`)
    }

    // Deactivate all
    await supabaseAdmin
      .from('frappe_environments')
      .update({ is_active: false })
      .neq('id', '')

    // Activate target
    const { error: activateError } = await supabaseAdmin
      .from('frappe_environments')
      .update({ is_active: true })
      .eq('id', target.id)

    if (activateError) {
      throw new Error(`Failed to activate environment: ${activateError.message}`)
    }

    this.invalidateCache()
  }

  invalidateCache(): void {
    this.cache = null
  }

  async testConnection(envId: string): Promise<{ success: boolean; response_time_ms?: number; error?: string }> {
    const { data: env, error } = await supabaseAdmin
      .from('frappe_environments')
      .select('*')
      .eq('id', envId)
      .single()

    if (error || !env) {
      return { success: false, error: 'Environment not found' }
    }

    const client = new FrappeClient({
      frappe_url: env.frappe_url,
      api_key: env.api_key,
      api_secret: env.api_secret,
      username: env.username,
      password: env.password,
      environment_key: env.environment_key,
    })

    const startTime = Date.now()
    try {
      const success = await client.ping()
      const response_time_ms = Date.now() - startTime

      // Update last test result in DB
      await supabaseAdmin
        .from('frappe_environments')
        .update({
          last_connection_test_at: new Date().toISOString(),
          last_connection_status: success ? 'connected' : 'failed',
        })
        .eq('id', envId)

      return success
        ? { success: true, response_time_ms }
        : { success: false, error: 'Ping failed' }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed'

      await supabaseAdmin
        .from('frappe_environments')
        .update({
          last_connection_test_at: new Date().toISOString(),
          last_connection_status: 'failed',
        })
        .eq('id', envId)

      return { success: false, error: errorMsg }
    }
  }

  async seedLocalEnv(): Promise<void> {
    // Check if any environments exist
    const { count } = await supabaseAdmin
      .from('frappe_environments')
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) return // Already seeded

    const frappe_url = process.env.FRAPPE_BASE_URL
    if (!frappe_url) return // No env vars to seed from

    await supabaseAdmin.from('frappe_environments').insert({
      environment_key: 'LOCAL' as const,
      label: 'Local Development',
      frappe_url,
      api_key: process.env.FRAPPE_API_KEY || null,
      api_secret: process.env.FRAPPE_API_SECRET || null,
      username: process.env.FRAPPE_USERNAME || null,
      password: process.env.FRAPPE_PASSWORD || null,
      is_active: true,
    })
  }

  async listEnvironments(): Promise<FrappeEnvironment[]> {
    const { data, error } = await supabaseAdmin
      .from('frappe_environments')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to list environments: ${error.message}`)
    return data || []
  }
}

// Singleton instance
export const frappeEnvManager = new FrappeEnvironmentManager()
