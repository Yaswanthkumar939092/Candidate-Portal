-- Initial Database Schema for Job Candidate Portal
-- Project ID: luniiecxbsyajdfjtsox
-- This migration creates all core tables for the candidate portal

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with additional candidate information
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  skills TEXT[] DEFAULT '{}',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  website VARCHAR(255),
  logo_url TEXT,
  industry VARCHAR(100),
  size VARCHAR(50),
  location VARCHAR(255),
  founded_year INTEGER,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job categories for better organization
CREATE TABLE public.job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table (synced from Frappe ERPNext)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frappe_job_id VARCHAR(100) UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  department VARCHAR(100),
  experience_level VARCHAR(50),
  job_type VARCHAR(50),
  employment_type VARCHAR(50),
  salary_range JSONB,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  responsibilities TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'closed')),
  is_featured BOOLEAN DEFAULT false,
  is_remote BOOLEAN DEFAULT false,
  posted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job category mappings
CREATE TABLE public.job_category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.job_categories(id) ON DELETE CASCADE,
  UNIQUE(job_id, category_id)
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'review', 'interview', 'offer', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  resume_url TEXT,
  additional_documents JSONB DEFAULT '[]',
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Application status history for tracking changes
CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved jobs for candidates
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Documents table for file management
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('resume', 'cover-letter', 'portfolio', 'certificate', 'other')),
  url TEXT NOT NULL,
  size INTEGER,
  mime_type VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview schedules
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60,
  type VARCHAR(50) DEFAULT 'video' CHECK (type IN ('video', 'phone', 'in-person')),
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  interviewer_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings for configuration
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for tracking changes
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'candidate'
  );

  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id UUID,
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100),
  p_phone VARCHAR(20),
  p_location VARCHAR(255),
  p_bio TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET
    first_name = p_first_name,
    last_name = p_last_name,
    phone = p_phone,
    location = p_location,
    bio = p_bio,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log audit event
  INSERT INTO public.audit_log (user_id, action, resource_type, resource_id, new_values)
  VALUES (p_user_id, 'profile_updated', 'user', p_user_id, jsonb_build_object(
    'first_name', p_first_name,
    'last_name', p_last_name,
    'phone', p_phone,
    'location', p_location,
    'bio', p_bio
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_applications', (
      SELECT COUNT(*) FROM public.applications WHERE user_id = p_user_id
    ),
    'saved_jobs', (
      SELECT COUNT(*) FROM public.saved_jobs WHERE user_id = p_user_id
    ),
    'documents', (
      SELECT COUNT(*) FROM public.documents WHERE user_id = p_user_id
    ),
    'interviews', (
      SELECT COUNT(*) FROM public.interviews i
      JOIN public.applications a ON i.application_id = a.id
      WHERE a.user_id = p_user_id
    ),
    'unread_notifications', (
      SELECT COUNT(*) FROM public.notifications WHERE user_id = p_user_id AND is_read = false
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast application status changes
CREATE OR REPLACE FUNCTION public.broadcast_application_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the user about application status change
  PERFORM pg_notify(
    'application-updates',
    json_build_object(
      'type', 'application_updated',
      'application_id', NEW.id,
      'user_id', NEW.user_id,
      'status', NEW.status,
      'updated_at', NEW.updated_at
    )::text
  );

  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'application_update',
    'Application Status Updated',
    'Your application status has been updated to ' || NEW.status,
    jsonb_build_object(
      'application_id', NEW.id,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for application updates
CREATE TRIGGER on_application_updated
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_application_update();

-- Function to broadcast new interview schedules
CREATE OR REPLACE FUNCTION public.broadcast_interview_schedule()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user_id from application
  SELECT a.user_id INTO user_id
  FROM public.applications a
  WHERE a.id = NEW.application_id;

  -- Notify the user about new interview
  PERFORM pg_notify(
    'interview-schedules',
    json_build_object(
      'type', 'interview_scheduled',
      'interview_id', NEW.id,
      'user_id', user_id,
      'scheduled_at', NEW.scheduled_at,
      'type', NEW.type
    )::text
  );

  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    user_id,
    'interview_scheduled',
    'Interview Scheduled',
    'A new interview has been scheduled for you',
    jsonb_build_object(
      'interview_id', NEW.id,
      'scheduled_at', NEW.scheduled_at,
      'type', NEW.type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for interview schedules
CREATE TRIGGER on_interview_scheduled
  AFTER INSERT ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_interview_schedule();

-- Function to get database statistics
CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.users),
    'active_users', (SELECT COUNT(*) FROM public.users WHERE is_active = true),
    'total_jobs', (SELECT COUNT(*) FROM public.jobs),
    'active_jobs', (SELECT COUNT(*) FROM public.jobs WHERE status = 'active'),
    'total_applications', (SELECT COUNT(*) FROM public.applications),
    'total_companies', (SELECT COUNT(*) FROM public.companies),
    'verified_companies', (SELECT COUNT(*) FROM public.companies WHERE is_verified = true),
    'total_documents', (SELECT COUNT(*) FROM public.documents),
    'total_interviews', (SELECT COUNT(*) FROM public.interviews),
    'pending_notifications', (SELECT COUNT(*) FROM public.notifications WHERE is_read = false)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity stats
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'new_users', (
      SELECT COUNT(*) FROM public.users
      WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    'new_applications', (
      SELECT COUNT(*) FROM public.applications
      WHERE applied_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    'new_jobs', (
      SELECT COUNT(*) FROM public.jobs
      WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    'active_users', (
      SELECT COUNT(DISTINCT user_id) FROM public.applications
      WHERE applied_at >= NOW() - INTERVAL '1 day' * p_days
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize user data for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Anonymize user profile
  UPDATE public.users
  SET
    first_name = 'Anonymous',
    last_name = 'User',
    email = 'anonymized@example.com',
    phone = NULL,
    location = NULL,
    bio = NULL,
    avatar_url = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Anonymize user profile data
  UPDATE public.user_profiles
  SET
    skills = '{}',
    experience = '[]',
    education = '[]',
    preferences = '{}',
    social_links = '{}',
    availability = '{}',
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Anonymize documents (mark as deleted)
  UPDATE public.documents
  SET
    name = 'Anonymized Document',
    url = NULL
  WHERE user_id = p_user_id;

  -- Log anonymization event
  INSERT INTO public.audit_log (user_id, action, resource_type, resource_id)
  VALUES (p_user_id, 'data_anonymized', 'user', p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers for timestamp fields
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();