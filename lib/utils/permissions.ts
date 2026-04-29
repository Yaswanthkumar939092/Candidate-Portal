import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

// Permission and role schemas
export const roleSchema = z.enum(['admin', 'candidate', 'recruiter', 'hr_manager', 'company_admin'])

export const permissionSchema = z.enum([
  // User management
  'users.read',
  'users.create',
  'users.update',
  'users.delete',

  // Job management
  'jobs.read',
  'jobs.create',
  'jobs.update',
  'jobs.delete',
  'jobs.publish',

  // Application management
  'applications.read',
  'applications.create',
  'applications.update',
  'applications.delete',
  'applications.status.update',

  // Admin operations
  'admin.dashboard.read',
  'admin.sync.manage',
  'admin.reports.read',
  'admin.settings.update',

  // Company management
  'companies.read',
  'companies.create',
  'companies.update',
  'companies.delete',

  // Document management
  'documents.read',
  'documents.upload',
  'documents.delete',

  // Profile management
  'profile.read',
  'profile.update',
  'profile.delete',
])

export type Role = z.infer<typeof roleSchema>
export type Permission = z.infer<typeof permissionSchema>

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Admin has all permissions
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'jobs.read',
    'jobs.create',
    'jobs.update',
    'jobs.delete',
    'jobs.publish',
    'applications.read',
    'applications.create',
    'applications.update',
    'applications.delete',
    'applications.status.update',
    'admin.dashboard.read',
    'admin.sync.manage',
    'admin.reports.read',
    'admin.settings.update',
    'companies.read',
    'companies.create',
    'companies.update',
    'companies.delete',
    'documents.read',
    'documents.upload',
    'documents.delete',
    'profile.read',
    'profile.update',
    'profile.delete',
  ],

  candidate: [
    // Candidates can manage their own profile and applications
    'jobs.read',
    'applications.read',
    'applications.create',
    'companies.read',
    'documents.read',
    'documents.upload',
    'documents.delete',
    'profile.read',
    'profile.update',
  ],

  recruiter: [
    // Recruiters can manage jobs and view applications
    'jobs.read',
    'jobs.create',
    'jobs.update',
    'jobs.publish',
    'applications.read',
    'applications.update',
    'applications.status.update',
    'companies.read',
    'documents.read',
    'profile.read',
    'profile.update',
  ],

  hr_manager: [
    // HR managers have extended recruiting permissions
    'users.read',
    'jobs.read',
    'jobs.create',
    'jobs.update',
    'jobs.delete',
    'jobs.publish',
    'applications.read',
    'applications.create',
    'applications.update',
    'applications.delete',
    'applications.status.update',
    'companies.read',
    'companies.update',
    'documents.read',
    'profile.read',
    'profile.update',
  ],

  company_admin: [
    // Company admins can manage their company's jobs and applications
    'users.read',
    'jobs.read',
    'jobs.create',
    'jobs.update',
    'jobs.delete',
    'jobs.publish',
    'applications.read',
    'applications.update',
    'applications.status.update',
    'companies.read',
    'companies.update',
    'documents.read',
    'profile.read',
    'profile.update',
  ],
}

// User context interface
export interface UserContext {
  id: string
  email: string
  role: Role
  company_id?: string
  permissions: Permission[]
  metadata?: Record<string, unknown>
}

export interface ResourceContext {
  resourceType?: 'application' | 'job' | 'document' | 'profile'
  resourceOwnerId?: string
  resourceCompanyId?: string
}

// Permission check result
export interface PermissionResult {
  allowed: boolean
  reason?: string
  missingPermissions?: Permission[]
}

/**
 * Get user context with role and permissions
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
  try {
    // Get user profile with role information
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to get user profile:', error)
      return null
    }

    // Default to candidate role if not specified
    const userRole: Role = (profile.role as Role) || 'candidate'

    // Get permissions for the role
    const permissions = ROLE_PERMISSIONS[userRole] || []

    return {
      id: profile.id,
      email: profile.email,
      role: userRole,
      company_id: undefined, // TODO: Add company_id to schema if needed
      permissions,
      metadata: undefined, // TODO: Add metadata to schema if needed
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return null
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userContext: UserContext,
  permission: Permission,
  resourceContext?: ResourceContext
): PermissionResult {
  // Check if user has the base permission
  if (!userContext.permissions.includes(permission)) {
    return {
      allowed: false,
      reason: `User does not have permission: ${permission}`,
      missingPermissions: [permission]
    }
  }

  // Resource-specific permission checks
  if (resourceContext) {
    // Check resource ownership for candidates
    if (userContext.role === 'candidate') {
      if (resourceContext.resourceOwnerId && resourceContext.resourceOwnerId !== userContext.id) {
        return {
          allowed: false,
          reason: 'Candidates can only access their own resources'
        }
      }
    }

    // Check company scope for company-specific roles
    if (['recruiter', 'hr_manager', 'company_admin'].includes(userContext.role)) {
      if (
        resourceContext.resourceCompanyId &&
        userContext.company_id &&
        resourceContext.resourceCompanyId !== userContext.company_id
      ) {
        return {
          allowed: false,
          reason: 'Access denied: resource belongs to different company'
        }
      }
    }
  }

  return { allowed: true }
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userContext: UserContext,
  permissions: Permission[]
): PermissionResult {
  const userPermissions = new Set(userContext.permissions)
  const hasAny = permissions.some(permission => userPermissions.has(permission))

  if (hasAny) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'User does not have any of the required permissions',
    missingPermissions: permissions.filter(p => !userPermissions.has(p))
  }
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userContext: UserContext,
  permissions: Permission[]
): PermissionResult {
  const userPermissions = new Set(userContext.permissions)
  const missingPermissions = permissions.filter(p => !userPermissions.has(p))

  if (missingPermissions.length === 0) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'User is missing required permissions',
    missingPermissions
  }
}

/**
 * Check if user has role
 */
