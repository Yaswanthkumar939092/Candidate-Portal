'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { Card, CardContent } from '@/components/ui/card'

interface User {
  id: string
  email?: string
}

interface UserProfile {
  id: string
  full_name?: string | null
  email: string
  role?: string
}



export default function AdminOnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    checkUserAndRedirect()
  }, [])

  const checkUserAndRedirect = async () => {
    try {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      // Check if user has admin privileges
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (!profile) {
        router.push('/dashboard')
        return
      }

      // Check user role (you might need to add a role field to profiles table)
      // For now, we'll assume any user can access admin onboarding
      // In production, you'd check profile.role === 'admin' or 'super_admin'

      setUser(currentUser)
      setUserProfile(profile)

      // Check if onboarding is already completed
      const { data: adminSettings } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (adminSettings && adminSettings.onboarding_completed) {
        router.push('/admin/dashboard')
        return
      }

    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as completed
      await supabase
        .from('admin_settings')
        .upsert({
          user_id: user!.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })

      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingWizard
        user={user}
        profile={userProfile}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}