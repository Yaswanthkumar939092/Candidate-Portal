export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location: string | null
          bio: string | null
          skills: string[] | null
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | null
          preferred_salary_min: number | null
          preferred_salary_max: number | null
          preferred_job_types: string[] | null
          role: 'candidate' | 'admin' | 'super_admin'
          provider: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          skills?: string[] | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | null
          preferred_salary_min?: number | null
          preferred_salary_max?: number | null
          preferred_job_types?: string[] | null
          role?: 'candidate' | 'admin' | 'super_admin'
          provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          bio?: string | null
          skills?: string[] | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | null
          preferred_salary_min?: number | null
          preferred_salary_max?: number | null
          preferred_job_types?: string[] | null
          role?: 'candidate' | 'admin' | 'super_admin'
          provider?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          frappe_job_id: string | null
          title: string
          company: string
          company_logo: string | null
          description: string
          requirements: string[] | null
          benefits: string[] | null
          salary_min: number | null
          salary_max: number | null
          location: string
          job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
          skills_required: string[] | null
          application_deadline: string | null
          is_active: boolean
          posted_by: string
          frappe_created_at: string | null
          frappe_updated_at: string | null
          synced_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          frappe_job_id?: string | null
          title: string
          company: string
          company_logo?: string | null
          description: string
          requirements?: string[] | null
          benefits?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          location: string
          job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
          skills_required?: string[] | null
          application_deadline?: string | null
          is_active?: boolean
          posted_by: string
          frappe_created_at?: string | null
          frappe_updated_at?: string | null
          synced_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          frappe_job_id?: string | null
          title?: string
          company?: string
          company_logo?: string | null
          description?: string
          requirements?: string[] | null
          benefits?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          location?: string
          job_type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
          skills_required?: string[] | null
          application_deadline?: string | null
          is_active?: boolean
          posted_by?: string
          frappe_created_at?: string | null
          frappe_updated_at?: string | null
          synced_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          id: string
          frappe_application_id: string | null
          job_id: string
          candidate_id: string
          status: 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
          cover_letter: string | null
          resume_url: string | null
          applied_at: string
          updated_at: string
          notes: string | null
          rejection_reason: string | null
          frappe_applied_at: string | null
          frappe_updated_at: string | null
          synced_at: string | null
        }
        Insert: {
          id?: string
          frappe_application_id?: string | null
          job_id: string
          candidate_id: string
          status?: 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
          cover_letter?: string | null
          resume_url?: string | null
          applied_at?: string
          updated_at?: string
          notes?: string | null
          rejection_reason?: string | null
          frappe_applied_at?: string | null
          frappe_updated_at?: string | null
          synced_at?: string | null
        }
        Update: {
          id?: string
          frappe_application_id?: string | null
          job_id?: string
          candidate_id?: string
          status?: 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
          cover_letter?: string | null
          resume_url?: string | null
          applied_at?: string
          updated_at?: string
          notes?: string | null
          rejection_reason?: string | null
          frappe_applied_at?: string | null
          frappe_updated_at?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          id: string
          frappe_company_id: string | null
          name: string
          description: string | null
          website: string | null
          logo_url: string | null
          location: string | null
          industry: string | null
          size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | null
          is_active: boolean
          frappe_created_at: string | null
          frappe_updated_at: string | null
          synced_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          frappe_company_id?: string | null
          name: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          location?: string | null
          industry?: string | null
          size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | null
          is_active?: boolean
          frappe_created_at?: string | null
          frappe_updated_at?: string | null
          synced_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          frappe_company_id?: string | null
          name?: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          location?: string | null
          industry?: string | null
          size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | null
          is_active?: boolean
          frappe_created_at?: string | null
          frappe_updated_at?: string | null
          synced_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          saved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          saved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          saved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'application_update' | 'job_match' | 'interview_scheduled' | 'system'
          is_read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'application_update' | 'job_match' | 'interview_scheduled' | 'system'
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'application_update' | 'job_match' | 'interview_scheduled' | 'system'
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_documents: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other'
          file_url: string
          file_size: number
          file_type: string
          description: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other'
          file_url: string
          file_size: number
          file_type: string
          description?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other'
          file_url?: string
          file_size?: number
          file_type?: string
          description?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_settings: {
        Row: {
          id: string
          user_id: string
          onboarding_completed: boolean
          frappe_url: string | null
          frappe_api_key: string | null
          frappe_api_secret: string | null
          auto_sync_enabled: boolean
          sync_interval_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          onboarding_completed?: boolean
          frappe_url?: string | null
          frappe_api_key?: string | null
          frappe_api_secret?: string | null
          auto_sync_enabled?: boolean
          sync_interval_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          onboarding_completed?: boolean
          frappe_url?: string | null
          frappe_api_key?: string | null
          frappe_api_secret?: string | null
          auto_sync_enabled?: boolean
          sync_interval_hours?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_flags: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          is_enabled: boolean
          default_value: Json
          value_type: 'boolean' | 'string' | 'number' | 'json'
          tags: string[]
          environments: string[]
          rollout_percentage: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          is_enabled?: boolean
          default_value?: Json
          value_type?: 'boolean' | 'string' | 'number' | 'json'
          tags?: string[]
          environments?: string[]
          rollout_percentage?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string | null
          is_enabled?: boolean
          default_value?: Json
          value_type?: 'boolean' | 'string' | 'number' | 'json'
          tags?: string[]
          environments?: string[]
          rollout_percentage?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feature_flag_overrides: {
        Row: {
          id: string
          feature_flag_id: string
          user_id: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_flag_id: string
          user_id: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feature_flag_id?: string
          user_id?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_overrides_feature_flag_id_fkey"
            columns: ["feature_flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
      experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
      application_status: 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
      notification_type: 'application_update' | 'job_match' | 'interview_scheduled' | 'system'
      document_type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Job = Database['public']['Tables']['jobs']['Row']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']

export type Application = Database['public']['Tables']['applications']['Row']
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update']

export type SavedJob = Database['public']['Tables']['saved_jobs']['Row']
export type SavedJobInsert = Database['public']['Tables']['saved_jobs']['Insert']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type UserDocument = Database['public']['Tables']['user_documents']['Row']
export type UserDocumentInsert = Database['public']['Tables']['user_documents']['Insert']
export type UserDocumentUpdate = Database['public']['Tables']['user_documents']['Update']

export type AdminSettings = Database['public']['Tables']['admin_settings']['Row']
export type AdminSettingsInsert = Database['public']['Tables']['admin_settings']['Insert']
export type AdminSettingsUpdate = Database['public']['Tables']['admin_settings']['Update']

export type FeatureFlag = Database['public']['Tables']['feature_flags']['Row']
export type FeatureFlagInsert = Database['public']['Tables']['feature_flags']['Insert']
export type FeatureFlagUpdate = Database['public']['Tables']['feature_flags']['Update']

export type FeatureFlagOverride = Database['public']['Tables']['feature_flag_overrides']['Row']
export type FeatureFlagOverrideInsert = Database['public']['Tables']['feature_flag_overrides']['Insert']
export type FeatureFlagOverrideUpdate = Database['public']['Tables']['feature_flag_overrides']['Update']

// Enum types
export type JobType = Database['public']['Enums']['job_type']
export type ExperienceLevel = Database['public']['Enums']['experience_level']
export type ApplicationStatus = Database['public']['Enums']['application_status']
export type NotificationType = Database['public']['Enums']['notification_type']
export type DocumentType = Database['public']['Enums']['document_type']
export type FeatureFlagValueType = 'boolean' | 'string' | 'number' | 'json'