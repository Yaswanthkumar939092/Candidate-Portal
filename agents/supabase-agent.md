# Supabase Agent Specification
## Job Candidate Portal - Supabase Development Agent

### Agent Overview
The Supabase Agent is responsible for configuring, managing, and optimizing the Supabase infrastructure for the Job Candidate Portal. This agent focuses on database design, authentication setup, real-time features, storage management, and Edge Functions to create a scalable and secure backend foundation.

### Core Responsibilities

#### 1. Database Architecture & Management
- **Schema Design**: Design and implement PostgreSQL schemas optimized for job portal use cases
- **Migration Management**: Version-controlled database migrations and schema updates
- **Performance Optimization**: Indexing strategies, query optimization, and performance monitoring
- **Data Integrity**: Constraints, triggers, and data validation rules
- **Backup & Recovery**: Automated backup strategies and disaster recovery procedures

#### 2. Authentication & Authorization
- **User Management**: Supabase Auth configuration and user lifecycle management
- **OAuth Integration**: Google, LinkedIn, and other OAuth provider setup
- **Row Level Security**: Comprehensive RLS policies for data access control
- **JWT Management**: Token configuration and security policies
- **Multi-Factor Authentication**: MFA setup and configuration

#### 3. Real-time Features
- **Real-time Subscriptions**: Live updates for applications, interviews, and notifications
- **Presence System**: User presence tracking and online status
- **Live Collaboration**: Real-time collaboration features for admin panels
- **Event Broadcasting**: Custom event broadcasting for application updates

#### 4. Storage & File Management
- **File Storage**: Secure file upload and management for resumes, documents
- **Image Processing**: Automatic image resizing and optimization
- **CDN Integration**: Global content delivery for uploaded files
- **Access Control**: File-level permissions and secure access

#### 5. Edge Functions & API
- **Serverless Functions**: Edge Functions for custom business logic
- **API Gateway**: Custom API endpoints and middleware
- **Webhook Processing**: Incoming webhook handling and validation
- **Third-party Integrations**: External service integrations via Edge Functions

### Technical Stack

#### Core Supabase Services
```typescript
// Supabase Services Configuration
const supabaseConfig = {
  // Database
  database: {
    provider: 'PostgreSQL',
    version: '15+',
    extensions: [
      'uuid-ossp',
      'pgcrypto',
      'pg_trgm',
      'unaccent',
      'postgis'
    ],
    connectionPooling: true,
    maxConnections: 100
  },

  // Authentication
  auth: {
    providers: ['email', 'google', 'linkedin'],
    emailConfirmation: true,
    passwordReset: true,
    sessionTimeout: 3600, // 1 hour
    refreshTokenRotation: true,
    multiFactorAuth: true
  },

  // Storage
  storage: {
    buckets: [
      'resumes',
      'documents',
      'avatars',
      'company-logos'
    ],
    maxFileSize: '50MB',
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  },

  // Real-time
  realtime: {
    enabled: true,
    channels: [
      'application-updates',
      'interview-schedules',
      'notifications',
      'admin-dashboard'
    ]
  },

  // Edge Functions
  edgeFunctions: {
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    timeout: 30,
    memory: 256
  }
};
```

### Database Schema Implementation

#### 1. Core Tables Setup
```sql
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

-- Job category mappings
CREATE TABLE public.job_category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.job_categories(id) ON DELETE CASCADE,
  UNIQUE(job_id, category_id)
);
```

#### 2. Performance Indexes
```sql
-- Performance indexes for optimal query performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);

CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_department ON public.jobs(department);
CREATE INDEX idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_tags ON public.jobs USING GIN(tags);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at);
CREATE INDEX idx_jobs_featured ON public.jobs(is_featured);
CREATE INDEX idx_jobs_remote ON public.jobs(is_remote);

-- Full-text search indexes
CREATE INDEX idx_jobs_title_search ON public.jobs USING GIN(to_tsvector('english', title));
CREATE INDEX idx_jobs_description_search ON public.jobs USING GIN(to_tsvector('english', description));
CREATE INDEX idx_jobs_requirements_search ON public.jobs USING GIN(to_tsvector('english', requirements));

CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_applied_at ON public.applications(applied_at);

CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON public.saved_jobs(job_id);

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_type ON public.documents(type);
CREATE INDEX idx_documents_primary ON public.documents(is_primary);

CREATE INDEX idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled_at ON public.interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON public.interviews(status);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
```

