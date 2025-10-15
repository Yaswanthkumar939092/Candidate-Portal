-- Database Indexes for Performance Optimization
-- Project ID: luniiecxbsyajdfjtsox
-- This migration creates all performance indexes for the candidate portal

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Email lookup (already unique, but optimize for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users(email);

-- Role-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON public.users(is_active);

-- Login tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC);

-- Composite index for active users by role
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_role ON public.users(is_active, role);

-- ============================================================================
-- USER PROFILES TABLE INDEXES
-- ============================================================================

-- User profile lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Skills search using GIN for array operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_skills ON public.user_profiles USING GIN(skills);

-- Experience and education JSONB indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_experience ON public.user_profiles USING GIN(experience);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_education ON public.user_profiles USING GIN(education);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_preferences ON public.user_profiles USING GIN(preferences);

-- ============================================================================
-- COMPANIES TABLE INDEXES
-- ============================================================================

-- Company name search (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON public.companies(LOWER(name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- Industry and size filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_size ON public.companies(size);

-- Location-based searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_location ON public.companies(location);

-- Verified companies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_verified ON public.companies(is_verified);

-- Composite index for active verified companies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_verified_industry ON public.companies(is_verified, industry);

-- ============================================================================
-- JOB CATEGORIES TABLE INDEXES
-- ============================================================================

-- Category name and slug lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_categories_name ON public.job_categories(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_categories_slug ON public.job_categories(slug);

-- Active categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_categories_active ON public.job_categories(is_active);

-- ============================================================================
-- JOBS TABLE INDEXES
-- ============================================================================

-- Job status for listing active jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Company relation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);

-- Location-based job searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON public.jobs(location);

-- Job categorization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_department ON public.jobs(department);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_employment_type ON public.jobs(employment_type);

-- Tags for skill-based searches (GIN index for array operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_tags ON public.jobs USING GIN(tags);

-- Date-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);

-- Featured and remote jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_featured ON public.jobs(is_featured);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_remote ON public.jobs(is_remote);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_search ON public.jobs USING GIN(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_description_search ON public.jobs USING GIN(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_requirements_search ON public.jobs USING GIN(to_tsvector('english', requirements));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_posted ON public.jobs(status, posted_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_location ON public.jobs(status, location) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_remote ON public.jobs(status, is_remote) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_featured ON public.jobs(status, is_featured, posted_at DESC) WHERE status = 'active';

-- Salary range searches (using JSONB operators)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_range ON public.jobs USING GIN(salary_range);

-- Frappe job ID for synchronization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_frappe_job_id ON public.jobs(frappe_job_id);

-- ============================================================================
-- JOB CATEGORY MAPPINGS TABLE INDEXES
-- ============================================================================

-- Foreign key indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_category_mappings_job_id ON public.job_category_mappings(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_category_mappings_category_id ON public.job_category_mappings(category_id);

-- ============================================================================
-- APPLICATIONS TABLE INDEXES
-- ============================================================================

-- User applications lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);

-- Job applications lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);

-- Application status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Application date ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_applied_at ON public.applications(applied_at DESC);

-- Composite indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_applied_at ON public.applications(user_id, applied_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_status ON public.applications(job_id, status);

-- Admin dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status_applied_at ON public.applications(status, applied_at DESC);

-- ============================================================================
-- APPLICATION STATUS HISTORY TABLE INDEXES
-- ============================================================================

-- Application history lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_history_application_id ON public.application_status_history(application_id);

-- Status change tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_history_status ON public.application_status_history(status);

-- Who made the change
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_history_changed_by ON public.application_status_history(changed_by);

-- Chronological order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_history_changed_at ON public.application_status_history(changed_at DESC);

-- Composite index for application timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_history_timeline ON public.application_status_history(application_id, changed_at DESC);

-- ============================================================================
-- SAVED JOBS TABLE INDEXES
-- ============================================================================

-- User's saved jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

-- Which jobs are saved by whom
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);

-- When jobs were saved
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_saved_at ON public.saved_jobs(saved_at DESC);

-- User's saved jobs ordered by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_user_saved_at ON public.saved_jobs(user_id, saved_at DESC);

-- ============================================================================
-- DOCUMENTS TABLE INDEXES
-- ============================================================================

-- User's documents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Document type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type ON public.documents(type);

-- Primary documents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_primary ON public.documents(is_primary);

-- Upload date ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_uploaded_at ON public.documents(uploaded_at DESC);

-- Composite indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_type ON public.documents(user_id, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_primary ON public.documents(user_id, is_primary);

-- ============================================================================
-- INTERVIEWS TABLE INDEXES
-- ============================================================================

-- Application's interviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);

-- Scheduled interviews by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);

-- Interview status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_status ON public.interviews(status);

-- Interviewer's schedule
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_interviewer_id ON public.interviews(interviewer_id);

-- Interview type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_type ON public.interviews(type);

-- Composite indexes for scheduling
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_interviewer_scheduled ON public.interviews(interviewer_id, scheduled_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_status_scheduled ON public.interviews(status, scheduled_at);

-- Upcoming interviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_upcoming ON public.interviews(scheduled_at)
  WHERE status IN ('scheduled', 'rescheduled') AND scheduled_at > NOW();

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- User's notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- Notification type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Creation date ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Composite indexes for notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);

-- Recent unread notifications (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recent_unread ON public.notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- ============================================================================
-- SYSTEM SETTINGS TABLE INDEXES
-- ============================================================================

-- Settings key lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

-- Public settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_public ON public.system_settings(is_public);

-- Settings value search (GIN for JSONB)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_value ON public.system_settings USING GIN(value);

-- ============================================================================
-- AUDIT LOG TABLE INDEXES
-- ============================================================================

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

-- Resource tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_resource ON public.audit_log(resource_type, resource_id);

-- Action tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

-- Chronological access
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Composite indexes for audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_action ON public.audit_log(user_id, action, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_resource_action ON public.audit_log(resource_type, resource_id, created_at DESC);

-- Recent activity (commonly queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_recent ON public.audit_log(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '30 days';

-- IP address tracking for security
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_ip_address ON public.audit_log(ip_address);

-- JSONB indexes for audit values
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_old_values ON public.audit_log USING GIN(old_values);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_new_values ON public.audit_log USING GIN(new_values);

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERED QUERIES
-- ============================================================================

-- Active jobs only (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_only ON public.jobs(posted_at DESC, is_featured DESC)
  WHERE status = 'active';

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_only ON public.users(created_at DESC)
  WHERE is_active = true;

-- Recent applications (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_recent ON public.applications(applied_at DESC)
  WHERE applied_at > NOW() - INTERVAL '30 days';

-- Pending applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_pending ON public.applications(applied_at DESC)
  WHERE status IN ('applied', 'review');

-- Scheduled interviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_scheduled_only ON public.interviews(scheduled_at)
  WHERE status = 'scheduled';

-- ============================================================================
-- SEARCH OPTIMIZATION
-- ============================================================================

-- Combined full-text search index for jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_full_text_search ON public.jobs
  USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(requirements, '')));

-- Company search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search ON public.companies
  USING GIN(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Create a function to analyze slow queries
CREATE OR REPLACE FUNCTION public.analyze_slow_queries()
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    LEFT(query, 100) as query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    rows
  FROM pg_stat_statements
  WHERE mean_exec_time > 100  -- queries taking more than 100ms on average
  ORDER BY mean_exec_time DESC
  LIMIT 20;
EXCEPTION
  WHEN others THEN
    -- pg_stat_statements might not be enabled
    RAISE NOTICE 'pg_stat_statements extension not available';
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get index usage statistics
CREATE OR REPLACE FUNCTION public.get_index_usage_stats()
RETURNS TABLE(
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname::TEXT,
    tablename::TEXT,
    indexname::TEXT,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to identify unused indexes
CREATE OR REPLACE FUNCTION public.get_unused_indexes()
RETURNS TABLE(
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  index_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.schemaname::TEXT,
    s.tablename::TEXT,
    s.indexname::TEXT,
    pg_size_pretty(pg_relation_size(s.indexname::regclass))::TEXT as index_size
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.idx_scan = 0      -- Never used
    AND NOT i.indisunique   -- Not a unique index
    AND NOT i.indisprimary  -- Not a primary key
    AND s.schemaname = 'public'
  ORDER BY pg_relation_size(s.indexname::regclass) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;