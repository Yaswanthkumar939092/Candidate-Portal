"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { PortalNavigation } from '@/components/portal/portal-navigation'

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
    <div className="min-h-screen bg-background">
      <PortalNavigation />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  )
}
