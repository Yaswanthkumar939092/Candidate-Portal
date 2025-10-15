-- Row Level Security (RLS) Policies for Job Candidate Portal
-- Project ID: luniiecxbsyajdfjtsox
-- This migration sets up comprehensive RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

-- Admins can update user roles and status
CREATE POLICY "Admins can manage users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- Super admins can delete users
CREATE POLICY "Super admins can delete users" ON public.users
  FOR DELETE USING (public.is_super_admin());

-- ============================================================================
-- USER PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own user profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own profile
CREATE POLICY "Users can manage own user profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all user profiles
CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
  FOR SELECT USING (public.is_admin());

-- ============================================================================
-- COMPANIES TABLE POLICIES
-- ============================================================================

-- Companies are publicly readable for active ones
CREATE POLICY "Companies are publicly readable" ON public.companies
  FOR SELECT USING (true);

-- Admins can manage companies
CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- JOB CATEGORIES TABLE POLICIES
-- ============================================================================

-- Job categories are publicly readable for active ones
CREATE POLICY "Job categories are publicly readable" ON public.job_categories
  FOR SELECT USING (is_active = true OR public.is_admin());

-- Admins can manage job categories
CREATE POLICY "Admins can manage job categories" ON public.job_categories
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================

-- Jobs are publicly readable when active
CREATE POLICY "Active jobs are publicly readable" ON public.jobs
  FOR SELECT USING (status = 'active' OR public.is_admin());

-- Admins can manage all jobs
CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- JOB CATEGORY MAPPINGS TABLE POLICIES
-- ============================================================================

-- Job category mappings are publicly readable
CREATE POLICY "Job category mappings are publicly readable" ON public.job_category_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_category_mappings.job_id AND status = 'active'
    ) OR public.is_admin()
  );

-- Admins can manage job category mappings
CREATE POLICY "Admins can manage job category mappings" ON public.job_category_mappings
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- APPLICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can withdraw their own applications
CREATE POLICY "Users can withdraw own applications" ON public.applications
  FOR UPDATE USING (
    auth.uid() = user_id AND
    status = 'withdrawn'
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (public.is_admin());

-- Admins can update application status
CREATE POLICY "Admins can manage applications" ON public.applications
  FOR UPDATE USING (public.is_admin());

-- ============================================================================
-- APPLICATION STATUS HISTORY TABLE POLICIES
-- ============================================================================

-- Users can view their own application status history
CREATE POLICY "Users can view own application history" ON public.application_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_status_history.application_id AND user_id = auth.uid()
    )
  );

-- Admins can view all application status history
CREATE POLICY "Admins can view all application history" ON public.application_status_history
  FOR SELECT USING (public.is_admin());

-- Admins can create status history entries
CREATE POLICY "Admins can create application history" ON public.application_status_history
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================================================================
-- SAVED JOBS TABLE POLICIES
-- ============================================================================

-- Users can view their own saved jobs
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own saved jobs
CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- DOCUMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own documents
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all documents (for compliance/audit)
CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (public.is_admin());

-- ============================================================================
-- INTERVIEWS TABLE POLICIES
-- ============================================================================

-- Users can view their own interviews
CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = interviews.application_id AND user_id = auth.uid()
    )
  );

-- Admins can view all interviews
CREATE POLICY "Admins can view all interviews" ON public.interviews
  FOR SELECT USING (public.is_admin());

-- Admins can manage all interviews
CREATE POLICY "Admins can manage interviews" ON public.interviews
  FOR ALL USING (public.is_admin());

-- Interviewers can view interviews they are assigned to
CREATE POLICY "Interviewers can view assigned interviews" ON public.interviews
  FOR SELECT USING (auth.uid() = interviewer_id);

-- Interviewers can update interviews they are assigned to
CREATE POLICY "Interviewers can update assigned interviews" ON public.interviews
  FOR UPDATE USING (auth.uid() = interviewer_id);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = user_id AND
    OLD.is_read = false AND NEW.is_read = true
  );

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (public.is_admin());

-- ============================================================================
-- SYSTEM SETTINGS TABLE POLICIES
-- ============================================================================

-- Public settings are readable by everyone
CREATE POLICY "Public settings are readable" ON public.system_settings
  FOR SELECT USING (is_public = true OR public.is_admin());

-- Admins can manage all settings
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- AUDIT LOG TABLE POLICIES
-- ============================================================================

-- Admins can view audit log
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (public.is_admin());

-- System can create audit log entries
CREATE POLICY "System can create audit entries" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- Super admins can delete old audit entries
CREATE POLICY "Super admins can delete audit entries" ON public.audit_log
  FOR DELETE USING (public.is_super_admin());

-- ============================================================================
-- STORAGE BUCKET POLICIES
-- ============================================================================

-- Resumes bucket policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own resumes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can update own resumes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own resumes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documents bucket policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.is_admin()
    )
  );

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars bucket policies (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Company logos bucket policies (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company logos are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can manage company logos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'company-logos' AND
    public.is_admin()
  );

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to validate user permissions
CREATE OR REPLACE FUNCTION public.validate_user_permission(
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  resource_owner UUID;
BEGIN
  -- Get current user role
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();

  -- Super admins have all permissions
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Admins have most permissions
  IF user_role = 'admin' AND p_action != 'super_admin_only' THEN
    RETURN true;
  END IF;

  -- Check resource-specific permissions
  CASE p_resource_type
    WHEN 'application' THEN
      SELECT user_id INTO resource_owner
      FROM public.applications
      WHERE id = p_resource_id;

      RETURN resource_owner = auth.uid() OR user_role IN ('admin', 'super_admin');

    WHEN 'document' THEN
      SELECT user_id INTO resource_owner
      FROM public.documents
      WHERE id = p_resource_id;

      RETURN resource_owner = auth.uid() OR user_role IN ('admin', 'super_admin');

    WHEN 'user_profile' THEN
      SELECT user_id INTO resource_owner
      FROM public.user_profiles
      WHERE id = p_resource_id;

      RETURN resource_owner = auth.uid() OR user_role IN ('admin', 'super_admin');

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;