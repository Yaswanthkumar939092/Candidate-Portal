import { supabaseAdmin } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// SSO Provider Strategy interface
// ---------------------------------------------------------------------------

export interface SSOProviderStrategy {
  generateAuthUrl(state: string, redirectUri: string): string
  handleCallback(params: Record<string, string>): Promise<SSOCallbackResult>
}

export interface SSOCallbackResult {
  email: string
  name: string
  provider: string
  isNewUser: boolean
  userId?: string
}

// ---------------------------------------------------------------------------
// Frappe SSO Provider
// ---------------------------------------------------------------------------

export class FrappeSSOProvider implements SSOProviderStrategy {
  constructor(
    private frappeUrl: string,
    private clientId: string,
    private clientSecret: string,
  ) {}

  generateAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    })
    return `${this.frappeUrl}/api/method/frappe.integrations.oauth2.authorize?${params}`
  }

  async handleCallback(params: Record<string, string>): Promise<SSOCallbackResult> {
    const { code } = params
    if (!code) throw new Error('Authorization code missing')

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `${this.frappeUrl}/api/method/frappe.integrations.oauth2.get_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      },
    )

    if (!tokenResponse.ok) throw new Error('Token exchange failed')
    const tokenData = await tokenResponse.json()

    // Fetch user info
    const userInfoResponse = await fetch(
      `${this.frappeUrl}/api/method/frappe.integrations.oauth2.openid_profile`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    )

    if (!userInfoResponse.ok) throw new Error('Failed to get user info')
    const userInfo = await userInfoResponse.json()

    return {
      email: userInfo.email,
      name:
        userInfo.name ||
        `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim(),
      provider: 'frappe_sso',
      isNewUser: false, // Determined downstream
    }
  }
}

// ---------------------------------------------------------------------------
// SSO Service (manages providers, user creation / linking)
// ---------------------------------------------------------------------------

export class SSOService {
  /**
   * Build a strategy instance for the given provider record.
   */
  async getProvider(
    providerId: string,
  ): Promise<{ strategy: SSOProviderStrategy; config: Record<string, unknown> } | null> {
    const { data: provider } = await supabaseAdmin
      .from('sso_providers')
      .select('*')
      .eq('id', providerId)
      .eq('is_enabled', true)
      .single()

    if (!provider) return null

    if (provider.provider_type === 'frappe_sso') {
      const cfg = provider.config as Record<string, string>
      const strategy = new FrappeSSOProvider(
        cfg.frappe_url,
        cfg.client_id,
        cfg.client_secret,
      )
      return { strategy, config: provider as unknown as Record<string, unknown> }
    }

    throw new Error(`Unsupported SSO provider type: ${provider.provider_type}`)
  }

  /**
   * List all SSO providers (admin view).
   */
  async listProviders() {
    const { data } = await supabaseAdmin
      .from('sso_providers')
      .select('id, provider_type, name, is_enabled')
      .order('name')

    return data || []
  }

  /**
   * After a successful SSO callback, find or create the matching Supabase
   * user and profile.
   */
  async createOrLinkUser(
    result: SSOCallbackResult,
  ): Promise<{ userId: string; isNewUser: boolean }> {
    // Check for an existing user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === result.email,
    )

    if (existingUser) {
      return { userId: existingUser.id, isNewUser: false }
    }

    // Create new Supabase user
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: result.email,
      email_confirm: true,
      user_metadata: { full_name: result.name, sso_provider: result.provider },
    })

    if (error) throw new Error(`Failed to create user: ${error.message}`)

    // Seed a profile row
    await supabaseAdmin.from('profiles').insert({
      id: newUser.user.id,
      email: result.email,
      full_name: result.name,
      lifecycle_stage: 'candidate',
    })

    return { userId: newUser.user.id, isNewUser: true }
  }

  /**
   * Validate an email against the provider's domain restriction list.
   * Returns `true` when the domain is allowed (or no restriction exists).
   */
  async validateEmailDomain(
    email: string,
    providerId: string,
  ): Promise<boolean> {
    const { data: provider } = await supabaseAdmin
      .from('sso_providers')
      .select('email_domain_restriction')
      .eq('id', providerId)
      .single()

    if (
      !provider?.email_domain_restriction ||
      provider.email_domain_restriction.length === 0
    ) {
      return true
    }

    const domain = email.split('@')[1]
    return provider.email_domain_restriction.includes(domain)
  }
}

export const ssoService = new SSOService()
