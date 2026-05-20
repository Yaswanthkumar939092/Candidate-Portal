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
          lifecycle_stage: 'candidate' | 'applicant' | 'offered' | 'onboarding' | 'employee'
          frappe_employee_id: string | null
          is_internal_employee: boolean
          email_domain: string | null
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
          lifecycle_stage?: 'candidate' | 'applicant' | 'offered' | 'onboarding' | 'employee'
          frappe_employee_id?: string | null
          is_internal_employee?: boolean
          email_domain?: string | null
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
          lifecycle_stage?: 'candidate' | 'applicant' | 'offered' | 'onboarding' | 'employee'
          frappe_employee_id?: string | null
          is_internal_employee?: boolean
          email_domain?: string | null
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
          visibility: 'internal' | 'external' | 'both'
          visibility_override: boolean
          frappe_publish_field: boolean
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
          visibility?: 'internal' | 'external' | 'both'
          visibility_override?: boolean
          frappe_publish_field?: boolean
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
          visibility?: 'internal' | 'external' | 'both'
          visibility_override?: boolean
          frappe_publish_field?: boolean
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
          offer_accepted_at: string | null
          frappe_job_applicant_id: string | null
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
          offer_accepted_at?: string | null
          frappe_job_applicant_id?: string | null
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
          offer_accepted_at?: string | null
          frappe_job_applicant_id?: string | null
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
      frappe_environments: {
        Row: {
          id: string
          environment_key: 'LOCAL' | 'DEV' | 'UAT' | 'PROD'
          label: string
          frappe_url: string
          api_key: string | null
          api_secret: string | null
          username: string | null
          password: string | null
          webhook_secret: string | null
          is_active: boolean
          auto_sync_enabled: boolean
          sync_interval_hours: number
          last_connection_test_at: string | null
          last_connection_status: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          environment_key: 'LOCAL' | 'DEV' | 'UAT' | 'PROD'
          label: string
          frappe_url: string
          api_key?: string | null
          api_secret?: string | null
          username?: string | null
          password?: string | null
          webhook_secret?: string | null
          is_active?: boolean
          auto_sync_enabled?: boolean
          sync_interval_hours?: number
          last_connection_test_at?: string | null
          last_connection_status?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          environment_key?: 'LOCAL' | 'DEV' | 'UAT' | 'PROD'
          label?: string
          frappe_url?: string
          api_key?: string | null
          api_secret?: string | null
          username?: string | null
          password?: string | null
          webhook_secret?: string | null
          is_active?: boolean
          auto_sync_enabled?: boolean
          sync_interval_hours?: number
          last_connection_test_at?: string | null
          last_connection_status?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_data: {
        Row: {
          id: string
          user_id: string
          personal_info: Json
          address: Json
          identity_documents: Json
          bank_details: Json
          emergency_contacts: Json
          education: Json
          employment_history: Json
          current_step: number
          completed_steps: string[]
          declaration_accepted: boolean
          status: 'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'
          frappe_employee_id: string | null
          frappe_user_id: string | null
          pushed_to_frappe_at: string | null
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          personal_info?: Json
          address?: Json
          identity_documents?: Json
          bank_details?: Json
          emergency_contacts?: Json
          education?: Json
          employment_history?: Json
          current_step?: number
          completed_steps?: string[]
          declaration_accepted?: boolean
          status?: 'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'
          frappe_employee_id?: string | null
          frappe_user_id?: string | null
          pushed_to_frappe_at?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          personal_info?: Json
          address?: Json
          identity_documents?: Json
          bank_details?: Json
          emergency_contacts?: Json
          education?: Json
          employment_history?: Json
          current_step?: number
          completed_steps?: string[]
          declaration_accepted?: boolean
          status?: 'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'
          frappe_employee_id?: string | null
          frappe_user_id?: string | null
          pushed_to_frappe_at?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      job_match_results: {
        Row: {
          id: string
          user_id: string
          job_id: string
          match_type: 'keyword' | 'ai'
          match_score: number
          matched_skills: string[]
          missing_skills: string[]
          analysis: Json
          resume_document_id: string | null
          computed_at: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          match_type: 'keyword' | 'ai'
          match_score: number
          matched_skills?: string[]
          missing_skills?: string[]
          analysis?: Json
          resume_document_id?: string | null
          computed_at?: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          match_type?: 'keyword' | 'ai'
          match_score?: number
          matched_skills?: string[]
          missing_skills?: string[]
          analysis?: Json
          resume_document_id?: string | null
          computed_at?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_match_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_match_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      action_center_tasks: {
        Row: {
          id: string
          user_id: string
          assigned_by: string | null
          title: string
          description: string | null
          task_type: 'onboarding_task' | 'document_upload' | 'form_fill' | 'custom'
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          completed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assigned_by?: string | null
          title: string
          description?: string | null
          task_type: 'onboarding_task' | 'document_upload' | 'form_fill' | 'custom'
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assigned_by?: string | null
          title?: string
          description?: string | null
          task_type?: 'onboarding_task' | 'document_upload' | 'form_fill' | 'custom'
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_center_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      action_center_requests: {
        Row: {
          id: string
          user_id: string
          request_type: string
          subject: string
          description: string | null
          status: 'open' | 'in_review' | 'approved' | 'rejected' | 'closed'
          attachments: string[]
          admin_notes: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          request_type: string
          subject: string
          description?: string | null
          status?: 'open' | 'in_review' | 'approved' | 'rejected' | 'closed'
          attachments?: string[]
          admin_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          subject?: string
          description?: string | null
          status?: 'open' | 'in_review' | 'approved' | 'rejected' | 'closed'
          attachments?: string[]
          admin_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_center_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sso_providers: {
        Row: {
          id: string
          provider_type: 'saml' | 'oidc' | 'frappe_sso'
          name: string
          is_enabled: boolean
          config: Json
          email_domain_restriction: string[]
          auto_create_profile: boolean
          default_role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_type: 'saml' | 'oidc' | 'frappe_sso'
          name: string
          is_enabled?: boolean
          config?: Json
          email_domain_restriction?: string[]
          auto_create_profile?: boolean
          default_role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_type?: 'saml' | 'oidc' | 'frappe_sso'
          name?: string
          is_enabled?: boolean
          config?: Json
          email_domain_restriction?: string[]
          auto_create_profile?: boolean
          default_role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_domains: {
        Row: {
          id: string
          domain: string
          company_name: string | null
          frappe_company_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          company_name?: string | null
          frappe_company_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          company_name?: string | null
          frappe_company_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
      environment_key: 'LOCAL' | 'DEV' | 'UAT' | 'PROD'
      lifecycle_stage: 'candidate' | 'applicant' | 'offered' | 'onboarding' | 'employee'
      onboarding_status: 'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'
      task_type: 'onboarding_task' | 'document_upload' | 'form_fill' | 'custom'
      task_status: 'pending' | 'in_progress' | 'completed' | 'overdue'
      request_status: 'open' | 'in_review' | 'approved' | 'rejected' | 'closed'
      match_type: 'keyword' | 'ai'
      sso_provider_type: 'saml' | 'oidc' | 'frappe_sso'
      job_visibility: 'internal' | 'external' | 'both'
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

export type FrappeEnvironment = Database['public']['Tables']['frappe_environments']['Row']
export type FrappeEnvironmentInsert = Database['public']['Tables']['frappe_environments']['Insert']
export type FrappeEnvironmentUpdate = Database['public']['Tables']['frappe_environments']['Update']

export type OnboardingData = Database['public']['Tables']['onboarding_data']['Row']
export type OnboardingDataInsert = Database['public']['Tables']['onboarding_data']['Insert']
export type OnboardingDataUpdate = Database['public']['Tables']['onboarding_data']['Update']

export type JobMatchResult = Database['public']['Tables']['job_match_results']['Row']
export type JobMatchResultInsert = Database['public']['Tables']['job_match_results']['Insert']
export type JobMatchResultUpdate = Database['public']['Tables']['job_match_results']['Update']

export type ActionCenterTask = Database['public']['Tables']['action_center_tasks']['Row']
export type ActionCenterTaskInsert = Database['public']['Tables']['action_center_tasks']['Insert']
export type ActionCenterTaskUpdate = Database['public']['Tables']['action_center_tasks']['Update']

export type ActionCenterRequest = Database['public']['Tables']['action_center_requests']['Row']
export type ActionCenterRequestInsert = Database['public']['Tables']['action_center_requests']['Insert']
export type ActionCenterRequestUpdate = Database['public']['Tables']['action_center_requests']['Update']

export type SSOProvider = Database['public']['Tables']['sso_providers']['Row']
export type SSOProviderInsert = Database['public']['Tables']['sso_providers']['Insert']
export type SSOProviderUpdate = Database['public']['Tables']['sso_providers']['Update']

export type CompanyDomain = Database['public']['Tables']['company_domains']['Row']
export type CompanyDomainInsert = Database['public']['Tables']['company_domains']['Insert']
export type CompanyDomainUpdate = Database['public']['Tables']['company_domains']['Update']

// Enum types
export type JobType = Database['public']['Enums']['job_type']
export type ExperienceLevel = Database['public']['Enums']['experience_level']
export type ApplicationStatus = Database['public']['Enums']['application_status']
export type NotificationType = Database['public']['Enums']['notification_type']
export type DocumentType = Database['public']['Enums']['document_type']
export type FeatureFlagValueType = 'boolean' | 'string' | 'number' | 'json'
export type EnvironmentKey = Database['public']['Enums']['environment_key']
export type LifecycleStage = Database['public']['Enums']['lifecycle_stage']
export type OnboardingStatus = Database['public']['Enums']['onboarding_status']
export type TaskType = Database['public']['Enums']['task_type']
export type TaskStatus = Database['public']['Enums']['task_status']
export type RequestStatus = Database['public']['Enums']['request_status']
export type MatchType = Database['public']['Enums']['match_type']
export type SSOProviderType = Database['public']['Enums']['sso_provider_type']
export type JobVisibility = Database['public']['Enums']['job_visibility']