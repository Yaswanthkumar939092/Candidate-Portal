import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('supabase-access-token')?.value

    if (accessToken) {
      try {
        // Revoke the session server-side
        await supabaseAdmin.auth.admin.signOut(accessToken)
      } catch (error) {
        console.error('Error revoking session:', error)
        // Continue with logout even if session revocation fails
      }
    }

    // Create response
    const response = NextResponse.json({
      message: 'Sign out successful'
    })

    // Clear auth cookies
    response.cookies.delete('supabase-access-token')
    response.cookies.delete('supabase-refresh-token')

    return response

  } catch (error) {
    console.error('Sign out error:', error)

    // Even if there's an error, clear the cookies
    const response = NextResponse.json({
      message: 'Sign out completed'
    })

    response.cookies.delete('supabase-access-token')
    response.cookies.delete('supabase-refresh-token')

    return response
  }
}