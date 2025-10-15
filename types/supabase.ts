/**
 * Generated TypeScript types for Supabase Database
 * Project ID: luniiecxbsyajdfjtsox
 *
 * This file contains all the database types for the Job Candidate Portal.
 * It should be regenerated whenever the database schema changes.
 *
 * To regenerate this file, run:
 * supabase gen types typescript --project-id luniiecxbsyajdfjtsox > types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: 'applied' | 'review' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
          cover_letter: string | null
          resume_url: string | null
          additional_documents: Json
          notes: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          status?: 'applied' | 'review' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
          cover_letter?: string | null
          resume_url?: string | null
          additional_documents?: Json
          notes?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          status?: 'applied' | 'review' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
          cover_letter?: string | null
          resume_url?: string | null
          additional_documents?: Json
          notes?: string | null
          applied_at?: string
          updated_at?: string
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
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          id: string
          application_id: string
          status: string
          notes: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          application_id: string
          status: string
          notes?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          status?: string
          notes?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          website: string | null
          logo_url: string | null
          industry: string | null
          size: string | null
          location: string | null
          founded_year: number | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          founded_year?: number | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          founded_year?: number | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'other'
          url: string
          size: number | null
          mime_type: string | null
          is_primary: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'other'
          url: string
          size?: number | null
          mime_type?: string | null
          is_primary?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'other'
          url?: string
          size?: number | null
          mime_type?: string | null
          is_primary?: boolean
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          id: string
          application_id: string
          scheduled_at: string
          duration: number
          type: 'video' | 'phone' | 'in-person'
          meeting_link: string | null
          location: string | null
          notes: string | null
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          interviewer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          scheduled_at: string
          duration?: number
          type?: 'video' | 'phone' | 'in-person'
          meeting_link?: string | null
          location?: string | null
          notes?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          interviewer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          scheduled_at?: string
          duration?: number
          type?: 'video' | 'phone' | 'in-person'
          meeting_link?: string | null
          location?: string | null
          notes?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          interviewer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      job_category_mappings: {
        Row: {
          id: string
          job_id: string
          category_id: string
        }
        Insert: {
          id?: string
          job_id: string
          category_id: string
        }
        Update: {
          id?: string
          job_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_category_mappings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          id: string
          frappe_job_id: string
          company_id: string | null
          title: string
          slug: string
          location: string | null
          department: string | null
          experience_level: string | null
          job_type: string | null
          employment_type: string | null
          salary_range: Json | null
          description: string | null
          requirements: string | null
          benefits: string | null
          responsibilities: string | null
          tags: string[]
          status: 'active' | 'inactive' | 'draft' | 'closed'
          is_featured: boolean
          is_remote: boolean
          posted_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          frappe_job_id: string
          company_id?: string | null
          title: string
          slug: string
          location?: string | null
          department?: string | null
          experience_level?: string | null
          job_type?: string | null
          employment_type?: string | null
          salary_range?: Json | null
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          responsibilities?: string | null
          tags?: string[]
          status?: 'active' | 'inactive' | 'draft' | 'closed'
          is_featured?: boolean
          is_remote?: boolean
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          frappe_job_id?: string
          company_id?: string | null
          title?: string
          slug?: string
          location?: string | null
          department?: string | null
          experience_level?: string | null
          job_type?: string | null
          employment_type?: string | null
          salary_range?: Json | null
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          responsibilities?: string | null
          tags?: string[]
          status?: 'active' | 'inactive' | 'draft' | 'closed'
          is_featured?: boolean
          is_remote?: boolean
          posted_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          is_public: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          skills: string[]
          experience: Json
          education: Json
          preferences: Json
          social_links: Json
          availability: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skills?: string[]
          experience?: Json
          education?: Json
          preferences?: Json
          social_links?: Json
          availability?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skills?: string[]
          experience?: Json
          education?: Json
          preferences?: Json
          social_links?: Json
          availability?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          location: string | null
          bio: string | null
          avatar_url: string | null
          role: 'candidate' | 'admin' | 'super_admin'
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          location?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'candidate' | 'admin' | 'super_admin'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          location?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'candidate' | 'admin' | 'super_admin'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_user_data: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      broadcast_application_update: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      broadcast_interview_schedule: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_sensitive_data: {
        Args: {
          encrypted_data: string
        }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: {
          data: string
        }
        Returns: string
      }
      get_database_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_index_usage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          schemaname: string
          tablename: string
          indexname: string
          idx_scan: number
          idx_tup_read: number
          idx_tup_fetch: number
        }[]
      }
      get_unused_indexes: {
        Args: Record<PropertyKey, never>
        Returns: {
          schemaname: string
          tablename: string
          indexname: string
          index_size: string
        }[]
      }
      get_user_activity_stats: {
        Args: {
          p_days?: number
        }
        Returns: Json
      }
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          p_user_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_location: string
          p_bio: string
        }
        Returns: undefined
      }
      validate_sample_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          record_count: number
          status: string
        }[]
      }
      validate_user_permission: {
        Args: {
          p_resource_type: string
          p_resource_id: string
          p_action: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

// Additional type definitions for common patterns

export type UserRole = 'candidate' | 'admin' | 'super_admin';
export type ApplicationStatus = 'applied' | 'review' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
export type JobStatus = 'active' | 'inactive' | 'draft' | 'closed';
export type InterviewType = 'video' | 'phone' | 'in-person';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type DocumentType = 'resume' | 'cover-letter' | 'portfolio' | 'certificate' | 'other';

// Salary range type
export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

// User experience entry
export interface Experience {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  location?: string;
}

// User education entry
export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  gpa?: number;
  description?: string;
}

// User preferences
export interface UserPreferences {
  jobTypes?: string[];
  locations?: string[];
  remoteWork?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  industries?: string[];
  experienceLevel?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

// Social links
export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  portfolio?: string;
}

// Availability settings
export interface Availability {
  immediateStart?: boolean;
  noticePeriod?: number;
  noticePeriodUnit?: 'days' | 'weeks' | 'months';
  preferredStartDate?: string;
}

// Notification data types
export interface NotificationData {
  applicationId?: string;
  jobId?: string;
  interviewId?: string;
  companyId?: string;
  action?: string;
  url?: string;
  [key: string]: any;
}

// Job search filters
export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  department?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  companyId?: string;
  categoryId?: string;
  tags?: string[];
  datePosted?: 'today' | 'week' | 'month' | 'anytime';
}

// Application with relations
export interface ApplicationWithJob extends Tables<'applications'> {
  jobs: Tables<'jobs'> & {
    companies: Tables<'companies'>;
  };
}

// Job with relations
export interface JobWithCompany extends Tables<'jobs'> {
  companies: Tables<'companies'>;
  job_category_mappings: Array<{
    job_categories: Tables<'job_categories'>;
  }>;
}

// User with profile
export interface UserWithProfile extends Tables<'users'> {
  user_profiles: Tables<'user_profiles'>;
}

// Interview with application and job
export interface InterviewWithDetails extends Tables<'interviews'> {
  applications: Tables<'applications'> & {
    jobs: Tables<'jobs'> & {
      companies: Tables<'companies'>;
    };
  };
}

// Database function return types
export type UserStats = {
  total_applications: number;
  saved_jobs: number;
  documents: number;
  interviews: number;
  unread_notifications: number;
};

export type DatabaseStats = {
  total_users: number;
  active_users: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  total_companies: number;
  verified_companies: number;
  total_documents: number;
  total_interviews: number;
  pending_notifications: number;
};

export type UserActivityStats = {
  new_users: number;
  new_applications: number;
  new_jobs: number;
  active_users: number;
};

// Helper types for form handling
export type CreateApplicationData = Omit<TablesInsert<'applications'>, 'id' | 'applied_at' | 'updated_at'>;
export type UpdateApplicationData = Omit<TablesUpdate<'applications'>, 'id' | 'user_id' | 'job_id' | 'applied_at'>;
export type CreateJobData = Omit<TablesInsert<'jobs'>, 'id' | 'created_at' | 'updated_at'>;
export type UpdateJobData = Omit<TablesUpdate<'jobs'>, 'id' | 'frappe_job_id' | 'created_at'>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}