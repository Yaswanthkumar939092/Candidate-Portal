-- Feature flags table for controlling application features
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  default_value JSONB DEFAULT 'false'::jsonb,
  value_type VARCHAR(50) DEFAULT 'boolean' CHECK (value_type IN ('boolean', 'string', 'number', 'json')),
  tags TEXT[] DEFAULT '{}',
  environments TEXT[] DEFAULT '{production,staging,development}',
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Feature flag user overrides table for user-specific flag values
CREATE TABLE IF NOT EXISTS public.feature_flag_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_flag_id UUID NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(feature_flag_id, user_id)
);

-- Add indexes for performance
CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);
CREATE INDEX idx_feature_flag_overrides_user_id ON public.feature_flag_overrides(user_id);
CREATE INDEX idx_feature_flag_overrides_feature_flag_id ON public.feature_flag_overrides(feature_flag_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flag_overrides_updated_at BEFORE UPDATE ON public.feature_flag_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feature flags for the application
INSERT INTO public.feature_flags (key, name, description, is_enabled, default_value, value_type, tags) VALUES
  ('oauth_login', 'OAuth Login', 'Enable OAuth login with Google and LinkedIn', true, 'true'::jsonb, 'boolean', '{authentication,oauth}'),
  ('job_applications', 'Job Applications', 'Allow users to apply for jobs', true, 'true'::jsonb, 'boolean', '{jobs,applications}'),
  ('admin_dashboard_metrics', 'Admin Dashboard Metrics', 'Show detailed metrics in admin dashboard', true, 'true'::jsonb, 'boolean', '{admin,dashboard,analytics}'),
  ('profile_document_uploads', 'Profile Document Uploads', 'Allow users to upload documents to their profile', true, 'true'::jsonb, 'boolean', '{profile,documents,uploads}'),
  ('application_tracking', 'Application Tracking', 'Enable application status tracking and timeline', true, 'true'::jsonb, 'boolean', '{applications,tracking}'),
  ('social_job_sharing', 'Social Job Sharing', 'Allow users to share job postings on social media', false, 'false'::jsonb, 'boolean', '{jobs,social,sharing}'),
  ('advanced_search_filters', 'Advanced Search Filters', 'Enable advanced filtering options in job search', false, 'false'::jsonb, 'boolean', '{search,jobs,filters}'),
  ('email_notifications', 'Email Notifications', 'Send email notifications for application updates', true, 'true'::jsonb, 'boolean', '{notifications,email}'),
  ('job_recommendations', 'Job Recommendations', 'Show personalized job recommendations', false, 'false'::jsonb, 'boolean', '{jobs,recommendations,ai}'),
  ('real_time_chat', 'Real-time Chat', 'Enable real-time chat between recruiters and candidates', false, 'false'::jsonb, 'boolean', '{communication,chat,realtime}')
ON CONFLICT (key) DO NOTHING;

-- Add foreign key constraint for created_by field
ALTER TABLE public.feature_flags
ADD CONSTRAINT feature_flags_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Comment on tables and columns
COMMENT ON TABLE public.feature_flags IS 'Feature flags for controlling application features and experiments';
COMMENT ON COLUMN public.feature_flags.key IS 'Unique identifier for the feature flag';
COMMENT ON COLUMN public.feature_flags.name IS 'Human-readable name for the feature flag';
COMMENT ON COLUMN public.feature_flags.description IS 'Description of what this feature flag controls';
COMMENT ON COLUMN public.feature_flags.is_enabled IS 'Whether the feature flag is enabled globally';
COMMENT ON COLUMN public.feature_flags.default_value IS 'Default value when feature flag is enabled';
COMMENT ON COLUMN public.feature_flags.value_type IS 'Type of the feature flag value (boolean, string, number, json)';
COMMENT ON COLUMN public.feature_flags.rollout_percentage IS 'Percentage of users who should see this feature (0-100)';

COMMENT ON TABLE public.feature_flag_overrides IS 'User-specific overrides for feature flags';
COMMENT ON COLUMN public.feature_flag_overrides.value IS 'Override value for this user';