#### 3. Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Companies policies (publicly readable)
CREATE POLICY "Companies are publicly readable" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Jobs policies
CREATE POLICY "Jobs are publicly readable" ON public.jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Applications policies
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Saved jobs policies
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Interviews policies
CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications 
      WHERE id = interviews.application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all interviews" ON public.interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System settings policies
CREATE POLICY "Public settings are readable" ON public.system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Audit log policies (admin only)
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

### Authentication Configuration

#### 1. Supabase Auth Setup
```typescript
// supabase/config/auth.ts
export const authConfig = {
  // Email configuration
  email: {
    confirmation: {
      enabled: true,
      template: 'confirm-signup',
      redirectTo: `${process.env.FRONTEND_URL}/auth/confirm`
    },
    passwordReset: {
      enabled: true,
      template: 'reset-password',
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`
    },
    magicLink: {
      enabled: true,
      template: 'magic-link',
      redirectTo: `${process.env.FRONTEND_URL}/auth/magic-link`
    }
  },

  // OAuth providers
  oauth: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.SUPABASE_URL}/auth/v1/callback/google`
    },
    linkedin: {
      enabled: true,
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      redirectUri: `${process.env.SUPABASE_URL}/auth/v1/callback/linkedin`
    }
  },

  // Session configuration
  session: {
    timeout: 3600, // 1 hour
    refreshTokenRotation: true,
    refreshTokenExpiry: 2592000, // 30 days
    accessTokenExpiry: 3600 // 1 hour
  },

  // Multi-factor authentication
  mfa: {
    enabled: true,
    providers: ['totp'],
    backupCodes: true
  },

  // Security settings
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    maxLoginAttempts: 5,
    lockoutDuration: 900 // 15 minutes
  }
};
```

#### 2. Custom Auth Functions
```sql
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
```

### Storage Configuration

#### 1. Storage Buckets Setup
```typescript
// supabase/config/storage.ts
export const storageConfig = {
  buckets: [
    {
      name: 'resumes',
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      transform: {
        enabled: true,
        width: 800,
        height: 1000,
        quality: 80
      }
    },
    {
      name: 'documents',
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
    },
    {
      name: 'avatars',
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp'
      ],
      transform: {
        enabled: true,
        width: 200,
        height: 200,
        quality: 80
      }
    },
    {
      name: 'company-logos',
      public: true,
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml'
      ],
      transform: {
        enabled: true,
        width: 300,
        height: 300,
        quality: 90
      }
    }
  ]
};
```

