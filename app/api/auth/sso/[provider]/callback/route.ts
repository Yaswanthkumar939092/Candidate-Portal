import { NextRequest, NextResponse } from 'next/server'
import { ssoService } from '@/lib/services/sso'
import { employeeDetector } from '@/lib/services/employee-detection'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/auth/sso/[provider]/callback
 *
 * Handle the OAuth callback from an SSO provider.
 *
 * Flow:
 *   1. Verify the state cookie
 *   2. Exchange the authorization code for user info
 *   3. Validate email domain restrictions
 *   4. Create or link the Supabase user
 *   5. Detect internal-employee status
 *   6. Issue a Supabase session and redirect to dashboard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerId } = await params
    const { searchParams, origin } = new URL(request.url)

    // 1. Verify CSRF state
    const state = searchParams.get('state')
    const storedState = request.cookies.get('sso_state')?.value

    if (!state || state !== storedState) {
      return NextResponse.redirect(`${origin}/login?error=invalid_state`)
    }

    // 2. Resolve the provider
    const providerData = await ssoService.getProvider(providerId)
    if (!providerData) {
      return NextResponse.redirect(`${origin}/login?error=provider_not_found`)
    }

    // 3. Exchange code for user information
    const callbackParams = Object.fromEntries(searchParams.entries())
    const result = await providerData.strategy.handleCallback(callbackParams)

    // 4. Validate email domain restriction
    const domainAllowed = await ssoService.validateEmailDomain(result.email, providerId)
    if (!domainAllowed) {
      return NextResponse.redirect(`${origin}/login?error=domain_not_allowed`)
    }

    // 5. Create or link Supabase user
    const { userId, isNewUser } = await ssoService.createOrLinkUser(result)

    // 6. Detect internal employee status
    await employeeDetector.updateUserInternalStatus(userId, result.email)

    // 7. Generate a magic-link session for the user by creating a sign-in
    //    link (acts as a one-time token).
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: result.email,
      })

    if (linkError || !linkData) {
      console.error('Failed to generate session link:', linkError)
      return NextResponse.redirect(`${origin}/login?error=session_failed`)
    }

    // Extract the token hash from the action link
    const actionUrl = new URL(linkData.properties.action_link)
    const tokenHash = actionUrl.searchParams.get('token_hash') || ''
    const type = actionUrl.searchParams.get('type') || 'magiclink'

    // Redirect to the Supabase auth confirm endpoint which will set the session
    const confirmUrl = `${origin}/auth/confirm?token_hash=${tokenHash}&type=${type}&next=${encodeURIComponent(isNewUser ? '/onboarding' : '/dashboard')}`

    const response = NextResponse.redirect(confirmUrl)

    // Clear the state cookie
    response.cookies.delete('sso_state')

    return response
  } catch (error) {
    console.error('SSO callback error:', error)
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/login?error=sso_failed`)
  }
}