export function hasRole(userContext: UserContext, role: Role): boolean {
  return userContext.role === role
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userContext: UserContext, roles: Role[]): boolean {
  return roles.includes(userContext.role)
}

/**
 * Check if user is admin
 */
export function isAdmin(userContext: UserContext): boolean {
  return userContext.role === 'admin'
}

/**
 * Check if user can access resource
 */
export async function canAccessResource(
  userId: string,
  resourceType: 'application' | 'job' | 'document' | 'profile',
  resourceId: string,
  action: 'read' | 'update' | 'delete' = 'read'
): Promise<PermissionResult> {
  try {
    // Get user context
    const userContext = await getUserContext(userId)
    if (!userContext) {
      return { allowed: false, reason: 'User not found' }
    }

    // Map action to permission
    const permissionMap = {
      application: {
        read: 'applications.read' as Permission,
        update: 'applications.update' as Permission,
        delete: 'applications.delete' as Permission,
      },
      job: {
        read: 'jobs.read' as Permission,
        update: 'jobs.update' as Permission,
        delete: 'jobs.delete' as Permission,
      },
      document: {
        read: 'documents.read' as Permission,
        update: 'documents.upload' as Permission, // Documents don't have update, use upload
        delete: 'documents.delete' as Permission,
      },
      profile: {
        read: 'profile.read' as Permission,
        update: 'profile.update' as Permission,
        delete: 'profile.delete' as Permission,
      },
    }

    const requiredPermission = permissionMap[resourceType][action]

    // Get resource details for ownership/company checks
    let resourceContext: ResourceContext = {}

    if (resourceType === 'application') {
      const { data: application } = await supabaseAdmin
        .from('applications')
        .select('candidate_id, jobs(company_id)')
        .eq('id', resourceId)
        .single()

      if (application) {
        resourceContext = {
          resourceType,
          resourceOwnerId: application.candidate_id,
          resourceCompanyId: (application.jobs as unknown as { company_id: string })?.company_id,
        }
      }
    } else if (resourceType === 'job') {
      const { data: job } = await supabaseAdmin
        .from('jobs')
        .select('id')
        .eq('id', resourceId)
        .single()

      if (job) {
        resourceContext = {
          resourceType,
          resourceCompanyId: undefined, // TODO: Add company relationship if needed
        }
      }
    } else if (resourceType === 'document') {
      const { data: document } = await supabaseAdmin
        .from('user_documents')
        .select('user_id')
        .eq('id', resourceId)
        .single()

      if (document) {
        resourceContext = {
          resourceType,
          resourceOwnerId: document.user_id,
        }
      }
    } else if (resourceType === 'profile') {
      resourceContext = {
        resourceType,
        resourceOwnerId: resourceId, // Profile ID is the user ID
      }
    }

    return hasPermission(userContext, requiredPermission, resourceContext)

  } catch (error) {
    console.error('Error checking resource access:', error)
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

/**
 * Middleware wrapper for permission-based access control
 */
export function requirePermissions(permissions: Permission[]) {
  return async (
    userContext: UserContext,
    resourceContext?: {
      resourceType?: 'application' | 'job' | 'document' | 'profile'
      resourceOwnerId?: string
      resourceCompanyId?: string
    }
  ): Promise<PermissionResult> => {
    // Check if user has all required permissions
    const permissionCheck = hasAllPermissions(userContext, permissions)
    if (!permissionCheck.allowed) {
      return permissionCheck
    }

    // Additional resource-specific checks
    if (resourceContext) {
      // For each permission, check resource context
      for (const permission of permissions) {
        const resourceCheck = hasPermission(userContext, permission, resourceContext)
        if (!resourceCheck.allowed) {
          return resourceCheck
        }
      }
    }

    return { allowed: true }
  }
}

/**
 * Middleware wrapper for role-based access control
 */
export function requireRoles(roles: Role[]) {
  return (userContext: UserContext): PermissionResult => {
    if (hasAnyRole(userContext, roles)) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: `User role '${userContext.role}' is not authorized. Required roles: ${roles.join(', ')}`
    }
  }
}

/**
 * Filter data based on user permissions
 */
export async function filterDataByPermissions<T extends { id: string; [key: string]: unknown }>(
  userId: string,
  data: T[],
  resourceType: 'application' | 'job' | 'document' | 'profile',
  getResourceOwnerId: (item: T) => string,
  getResourceCompanyId?: (item: T) => string
): Promise<T[]> {
  try {
    const userContext = await getUserContext(userId)
    if (!userContext) {
      return []
    }

    // Admins can see all data
    if (userContext.role === 'admin') {
      return data
    }

    // Filter data based on permissions
    const filteredData: T[] = []

    for (const item of data) {
      const resourceContext = {
        resourceType,
        resourceOwnerId: getResourceOwnerId(item),
        resourceCompanyId: getResourceCompanyId ? getResourceCompanyId(item) : undefined,
      }

      const permissionCheck = hasPermission(
        userContext,
        `${resourceType}s.read` as Permission,
        resourceContext
      )

      if (permissionCheck.allowed) {
        filteredData.push(item)
      }
    }

    return filteredData

  } catch (error) {
    console.error('Error filtering data by permissions:', error)
    return []
  }
}

/**
 * Get allowed actions for a resource
 */
export async function getAllowedActions(
  userId: string,
  resourceType: 'application' | 'job' | 'document' | 'profile',
  resourceId: string
): Promise<{
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  canCreate?: boolean
}> {
  try {
    const [readCheck, updateCheck, deleteCheck] = await Promise.all([
      canAccessResource(userId, resourceType, resourceId, 'read'),
      canAccessResource(userId, resourceType, resourceId, 'update'),
      canAccessResource(userId, resourceType, resourceId, 'delete'),
    ])

    const userContext = await getUserContext(userId)
    const canCreate = userContext ?
      hasPermission(userContext, `${resourceType}s.create` as Permission).allowed :
      false

    return {
      canRead: readCheck.allowed,
      canUpdate: updateCheck.allowed,
      canDelete: deleteCheck.allowed,
      canCreate,
    }
  } catch (error) {
    console.error('Error getting allowed actions:', error)
    return {
      canRead: false,
      canUpdate: false,
      canDelete: false,
      canCreate: false,
    }
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  adminUserId: string,
  targetUserId: string,
  newRole: Role
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin has permission to update users
    const adminContext = await getUserContext(adminUserId)
    if (!adminContext) {
      return { success: false, error: 'Admin user not found' }
    }

    const permissionCheck = hasPermission(adminContext, 'users.update')
    if (!permissionCheck.allowed) {
      return { success: false, error: permissionCheck.reason }
    }

    // Update user role
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        role: newRole as 'candidate' | 'admin' | 'super_admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (error) {
      return { success: false, error: error.message }
    }

    console.log(`User ${targetUserId} role updated to ${newRole} by admin ${adminUserId}`)
    return { success: true }

  } catch (error) {
    console.error('Error updating user role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate role assignment
 */
export function validateRoleAssignment(
  assignerRole: Role,
  targetRole: Role
): PermissionResult {
  // Only admins can assign any role
  if (assignerRole === 'admin') {
    return { allowed: true }
  }

  // HR managers can assign candidate and recruiter roles
  if (assignerRole === 'hr_manager' && ['candidate', 'recruiter'].includes(targetRole)) {
    return { allowed: true }
  }

  // Company admins can assign candidate and recruiter roles
  if (assignerRole === 'company_admin' && ['candidate', 'recruiter'].includes(targetRole)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Role ${assignerRole} cannot assign role ${targetRole}`
  }
}

// Export permission constants for easy access
export const PERMISSIONS = {
  USER: {
    READ: 'users.read' as Permission,
    CREATE: 'users.create' as Permission,
    UPDATE: 'users.update' as Permission,
    DELETE: 'users.delete' as Permission,
  },
  JOB: {
    READ: 'jobs.read' as Permission,
    CREATE: 'jobs.create' as Permission,
    UPDATE: 'jobs.update' as Permission,
    DELETE: 'jobs.delete' as Permission,
    PUBLISH: 'jobs.publish' as Permission,
  },
  APPLICATION: {
    READ: 'applications.read' as Permission,
    CREATE: 'applications.create' as Permission,
    UPDATE: 'applications.update' as Permission,
    DELETE: 'applications.delete' as Permission,
    STATUS_UPDATE: 'applications.status.update' as Permission,
  },
  ADMIN: {
    DASHBOARD: 'admin.dashboard.read' as Permission,
    SYNC: 'admin.sync.manage' as Permission,
    REPORTS: 'admin.reports.read' as Permission,
    SETTINGS: 'admin.settings.update' as Permission,
  },
  COMPANY: {
    READ: 'companies.read' as Permission,
    CREATE: 'companies.create' as Permission,
    UPDATE: 'companies.update' as Permission,
    DELETE: 'companies.delete' as Permission,
  },
  DOCUMENT: {
    READ: 'documents.read' as Permission,
    UPLOAD: 'documents.upload' as Permission,
    DELETE: 'documents.delete' as Permission,
  },
  PROFILE: {
    READ: 'profile.read' as Permission,
    UPDATE: 'profile.update' as Permission,
    DELETE: 'profile.delete' as Permission,
  },
} as const