#### 2. Storage Policies
```sql
-- Storage policies for file access control
CREATE POLICY "Users can upload own resumes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
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

-- Avatars are publicly readable
CREATE POLICY "Avatars are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Company logos are publicly readable
CREATE POLICY "Company logos are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can manage company logos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

### Real-time Configuration

#### 1. Real-time Channels Setup
```typescript
// supabase/config/realtime.ts
export const realtimeConfig = {
  channels: [
    {
      name: 'application-updates',
      description: 'Real-time updates for job applications',
      events: ['INSERT', 'UPDATE', 'DELETE'],
      filter: 'user_id=eq.auth.uid()',
      enabled: true
    },
    {
      name: 'interview-schedules',
      description: 'Real-time interview schedule updates',
      events: ['INSERT', 'UPDATE', 'DELETE'],
      filter: 'application_id=in.(SELECT id FROM applications WHERE user_id=eq.auth.uid())',
      enabled: true
    },
    {
      name: 'notifications',
      description: 'Real-time notifications',
      events: ['INSERT'],
      filter: 'user_id=eq.auth.uid()',
      enabled: true
    },
    {
      name: 'admin-dashboard',
      description: 'Admin dashboard real-time updates',
      events: ['INSERT', 'UPDATE', 'DELETE'],
      filter: 'role=in.(admin,super_admin)',
      enabled: true
    }
  ]
};
```

#### 2. Real-time Functions
```sql
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
```

### Edge Functions Implementation

#### 1. Job Synchronization Function
```typescript
// supabase/functions/sync-jobs/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      throw new Error('Insufficient permissions');
    }

    // Fetch jobs from Frappe ERPNext
    const frappeResponse = await fetch(`${Deno.env.get('FRAPPE_URL')}/api/method/frappe.client.get_list`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${Deno.env.get('FRAPPE_API_KEY')}:${Deno.env.get('FRAPPE_API_SECRET')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctype: 'Job Opening',
        filters: { status: 'Open' },
        fields: ['name', 'job_title', 'company', 'location', 'department', 'experience_level', 'job_type', 'salary_min', 'salary_max', 'description', 'requirements', 'benefits', 'posted_date', 'expiry_date']
      })
    });

    if (!frappeResponse.ok) {
      throw new Error('Failed to fetch jobs from Frappe');
    }

    const frappeJobs = await frappeResponse.json();

    let synced = 0;
    const errors: string[] = [];

    for (const frappeJob of frappeJobs.data) {
      try {
        // Check if company exists
        let companyId;
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', frappeJob.company)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: frappeJob.company,
              slug: frappeJob.company.toLowerCase().replace(/\s+/g, '-'),
              is_verified: false
            })
            .select('id')
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.id;
        }

        // Check if job already exists
        const { data: existingJob } = await supabase
          .from('jobs')
          .select('id')
          .eq('frappe_job_id', frappeJob.name)
          .single();

        const jobData = {
          frappe_job_id: frappeJob.name,
          company_id: companyId,
          title: frappeJob.job_title,
          slug: frappeJob.job_title.toLowerCase().replace(/\s+/g, '-'),
          location: frappeJob.location,
          department: frappeJob.department,
          experience_level: frappeJob.experience_level,
          job_type: frappeJob.job_type,
          salary_range: {
            min: frappeJob.salary_min,
            max: frappeJob.salary_max
          },
          description: frappeJob.description,
          requirements: frappeJob.requirements,
          benefits: frappeJob.benefits,
          status: 'active',
          posted_at: frappeJob.posted_date,
          expires_at: frappeJob.expiry_date
        };

        if (existingJob) {
          // Update existing job
          await supabase
            .from('jobs')
            .update(jobData)
            .eq('id', existingJob.id);
        } else {
          // Create new job
          await supabase
            .from('jobs')
            .insert(jobData);
        }

        synced++;
      } catch (error) {
        errors.push(`Failed to sync job ${frappeJob.name}: ${error.message}`);
      }
    }

    // Log sync event
    await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'job_sync',
        resource_type: 'system',
        new_values: {
          synced,
          errors: errors.length,
          total_jobs: frappeJobs.data.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        errors,
        message: `Synced ${synced} jobs successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

#### 2. Email Notification Function
```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, type, data } = await req.json();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    let emailSubject = '';
    let emailBody = '';

    switch (type) {
      case 'application_submitted':
        emailSubject = 'Application Submitted Successfully';
        emailBody = `
          Hi ${user.first_name},
          
          Your application has been submitted successfully for the position of ${data.jobTitle} at ${data.company}.
          
          We will review your application and get back to you soon.
          
          Best regards,
          The Hiring Team
        `;
        break;

      case 'interview_scheduled':
        emailSubject = 'Interview Scheduled';
        emailBody = `
          Hi ${user.first_name},
          
          An interview has been scheduled for you:
          
          Position: ${data.jobTitle}
          Company: ${data.company}
          Date: ${new Date(data.scheduledAt).toLocaleDateString()}
          Time: ${new Date(data.scheduledAt).toLocaleTimeString()}
          Type: ${data.type}
          
          ${data.meetingLink ? `Meeting Link: ${data.meetingLink}` : ''}
          
          Best regards,
          The Hiring Team
        `;
        break;

      case 'application_status_update':
        emailSubject = 'Application Status Update';
        emailBody = `
          Hi ${user.first_name},
          
          Your application status has been updated:
          
          Position: ${data.jobTitle}
          Company: ${data.company}
          New Status: ${data.status}
          
          ${data.notes ? `Notes: ${data.notes}` : ''}
          
          Best regards,
          The Hiring Team
        `;
        break;

      default:
        throw new Error('Unknown notification type');
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@candidateportal.com',
        to: [user.email],
        subject: emailSubject,
        html: emailBody.replace(/\n/g, '<br>'),
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

### Monitoring & Analytics

#### 1. Database Monitoring
```sql
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
```

#### 2. Performance Monitoring
```typescript
// supabase/functions/monitor-performance/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get database performance metrics
    const { data: dbStats, error: dbError } = await supabase
      .rpc('get_database_stats');

    if (dbError) throw dbError;

    // Get user activity stats
    const { data: activityStats, error: activityError } = await supabase
      .rpc('get_user_activity_stats', { p_days: 30 });

    if (activityError) throw activityError;

    // Get slow queries (if monitoring is enabled)
    const slowQueries = await supabase
      .from('pg_stat_statements')
      .select('*')
      .order('mean_exec_time', { ascending: false })
      .limit(10);

    // Get connection stats
    const connectionStats = await supabase
      .from('pg_stat_activity')
      .select('state, count(*)')
      .group('state');

    const metrics = {
      timestamp: new Date().toISOString(),
      database: dbStats,
      activity: activityStats,
      performance: {
        slowQueries: slowQueries.data || [],
        connections: connectionStats.data || []
      }
    };

    // Store metrics for historical analysis
    await supabase
      .from('system_settings')
      .upsert({
        key: 'performance_metrics',
        value: metrics,
        description: 'Current system performance metrics'
      });

    return new Response(
      JSON.stringify({
        success: true,
        metrics
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

### Security & Compliance

#### 1. Data Encryption
```sql
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

-- Set encryption key (should be set via environment variable)
ALTER DATABASE postgres SET app.encryption_key = 'your-secret-key';
```

#### 2. Data Anonymization
```sql
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
    url = NULL,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log anonymization event
  INSERT INTO public.audit_log (user_id, action, resource_type, resource_id)
  VALUES (p_user_id, 'data_anonymized', 'user', p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Testing & Quality Assurance

#### 1. Database Testing
```sql
-- Test function for RLS policies
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE(test_name TEXT, passed BOOLEAN, error_message TEXT) AS $$
DECLARE
  test_user_id UUID;
  test_job_id UUID;
  test_application_id UUID;
BEGIN
  -- Create test user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO test_user_id;

  -- Test user can view own profile
  BEGIN
    PERFORM * FROM public.users WHERE id = test_user_id;
    RETURN QUERY SELECT 'User can view own profile'::TEXT, true::BOOLEAN, NULL::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'User can view own profile'::TEXT, false::BOOLEAN, SQLERRM::TEXT;
  END;

  -- Test user cannot view other users' profiles
  BEGIN
    PERFORM * FROM public.users WHERE id != test_user_id LIMIT 1;
    RETURN QUERY SELECT 'User cannot view other profiles'::TEXT, false::BOOLEAN, 'Should not be able to view other profiles'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'User cannot view other profiles'::TEXT, true::BOOLEAN, NULL::TEXT;
  END;

  -- Clean up
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Performance Testing
```sql
-- Function to test query performance
CREATE OR REPLACE FUNCTION public.test_query_performance()
RETURNS TABLE(query_name TEXT, execution_time INTERVAL, row_count BIGINT) AS $$
BEGIN
  -- Test job search query
  BEGIN
    PERFORM * FROM public.jobs 
    WHERE status = 'active' 
    AND title ILIKE '%engineer%' 
    LIMIT 100;
    
    RETURN QUERY SELECT 'Job search query'::TEXT, clock_timestamp() - statement_timestamp(), 100::BIGINT;
  END;

  -- Test application listing query
  BEGIN
    PERFORM * FROM public.applications 
    WHERE user_id = gen_random_uuid() 
    ORDER BY applied_at DESC 
    LIMIT 50;
    
    RETURN QUERY SELECT 'Application listing query'::TEXT, clock_timestamp() - statement_timestamp(), 50::BIGINT;
  END;

  -- Test user profile query
  BEGIN
    PERFORM * FROM public.users u
    JOIN public.user_profiles up ON u.id = up.user_id
    WHERE u.is_active = true
    LIMIT 100;
    
    RETURN QUERY SELECT 'User profile query'::TEXT, clock_timestamp() - statement_timestamp(), 100::BIGINT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Conclusion

The Supabase Agent specification provides a comprehensive guide for implementing and managing the Supabase infrastructure for the Job Candidate Portal. By following these patterns and best practices, the Supabase setup will deliver a robust, secure, and scalable foundation that supports all portal features while maintaining high performance and data integrity.

Key success factors:
- **Security**: Comprehensive RLS policies and data encryption
- **Performance**: Optimized indexes and efficient queries
- **Scalability**: Real-time features and Edge Functions
- **Reliability**: Monitoring, testing, and quality assurance
- **Compliance**: GDPR compliance and data anonymization
- **Maintainability**: Clean architecture and comprehensive documentation
