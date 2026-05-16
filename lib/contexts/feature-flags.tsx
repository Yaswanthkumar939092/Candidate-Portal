'use client'

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { useCandidateFeatureFlags } from '../hooks/useCandidateFeatureFlags'

// Types for feature flags
export interface FeatureFlagContextType {
  flags: Record<string, boolean>
  isLoading: boolean
  error: string | null
  refreshFlags: () => Promise<void>
  isEnabled: (key: string) => boolean
  getFlag: (key: string, defaultValue?: boolean) => boolean
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
  home: true,
  documents: false,
  open_jobs: false,
  action_center: false,
  my_jobs: false,
} as const

export type FeatureFlagKey = keyof typeof DEFAULT_FEATURE_FLAGS

// Create the context
const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

// Provider component
interface FeatureFlagProviderProps {
  children: React.ReactNode
  initialFlags?: Record<string, boolean>
}

export function FeatureFlagProvider({ children, initialFlags = {} }: FeatureFlagProviderProps) {
  const { data: remoteFlags, isLoading, error, refetch } = useCandidateFeatureFlags()

  const flags: Record<string, boolean> = useMemo(() => {
    const baseFlags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS, ...initialFlags }
    if (!remoteFlags) return baseFlags

    const remoteBooleans = Object.fromEntries(
      Object.entries(remoteFlags).map(([k, v]) => [k, v === 1 || v === true])
    )
    return { ...baseFlags, ...remoteBooleans }
  }, [initialFlags, remoteFlags])

  // Function to refresh flags manually
  const refreshFlags = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Function to check if a feature is enabled
  const isEnabled = useCallback((key: string): boolean => {
    const value = flags[key]
    if (typeof value === 'boolean') {
      return value
    }
    return false
  }, [flags])

  // Function to get a feature flag value with optional default
  const getFlag = useCallback((key: string, defaultValue: boolean = false): boolean => {
    return flags[key] !== undefined ? flags[key] : defaultValue
  }, [flags])

  const contextValue: FeatureFlagContextType = {
    flags,
    isLoading,
    error: error instanceof Error ? error.message : (error ? String(error) : null),
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
export function useFeatureFlagValue(key: FeatureFlagKey, defaultValue?: boolean): boolean {
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
