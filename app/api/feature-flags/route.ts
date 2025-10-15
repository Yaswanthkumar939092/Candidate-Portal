import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Helper function to get user from token (optional for public endpoint)
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

// Helper function to evaluate feature flag for user
function evaluateFeatureFlagForUser(
  flag: any,
  userId: string | null,
  userOverride: any | null
): any {
  // If user has an override, use that value
  if (userOverride) {
    return userOverride.value
  }

  // If flag is disabled globally, return false/default
  if (!flag.is_enabled) {
    return flag.value_type === 'boolean' ? false : null
  }

  // For rollout percentage, use a simple hash-based approach
  if (flag.rollout_percentage < 100 && userId) {
    // Simple hash function to determine if user is in rollout
    let hash = 0
    const str = userId + flag.key
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    const percentage = Math.abs(hash) % 100

    if (percentage >= flag.rollout_percentage) {
      return flag.value_type === 'boolean' ? false : null
    }
  }

  // Return the default value
  return flag.default_value
}

// GET /api/feature-flags - Get feature flags for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const keys = searchParams.get('keys')?.split(',')

    // Get enabled feature flags
    let query = supabaseAdmin
      .from('feature_flags')
      .select('*')
      .eq('is_enabled', true)

    // If specific keys are requested, filter by them
    if (keys && keys.length > 0) {
      query = query.in('key', keys)
    }

    const { data: featureFlags, error } = await query

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      )
    }

    // Get user overrides if user is authenticated
    let userOverrides: any[] = []
    if (user && featureFlags?.length) {
      const flagIds = featureFlags.map(flag => flag.id)
      const { data: overrides } = await supabaseAdmin
        .from('feature_flag_overrides')
        .select('*')
        .eq('user_id', user.id)
        .in('feature_flag_id', flagIds)

      userOverrides = overrides || []
    }

    // Create a map of overrides for quick lookup
    const overrideMap = new Map()
    userOverrides.forEach(override => {
      overrideMap.set(override.feature_flag_id, override)
    })

    // Evaluate each feature flag for the user
    const evaluatedFlags: Record<string, any> = {}

    if (featureFlags) {
      featureFlags.forEach(flag => {
        const override = overrideMap.get(flag.id)
        const value = evaluateFeatureFlagForUser(flag, user?.id || null, override)
        evaluatedFlags[flag.key] = value
      })
    }

    return NextResponse.json({
      flags: evaluatedFlags,
      success: true
    })

  } catch (error) {
    console.error('Feature flags GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/feature-flags/evaluate - Evaluate specific flags for user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    const body = await request.json()
    const { keys } = body

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: 'Keys array is required' },
        { status: 400 }
      )
    }

    // Get requested feature flags
    const { data: featureFlags, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .in('key', keys)

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      )
    }

    // Get user overrides if user is authenticated
    let userOverrides: any[] = []
    if (user && featureFlags?.length) {
      const flagIds = featureFlags.map(flag => flag.id)
      const { data: overrides } = await supabaseAdmin
        .from('feature_flag_overrides')
        .select('*')
        .eq('user_id', user.id)
        .in('feature_flag_id', flagIds)

      userOverrides = overrides || []
    }

    // Create a map of overrides for quick lookup
    const overrideMap = new Map()
    userOverrides.forEach(override => {
      overrideMap.set(override.feature_flag_id, override)
    })

    // Evaluate each feature flag for the user
    const evaluatedFlags: Record<string, any> = {}

    if (featureFlags) {
      featureFlags.forEach(flag => {
        const override = overrideMap.get(flag.id)
        const value = evaluateFeatureFlagForUser(flag, user?.id || null, override)
        evaluatedFlags[flag.key] = value
      })
    }

    // For keys that don't exist, return default false
    keys.forEach(key => {
      if (!(key in evaluatedFlags)) {
        evaluatedFlags[key] = false
      }
    })

    return NextResponse.json({
      flags: evaluatedFlags,
      success: true
    })

  } catch (error) {
    console.error('Feature flags POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}