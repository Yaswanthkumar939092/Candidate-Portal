"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { PortalNavigation } from '@/components/portal/portal-navigation'
import { SurveyOfferNavigation } from '@/components/portal/survey-offer-navigation'
import { FeatureFlagProvider, FeatureFlagLoader } from '@/lib/contexts/feature-flags'

/**
 * Portal layout with authentication guard.
 *
 * Any page nested inside the (portal) route group is protected:
 * - While auth state is resolving a centered spinner is shown.
 * - Un-authenticated visitors are redirected to /auth/login.
 * - Authenticated users see the portal navigation and the page content.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const showNavigation = pathname !== '/survey'
  const showSurveyOfferNavigation = pathname === '/survey'

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  // Auth state is still loading -- show a spinner.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated -- render nothing while the redirect fires.
  if (!user) {
    return null
  }

  // Authenticated -- render portal chrome + page content.
  return (
    <FeatureFlagProvider>
      <FeatureFlagLoader>
        <div className="min-h-screen bg-background">
          {showNavigation && <PortalNavigation hideNavLinks={pathname === '/profile'} />}
          {showSurveyOfferNavigation && <SurveyOfferNavigation />}
          <main className={showNavigation || showSurveyOfferNavigation ? "flex-1 pt-16" : "flex-1"}>
            {children}
          </main>
        </div>
      </FeatureFlagLoader>
    </FeatureFlagProvider>
  )
}
