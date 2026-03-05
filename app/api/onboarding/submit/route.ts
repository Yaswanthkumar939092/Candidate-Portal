import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ONBOARDING_STEPS } from '@/lib/validation/onboarding-schemas'

/**
 * POST /api/onboarding/submit
 *
 * Submit the onboarding data for review.
 * Validates that all required steps have data, then updates:
 * - onboarding_data.status => 'submitted'
 * - onboarding_data.submitted_at => now
 * - onboarding_data.declaration_accepted => true
 * - profiles.lifecycle_stage => 'onboarding'
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch the current onboarding record
    const { data: onboardingData, error: fetchError } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !onboardingData) {
      return NextResponse.json(
        { error: 'Onboarding data not found. Please save your progress first.' },
        { status: 404 }
      )
    }

    // Verify that all required steps (1-7) have data
    const requiredSteps = ONBOARDING_STEPS.slice(0, 7) // exclude the review step itself
    const missingSteps: string[] = []

    for (const step of requiredSteps) {
      const stepValue = onboardingData[step.key as keyof typeof onboardingData]
      if (!stepValue || (typeof stepValue === 'object' && Object.keys(stepValue as object).length === 0)) {
        missingSteps.push(step.label)
      }
    }

    if (missingSteps.length > 0) {
      return NextResponse.json(
        {
          error: `The following steps are incomplete: ${missingSteps.join(', ')}`,
          missing_steps: missingSteps,
        },
        { status: 400 }
      )
    }

    // Update onboarding status to 'submitted'
    const { error: updateError } = await supabaseAdmin
      .from('onboarding_data')
      .update({
        status: 'submitted',
        declaration_accepted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error submitting onboarding:', updateError)
      return NextResponse.json({ error: 'Failed to submit onboarding data' }, { status: 500 })
    }

    // Update the user's lifecycle stage to 'onboarding'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        lifecycle_stage: 'onboarding',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile lifecycle stage:', profileError)
      // Don't fail the submission over this; the onboarding data is already saved
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding submitted successfully',
    })
  } catch (error) {
    console.error('POST /api/onboarding/submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
