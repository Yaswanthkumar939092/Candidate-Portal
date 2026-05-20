import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { ssoService } from '@/lib/services/sso'
import { errorResponse } from '@/lib/utils/response'

/**
 * GET /api/auth/sso/[provider]
 *
 * Generate an SSO authorization URL and redirect the user.
 * Stores a random state token in a cookie so the callback can verify it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerId } = await params

    const providerData = await ssoService.getProvider(providerId)
    if (!providerData) {
      return errorResponse('SSO provider not found or disabled', 404)
    }

    const state = randomUUID()
    const { origin } = new URL(request.url)
    const redirectUri = `${origin}/api/auth/sso/${providerId}/callback`

    const authUrl = providerData.strategy.generateAuthUrl(state, redirectUri)

    // Store state in a short-lived cookie for CSRF verification
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('sso_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('SSO initiation error:', error)
    return errorResponse('Failed to initiate SSO login')
  }
}
