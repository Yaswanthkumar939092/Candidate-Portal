import { supabaseAdmin } from '@/lib/supabase-admin'
import { frappeEnvManager } from '@/lib/services/frappe-env'
import type { OnboardingData, Json } from '@/types/database'

/**
 * Service responsible for managing the candidate-to-employee onboarding
 * lifecycle, including step persistence, review, approval, and Frappe
 * employee creation.
 */
export class OnboardingService {
  /**
   * Fetch the full onboarding record for a user.
   */
  async getOnboardingData(userId: string): Promise<OnboardingData | null> {
    const { data } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    return data
  }

  /**
   * Upsert a single step's data into the onboarding record.
   */
  async saveStep(userId: string, stepKey: string, stepData: Json) {
    const { data, error } = await supabaseAdmin
      .from('onboarding_data')
      .upsert(
        {
          user_id: userId,
          [stepKey]: stepData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Mark the onboarding as submitted for admin review.
   * Validates that all required steps have data before proceeding.
   */
  async submitForReview(userId: string): Promise<void> {
    const data = await this.getOnboardingData(userId)
    if (!data) throw new Error('No onboarding data found')

    const requiredSteps = [
      'personal_info',
      'address',
      'identity_documents',
      'bank_details',
      'emergency_contacts',
      'education',
      'employment_history',
    ] as const

    const missing = requiredSteps.filter(
      (step) => !data[step as keyof typeof data],
    )

    if (missing.length > 0) {
      throw new Error(`Missing required steps: ${missing.join(', ')}`)
    }

    await supabaseAdmin
      .from('onboarding_data')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('user_id', userId)

    await supabaseAdmin
      .from('profiles')
      .update({ lifecycle_stage: 'onboarding' })
      .eq('id', userId)
  }

  /**
   * Admin approves a submitted onboarding record.
   */
  async approveOnboarding(userId: string, adminId: string): Promise<void> {
    await supabaseAdmin
      .from('onboarding_data')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('user_id', userId)
  }

  /**
   * Admin rejects a submitted onboarding record (revert to draft).
   */
  async rejectOnboarding(userId: string): Promise<void> {
    await supabaseAdmin
      .from('onboarding_data')
      .update({ status: 'draft' })
      .eq('user_id', userId)
  }

  /**
   * Push approved onboarding data to Frappe as a User + Employee.
   *
   * Flow:
   *   1. Verify onboarding is approved
   *   2. Create Frappe User (idempotent)
   *   3. Create Frappe Employee
   *   4. Update local records with Frappe IDs
   */
  async createFrappeEmployee(
    userId: string,
    _adminId: string,
  ): Promise<{ frappe_user_id: string; frappe_employee_id: string }> {
    // 1. Get onboarding data & profile
    const onboardingData = await this.getOnboardingData(userId)
    if (!onboardingData || onboardingData.status !== 'approved') {
      throw new Error('Onboarding not approved')
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) throw new Error('Profile not found')

    const client = await frappeEnvManager.getClient()

    // 2. Create Frappe User (skip if already linked)
    let frappeUserId = onboardingData.frappe_user_id
    if (!frappeUserId) {
      try {
        const personalInfo = (onboardingData.personal_info ?? {}) as Record<string, string>
        const userResult = await client.createUser({
          email: profile.email,
          first_name: personalInfo.first_name || profile.full_name?.split(' ')[0] || 'User',
          last_name: personalInfo.last_name,
          send_welcome_email: false,
        })
        frappeUserId = userResult.data.name

        await supabaseAdmin
          .from('onboarding_data')
          .update({ frappe_user_id: frappeUserId })
          .eq('user_id', userId)
      } catch (err) {
        throw new Error(
          `Failed to create Frappe User: ${err instanceof Error ? err.message : 'Unknown error'}`,
        )
      }
    }

    // 3. Create Frappe Employee
    try {
      const personalInfo = (onboardingData.personal_info ?? {}) as Record<string, string>

      const employeeResult = await client.createEmployee({
        employee_name: `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim(),
        first_name: personalInfo.first_name || 'Unknown',
        last_name: personalInfo.last_name,
        company: 'Your Company', // TODO: pull from org settings
        date_of_birth: personalInfo.date_of_birth,
        gender: personalInfo.gender,
        user_id: profile.email,
        personal_email: personalInfo.personal_email,
        cell_phone: personalInfo.phone,
      })

      const frappeEmployeeId = employeeResult.data.name

      // 4. Update all local records
      await supabaseAdmin
        .from('onboarding_data')
        .update({
          status: 'pushed_to_frappe',
          frappe_employee_id: frappeEmployeeId,
          pushed_to_frappe_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      await supabaseAdmin
        .from('profiles')
        .update({
          lifecycle_stage: 'employee',
          frappe_employee_id: frappeEmployeeId,
          is_internal_employee: true,
        })
        .eq('id', userId)

      return { frappe_user_id: frappeUserId!, frappe_employee_id: frappeEmployeeId }
    } catch (err) {
      throw new Error(
        `Failed to create Frappe Employee: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  }
}

export const onboardingService = new OnboardingService()
