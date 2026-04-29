import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let adminClient: SupabaseClient<Database> | null = null

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  adminClient ??= createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return adminClient
}

// Server-side Supabase client with service role key
// This bypasses Row Level Security (RLS) and should only be used server-side
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getSupabaseAdmin(), prop, receiver)
    if (typeof value === 'function') {
      return value.bind(getSupabaseAdmin())
    }

    return value
  }
})

// Admin functions for user management
export const adminAuth = {
  // Create a new user with email and password
  createUser: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    })
    if (error) throw error
    return data
  },

  // Delete a user by ID
  deleteUser: async (userId: string) => {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error
    return data
  },

  // Update user metadata
  updateUser: async (userId: string, updates: { email?: string; password?: string; user_metadata?: Record<string, any> }) => {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates)
    if (error) throw error
    return data
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error) throw error
    return data
  },

  // List all users with pagination
  listUsers: async (page = 1, perPage = 50) => {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage
    })
    if (error) throw error
    return data
  }
}

// Database operations that bypass RLS
export const adminDb = {
  // Get any record by ID from any table
  getById: async <T>(table: keyof Database['public']['Tables'], id: string) => {
    const { data, error } = await supabaseAdmin
      .from(table as any)
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as T
  },

  // Update any record by ID
  updateById: async <T>(table: keyof Database['public']['Tables'], id: string, updates: Partial<T>) => {
    const { data, error } = await supabaseAdmin
      .from(table as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as T
  },

  // Delete any record by ID
  deleteById: async (table: keyof Database['public']['Tables'], id: string) => {
    const { error } = await supabaseAdmin
      .from(table as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
