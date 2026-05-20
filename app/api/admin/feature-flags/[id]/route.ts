import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { FeatureFlagUpdate } from '@/types/database'

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

// GET /api/admin/feature-flags/[id] - Get a specific feature flag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const { data: featureFlag, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching feature flag:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      featureFlag,
      success: true
    })

  } catch (error) {
    console.error('Feature flag GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/feature-flags/[id] - Update a specific feature flag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const body = await request.json()
    const updateData: FeatureFlagUpdate = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // Remove fields that shouldn't be updated
    delete updateData.id
    delete updateData.created_at
    delete updateData.created_by

    const { data: featureFlag, error } = await supabaseAdmin
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        )
      }
      console.error('Error updating feature flag:', error)
      return NextResponse.json(
        { error: 'Failed to update feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      featureFlag,
      success: true
    })

  } catch (error) {
    console.error('Feature flag PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/feature-flags/[id] - Delete a specific feature flag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const { error } = await supabaseAdmin
      .from('feature_flags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feature flag:', error)
      return NextResponse.json(
        { error: 'Failed to delete feature flag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Feature flag deleted successfully'
    })

  } catch (error) {
    console.error('Feature flag DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}