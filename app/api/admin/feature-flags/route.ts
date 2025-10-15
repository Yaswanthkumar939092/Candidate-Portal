import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { FeatureFlag, FeatureFlagInsert, FeatureFlagUpdate } from '@/types/database'

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
      .select('role')
      .eq('id', userId)
      .single()

    return profile?.role === 'admin' || profile?.role === 'super_admin'
  } catch {
    return false
  }
}

// GET /api/admin/feature-flags - Get all feature flags
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

    // Get all feature flags
    const { data: featureFlags, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching feature flags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      featureFlags: featureFlags || [],
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

// POST /api/admin/feature-flags - Create a new feature flag
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

    const body = await request.json()
    const { key, name, description, is_enabled, default_value, value_type, tags, environments, rollout_percentage } = body

    // Validate required fields
    if (!key || !name) {
      return NextResponse.json(
        { error: 'Key and name are required' },
        { status: 400 }
      )
    }

    // Check if feature flag key already exists
    const { data: existingFlag } = await supabaseAdmin
      .from('feature_flags')
      .select('id')
      .eq('key', key)
      .single()

    if (existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag with this key already exists' },
        { status: 409 }
      )
    }

    const newFeatureFlag: FeatureFlagInsert = {
      key,
      name,
      description: description || null,
      is_enabled: is_enabled ?? false,
      default_value: default_value ?? false,
      value_type: value_type || 'boolean',
      tags: tags || [],
      environments: environments || ['production', 'staging', 'development'],
      rollout_percentage: rollout_percentage ?? 100,
      created_by: user.id
    }

    const { data: featureFlag, error } = await supabaseAdmin
      .from('feature_flags')
      .insert(newFeatureFlag)
      .select()
      .single()

    if (error) {
      console.error('Error creating feature flag:', error)
      return NextResponse.json(
        { error: 'Failed to create feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      featureFlag,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error('Feature flags POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/feature-flags - Update multiple feature flags
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    const updatedFlags = []

    // Update each feature flag
    for (const update of updates) {
      const { id, ...updateData } = update

      if (!id) {
        continue
      }

      const { data: updatedFlag, error } = await supabaseAdmin
        .from('feature_flags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error(`Error updating feature flag ${id}:`, error)
        continue
      }

      updatedFlags.push(updatedFlag)
    }

    return NextResponse.json({
      updatedFlags,
      success: true
    })

  } catch (error) {
    console.error('Feature flags PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}