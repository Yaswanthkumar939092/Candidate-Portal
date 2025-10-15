'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Types for feature flags
export interface FeatureFlagContextType {
  flags: Record<string, any>
  isLoading: boolean
  error: string | null
  refreshFlags: () => Promise<void>
  isEnabled: (key: string) => boolean
  getFlag: (key: string, defaultValue?: any) => any
}

// Default feature flag keys that the app uses
export const DEFAULT_FEATURE_FLAGS = {
  oauth_login: true,
  job_applications: true,
  admin_dashboard_metrics: true,
  profile_document_uploads: true,
  application_tracking: true,
  social_job_sharing: false,
  advanced_search_filters: false,
  email_notifications: true,
  job_recommendations: false,
  real_time_chat: false,
} as const

export type FeatureFlagKey = keyof typeof DEFAULT_FEATURE_FLAGS

// Create the context
const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

// Provider component
interface FeatureFlagProviderProps {
  children: React.ReactNode
  initialFlags?: Record<string, any>
}

export function FeatureFlagProvider({ children, initialFlags = {} }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, any>>({
    ...DEFAULT_FEATURE_FLAGS,
    ...initialFlags
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch feature flags from the API
  const fetchFlags = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/feature-flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.flags) {
        setFlags(prevFlags => ({
          ...DEFAULT_FEATURE_FLAGS,
          ...data.flags
        }))
      } else {
        throw new Error(data.error || 'Failed to fetch feature flags')
      }
    } catch (err) {
      console.error('Error fetching feature flags:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fall back to default flags on error
      setFlags(DEFAULT_FEATURE_FLAGS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Function to refresh flags manually
  const refreshFlags = useCallback(async () => {
    await fetchFlags()
  }, [fetchFlags])

  // Function to check if a feature is enabled
  const isEnabled = useCallback((key: string): boolean => {
    const value = flags[key]
    if (typeof value === 'boolean') {
      return value
    }
    return false
  }, [flags])

  // Function to get a feature flag value with optional default
  const getFlag = useCallback((key: string, defaultValue: any = false): any => {
    return flags[key] !== undefined ? flags[key] : defaultValue
  }, [flags])

  // Initial fetch on mount
  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  // Set up real-time updates via Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel('feature-flags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags'
        },
        (payload) => {
          console.log('Feature flag changed:', payload)
          // Refresh flags when any flag changes
          refreshFlags()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshFlags])

  const contextValue: FeatureFlagContextType = {
    flags,
    isLoading,
    error,
    refreshFlags,
    isEnabled,
    getFlag
  }

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

// Hook to use feature flags
export function useFeatureFlags(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext)
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}

// Hook to check if a specific feature is enabled
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const { isEnabled } = useFeatureFlags()
  return isEnabled(key)
}

// Hook to get a feature flag value
export function useFeatureFlagValue(key: FeatureFlagKey, defaultValue?: any): any {
  const { getFlag } = useFeatureFlags()
  return getFlag(key, defaultValue)
}

// Higher-order component to conditionally render based on feature flags
interface FeatureGateProps {
  flag: FeatureFlagKey
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function FeatureGate({ flag, fallback = null, children }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag)

  if (!isEnabled) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Component to show loading state while flags are being fetched
export function FeatureFlagLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useFeatureFlags()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}