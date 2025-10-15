-- Simplified Database Schema for Job Candidate Portal
-- This creates the essential tables using Supabase-compatible syntax

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (simplified version of users + user_profiles combined)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  skills TEXT[],
  experience_level VARCHAR(50) DEFAULT 'entry' CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead')),
  preferred_salary_min INTEGER,
  preferred_salary_max INTEGER,
  preferred_job_types TEXT[],
  role VARCHAR(50) DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin', 'super_admin')),
  provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frappe_company_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  logo_url TEXT,
  location VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(20) CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  is_active BOOLEAN DEFAULT true,
  frappe_created_at TIMESTAMP WITH TIME ZONE,
  frappe_updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frappe_job_id VARCHAR(255) UNIQUE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  company_logo TEXT,
  description TEXT NOT NULL,
  requirements TEXT[],
  benefits TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  location VARCHAR(255) NOT NULL,
  job_type VARCHAR(50) DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
  experience_level VARCHAR(50) DEFAULT 'mid' CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead')),
  skills_required TEXT[],
  application_deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  posted_by UUID REFERENCES public.profiles(id),
  frappe_created_at TIMESTAMP WITH TIME ZONE,
  frappe_updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frappe_application_id VARCHAR(255) UNIQUE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  rejection_reason TEXT,
  frappe_applied_at TIMESTAMP WITH TIME ZONE,
  frappe_updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(job_id, candidate_id)
);

-- Saved jobs table
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system' CHECK (type IN ('application_update', 'job_match', 'interview_scheduled', 'system')),
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User documents table
CREATE TABLE public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'other' CHECK (type IN ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings table
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  frappe_url TEXT,
  frappe_api_key TEXT,
  frappe_api_secret TEXT,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags table
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  default_value JSONB DEFAULT 'false',
  value_type VARCHAR(50) DEFAULT 'boolean' CHECK (value_type IN ('boolean', 'string', 'number', 'json')),
  tags TEXT[] DEFAULT '{}',
  environments TEXT[] DEFAULT '{"production"}',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flag overrides table
CREATE TABLE public.feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID REFERENCES public.feature_flags(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_flag_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_jobs_title ON public.jobs(title);
CREATE INDEX idx_jobs_company ON public.jobs(company);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_applied_at ON public.applications(applied_at);
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON public.saved_jobs(job_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_type ON public.user_documents(type);
CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public profile data" ON public.profiles
  FOR SELECT USING (true);

-- Jobs policies
CREATE POLICY "Anyone can view active jobs" ON public.jobs
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Applications policies
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Users can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Users can update their own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = candidate_id);

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Saved jobs policies
CREATE POLICY "Users can manage their saved jobs" ON public.saved_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User documents policies
CREATE POLICY "Users can manage their own documents" ON public.user_documents
  FOR ALL USING (auth.uid() = user_id);

-- Admin settings policies
CREATE POLICY "Admins can manage admin settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Feature flags policies
CREATE POLICY "Anyone can view enabled feature flags" ON public.feature_flags
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Feature flag overrides policies
CREATE POLICY "Users can view their own feature flag overrides" ON public.feature_flag_overrides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage feature flag overrides" ON public.feature_flag_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Insert some sample data

-- Sample companies
INSERT INTO public.companies (name, description, website, location, industry, size) VALUES
('TechCorp Inc.', 'Leading technology company specializing in cloud solutions', 'https://techcorp.com', 'San Francisco, CA', 'Technology', '501-1000'),
('StartupXYZ', 'Innovative startup building the future of work', 'https://startupxyz.com', 'Remote', 'Technology', '11-50'),
('Design Studio', 'Creative agency focused on user experience design', 'https://designstudio.com', 'New York, NY', 'Design', '51-200'),
('CloudTech Solutions', 'Cloud infrastructure and DevOps specialists', 'https://cloudtech.com', 'Austin, TX', 'Technology', '201-500'),
('InnovateNow', 'Product development and innovation consultancy', 'https://innovatenow.com', 'Seattle, WA', 'Consulting', '51-200'),
('DataCorp', 'Big data analytics and machine learning platform', 'https://datacorp.com', 'Boston, MA', 'Technology', '501-1000');

-- Sample feature flags
INSERT INTO public.feature_flags (key, name, description, is_enabled, default_value, value_type, tags) VALUES
('oauth_google_enabled', 'Google OAuth Login', 'Enable Google OAuth authentication', false, 'false', 'boolean', '{"authentication", "oauth"}'),
('oauth_linkedin_enabled', 'LinkedIn OAuth Login', 'Enable LinkedIn OAuth authentication', false, 'false', 'boolean', '{"authentication", "oauth"}'),
('job_applications_enabled', 'Job Applications', 'Enable job application functionality', true, 'true', 'boolean', '{"jobs", "applications"}'),
('document_uploads_enabled', 'Document Uploads', 'Enable document upload functionality', true, 'true', 'boolean', '{"documents", "uploads"}'),
('admin_dashboard_enabled', 'Admin Dashboard', 'Enable admin dashboard features', true, 'true', 'boolean', '{"admin", "dashboard"}'),
('social_sharing_enabled', 'Social Job Sharing', 'Enable social media job sharing', true, 'true', 'boolean', '{"social", "sharing"}');

-- Update RLS to be more permissive for development
-- Companies can be viewed by anyone
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view companies" ON public.companies
  FOR SELECT USING (true);