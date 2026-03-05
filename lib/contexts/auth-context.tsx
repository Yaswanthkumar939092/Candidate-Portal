"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

/**
 * Shape of the authentication context value.
 *
 * - user: The Supabase auth user, or null when signed out.
 * - profile: The matching row from the `profiles` table, or null.
 * - isLoading: True while the initial session / profile is being resolved.
 * - isOnboardingComplete: Derived flag -- true when the profile exists and the
 *   candidate has progressed past the initial `candidate` lifecycle stage.
 * - refreshProfile: Manually re-fetch the profile (e.g. after the user edits it).
 */
export interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isOnboardingComplete: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Provides authentication state to the component tree.
 *
 * On mount it reads the current Supabase session and subscribes to auth-state
 * changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).  When a user is present it
 * also fetches the corresponding `profiles` row so downstream consumers have
 * access to portal-specific data such as `lifecycle_stage`.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch the profile row for a given user id.
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = "no rows returned" -- the profile hasn't been created yet.
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      setProfile(null)
    }
  }, [])

  // Public helper so consumers can force a profile re-fetch (e.g. after editing).
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // Derive onboarding state from the profile.
  // Onboarding is considered complete when the lifecycle stage has moved beyond
  // the initial `candidate` stage (i.e. the user has been promoted to applicant,
  // offered, onboarding, or employee).
  const isOnboardingComplete = Boolean(
    profile && profile.lifecycle_stage !== 'candidate'
  )

  // Bootstrap: read the existing session on mount.
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setUser(null)
          setProfile(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Unexpected error initializing auth:', err)
        setUser(null)
        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [fetchProfile])

  // Subscribe to auth state changes (login, logout, token refresh).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user)
            await fetchProfile(session.user.id)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const contextValue: AuthContextType = {
    user,
    profile,
    isLoading,
    isOnboardingComplete,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to consume the AuthContext.
 *
 * @throws Error if used outside of an `<AuthProvider>`.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
