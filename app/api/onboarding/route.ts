import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ONBOARDING_STEPS } from '@/lib/validation/onboarding-schemas'
import type { OnboardingDataInsert } from '@/types/database'

/**
 * GET /api/onboarding
 *
 * Fetch the current user's onboarding data.
 * Returns the full onboarding_data row or default empty values.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching onboarding data:', error)
      return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 })
    }

    // If no existing record, return default empty structure
    if (!data) {
      const defaults: Record<string, unknown> = {
        user_id: user.id,
        current_step: 0,
        completed_steps: [],
        status: 'draft',
        declaration_accepted: false,
      }
      for (const step of ONBOARDING_STEPS) {
        defaults[step.key] = {}
      }
      return NextResponse.json({ data: defaults })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/onboarding
 *
 * Save / update onboarding data for the current user.
 * Accepts partial step data in the request body and upserts into the
 * onboarding_data table.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()

    // Build the upsert payload with proper typing
    const payload: OnboardingDataInsert = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }

    // Map step data from the body into the payload
    const stepKeys = ONBOARDING_STEPS.map((s) => s.key) as Array<keyof OnboardingDataInsert>
    for (const key of stepKeys) {
      if (body[key] !== undefined) {
         
        ;(payload as any)[key] = body[key]
      }
    }

    // Metadata fields
    if (typeof body.current_step === 'number') {
      payload.current_step = body.current_step
    }
    if (Array.isArray(body.completed_steps)) {
      payload.completed_steps = body.completed_steps
    }

    // Upsert: insert if missing, update if exists (unique on user_id)
    const { data, error } = await supabaseAdmin
      .from('onboarding_data')
      .upsert(payload as OnboardingDataInsert, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error upserting onboarding data:', error)
      return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('PUT /api/onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
