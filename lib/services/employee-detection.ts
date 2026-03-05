import { supabaseAdmin } from '@/lib/supabase-admin'
import { frappeEnvManager } from '@/lib/services/frappe-env'

export interface DetectionResult {
  is_internal: boolean
  method?: string
  company_name?: string
}

/**
 * Detects whether a user is an internal employee via domain matching
 * or Frappe Employee lookup, and can update the profile accordingly.
 */
export class InternalEmployeeDetector {
  /**
   * Primary detection: check email domain against the company_domains table.
   */
  async detectByDomain(email: string): Promise<DetectionResult> {
    const domain = email.split('@')[1]
    if (!domain) return { is_internal: false }

    const { data } = await supabaseAdmin
      .from('company_domains')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()

    if (data) {
      return { is_internal: true, method: 'domain_match', company_name: data.company_name ?? undefined }
    }

    return { is_internal: false }
  }

  /**
   * Secondary detection: look the email up in Frappe's Employee doctype.
   */
  async detectByFrappe(email: string): Promise<DetectionResult> {
    try {
      const client = await frappeEnvManager.getClient()
      const exists = await client.checkEmployeeExists(email)
      if (exists) return { is_internal: true, method: 'frappe_lookup' }
    } catch {
      /* Frappe unavailable -- skip silently */
    }
    return { is_internal: false }
  }

  /**
   * Combined detection: tries domain first (fast, local) then falls back
   * to Frappe (slower, remote).
   */
  async detectInternal(email: string): Promise<DetectionResult> {
    const domainResult = await this.detectByDomain(email)
    if (domainResult.is_internal) return domainResult

    return this.detectByFrappe(email)
  }

  /**
   * Convenience method: detect + persist the result on the user's profile.
   */
  async updateUserInternalStatus(userId: string, email: string): Promise<void> {
    const result = await this.detectInternal(email)

    await supabaseAdmin.from('profiles').update({
      is_internal_employee: result.is_internal,
      email_domain: email.split('@')[1],
    }).eq('id', userId)
  }
}

export const employeeDetector = new InternalEmployeeDetector()
