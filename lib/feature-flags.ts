// Server-side feature flag utilities
import { supabaseAdmin } from '@/lib/supabase-admin'
import { FeatureFlag, FeatureFlagOverride } from '@/types/database'

// Cache for feature flags (server-side)
let flagsCache: Record<string, any> = {}
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Default feature flags (fallback values)
export const DEFAULT_FLAGS = {
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

export type FeatureFlagKey = keyof typeof DEFAULT_FLAGS

// Helper function to evaluate feature flag for user
function evaluateFeatureFlagForUser(
  flag: FeatureFlag,
  userId: string | null,
  userOverride: FeatureFlagOverride | null
): any {
  // If user has an override, use that value
  if (userOverride) {
    return userOverride.value
  }

  // If flag is disabled globally, return false/default
  if (!flag.is_enabled) {
    return flag.value_type === 'boolean' ? false : null
  }

  // For rollout percentage, use a simple hash-based approach
  if (flag.rollout_percentage < 100 && userId) {
    // Simple hash function to determine if user is in rollout
    let hash = 0
    const str = userId + flag.key
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    const percentage = Math.abs(hash) % 100

    if (percentage >= flag.rollout_percentage) {
      return flag.value_type === 'boolean' ? false : null
    }
  }

  // Return the default value
  return flag.default_value
}

// Get all feature flags from database
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const { data: flags, error } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching feature flags:', error)
      return []
    }

    return flags || []
  } catch (error) {
    console.error('Error in getAllFeatureFlags:', error)
    return []
  }
}

// Get feature flags for a specific user
export async function getFeatureFlagsForUser(userId: string | null): Promise<Record<string, any>> {
  try {
    // Check cache first
    const now = Date.now()
    if (now - cacheTimestamp < CACHE_TTL && Object.keys(flagsCache).length > 0) {
      return flagsCache
    }

    // Get all enabled feature flags
    const { data: featureFlags, error: flagsError } = await supabaseAdmin
      .from('feature_flags')
      .select('*')

    if (flagsError) {
      console.error('Error fetching feature flags:', flagsError)
      return DEFAULT_FLAGS
    }

    // Get user overrides if user is provided
    let userOverrides: FeatureFlagOverride[] = []
    if (userId && featureFlags?.length) {
      const flagIds = featureFlags.map(flag => flag.id)
      const { data: overrides, error: overrideError } = await supabaseAdmin
        .from('feature_flag_overrides')
        .select('*')
        .eq('user_id', userId)
        .in('feature_flag_id', flagIds)

      if (!overrideError && overrides) {
        userOverrides = overrides
      }
    }

    // Create a map of overrides for quick lookup
    const overrideMap = new Map<string, FeatureFlagOverride>()
    userOverrides.forEach(override => {
      overrideMap.set(override.feature_flag_id, override)
    })

    // Evaluate each feature flag for the user
    const evaluatedFlags: Record<string, any> = { ...DEFAULT_FLAGS }

    if (featureFlags) {
      featureFlags.forEach(flag => {
        const override = overrideMap.get(flag.id) ?? null
        const value = evaluateFeatureFlagForUser(flag, userId, override)
        evaluatedFlags[flag.key] = value
      })
    }

    // Update cache
    flagsCache = evaluatedFlags
    cacheTimestamp = now

    return evaluatedFlags
  } catch (error) {
    console.error('Error in getFeatureFlagsForUser:', error)
    return DEFAULT_FLAGS
  }
}

// Check if a specific feature flag is enabled for a user
export async function isFeatureEnabled(
  flagKey: FeatureFlagKey,
  userId: string | null = null
): Promise<boolean> {
  try {
    const flags = await getFeatureFlagsForUser(userId)
    return Boolean(flags[flagKey])
  } catch (error) {
    console.error(`Error checking feature flag ${flagKey}:`, error)
    return DEFAULT_FLAGS[flagKey]
  }
}

// Get a specific feature flag value for a user
export async function getFeatureFlagValue(
  flagKey: FeatureFlagKey,
  userId: string | null = null,
  defaultValue?: any
): Promise<any> {
  try {
    const flags = await getFeatureFlagsForUser(userId)
    return flags[flagKey] !== undefined ? flags[flagKey] : (defaultValue ?? DEFAULT_FLAGS[flagKey])
  } catch (error) {
    console.error(`Error getting feature flag value ${flagKey}:`, error)
    return defaultValue ?? DEFAULT_FLAGS[flagKey]
  }
}

// Update a feature flag
export async function updateFeatureFlag(
  flagId: string,
  updates: Partial<FeatureFlag>
): Promise<FeatureFlag | null> {
  try {
    const { data: updatedFlag, error } = await supabaseAdmin
      .from('feature_flags')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', flagId)
      .select()
      .single()

    if (error) {
      console.error('Error updating feature flag:', error)
      return null
    }

    // Clear cache when flag is updated
    flagsCache = {}
    cacheTimestamp = 0

    return updatedFlag
  } catch (error) {
    console.error('Error in updateFeatureFlag:', error)
    return null
  }
}

// Create a user override for a feature flag
export async function createUserOverride(
  flagId: string,
  userId: string,
  value: any
): Promise<FeatureFlagOverride | null> {
  try {
    const { data: override, error } = await supabaseAdmin
      .from('feature_flag_overrides')
      .upsert({
        feature_flag_id: flagId,
        user_id: userId,
        value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user override:', error)
      return null
    }

    // Clear cache when override is created
    flagsCache = {}
    cacheTimestamp = 0

    return override
  } catch (error) {
    console.error('Error in createUserOverride:', error)
    return null
  }
}

// Remove a user override for a feature flag
export async function removeUserOverride(
  flagId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('feature_flag_overrides')
      .delete()
      .eq('feature_flag_id', flagId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing user override:', error)
      return false
    }

    // Clear cache when override is removed
    flagsCache = {}
    cacheTimestamp = 0

    return true
  } catch (error) {
    console.error('Error in removeUserOverride:', error)
    return false
  }
}

// Clear the feature flags cache
export function clearFeatureFlagsCache(): void {
  flagsCache = {}
  cacheTimestamp = 0
}

// Middleware helper to inject feature flags into request context
export async function injectFeatureFlags(userId: string | null): Promise<Record<string, any>> {
  return await getFeatureFlagsForUser(userId)
}