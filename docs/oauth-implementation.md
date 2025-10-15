# OAuth Authentication Implementation

This document describes the OAuth authentication implementation for Google and LinkedIn in the candidate portal.

## Overview

The OAuth authentication system allows users to sign in using their Google or LinkedIn accounts instead of creating a new account with email and password.

## Implementation Details

### 1. Environment Variables

The following environment variables need to be configured:

```env
# Public OAuth Configuration (for client-side checks)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your-linkedin-client-id

# Server-side OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### 2. OAuth Functions

New authentication functions added to `/lib/auth.ts`:

- `auth.signInWithGoogle()` - Initiates Google OAuth flow
- `auth.signInWithLinkedIn()` - Initiates LinkedIn OAuth flow
- `auth.signInWithOAuth(provider)` - Generic OAuth function
- `isOAuthProviderEnabled(provider)` - Checks if provider is configured
- `getEnabledOAuthProviders()` - Returns list of enabled providers

### 3. UI Components

#### OAuth Buttons Component (`/components/oauth-buttons.tsx`)
- Displays enabled OAuth providers as buttons
- Shows loading states during authentication
- Handles authentication errors
- Automatically hides when no providers are enabled

#### Updated Auth Form (`/components/auth-form.tsx`)
- Integrates OAuth buttons at the top of the form
- Shows divider between OAuth and email authentication
- Supports both login and registration modes

### 4. OAuth Callback Handling

#### Callback Page (`/app/auth/callback/page.tsx`)
- Handles OAuth redirects from providers
- Creates user profiles for new OAuth users
- Extracts user information from OAuth metadata
- Shows loading, success, and error states
- Redirects to dashboard on successful authentication

### 5. Provider Configuration

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 Client IDs in "Credentials"
5. Set redirect URI: `https://yourdomain.com/auth/callback`
6. Copy Client ID and Client Secret to environment variables

#### LinkedIn OAuth Setup
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create or select an app
3. Add company information and verify company
4. In "Auth" tab, add redirect URL: `https://yourdomain.com/auth/callback`
5. Request access to "Sign In with LinkedIn" product
6. Copy Client ID and Client Secret to environment variables

### 6. Supabase Configuration

The OAuth providers need to be configured in Supabase:

1. Go to Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google and/or LinkedIn providers
4. Configure with your OAuth credentials
5. Set redirect URLs to match your application

### 6. Database Schema Updates

Added `provider` field to profiles table to track authentication method:

```sql
ALTER TABLE profiles ADD COLUMN provider TEXT;
```

### 7. Navigation Integration

Updated navigation component (`/components/navigation.tsx`) to:
- Use the new auth functions
- Handle OAuth user metadata properly
- Display user information from OAuth providers

### 8. Security Considerations

- OAuth credentials are stored securely in environment variables
- Public client IDs are used only for client-side provider checks
- Server-side secrets are never exposed to the client
- User sessions are managed by Supabase authentication

### 9. Error Handling

The implementation includes comprehensive error handling for:
- OAuth provider configuration errors
- Authentication failures
- Network issues
- User cancellation of OAuth flow
- Profile creation errors

### 10. Testing

To test the OAuth implementation:

1. Configure OAuth providers in Supabase dashboard
2. Set up OAuth applications with Google/LinkedIn
3. Update environment variables with real credentials
4. Test the authentication flow in development
5. Verify user profile creation and session management

## File Structure

```
/lib/auth.ts                    - OAuth authentication functions
/components/oauth-buttons.tsx   - OAuth provider buttons
/components/auth-form.tsx       - Updated authentication form
/app/auth/callback/page.tsx     - OAuth callback handler
/app/(auth)/login/page.tsx      - Updated login page
/app/(auth)/register/page.tsx   - Updated registration page
/components/navigation.tsx      - Updated navigation with OAuth support
/types/database.ts              - Updated database types
/.env.local                     - Environment configuration
```

## Usage

Users can now:
1. Visit login or registration pages
2. Click on Google or LinkedIn buttons
3. Complete OAuth flow on provider's site
4. Be automatically redirected back to the application
5. Have their profile created automatically
6. Access the application dashboard

The OAuth implementation gracefully handles cases where providers are not configured, falling back to email/password authentication only.