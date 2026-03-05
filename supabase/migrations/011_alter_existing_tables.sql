-- Modifications to existing tables for lifecycle, visibility, and offer tracking

-- Jobs: Add visibility columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'external'
    CHECK (visibility IN ('internal', 'external', 'both')),
  ADD COLUMN IF NOT EXISTS visibility_override BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS frappe_publish_field BOOLEAN DEFAULT true;

-- Users: Add lifecycle/employee columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(30) DEFAULT 'candidate'
    CHECK (lifecycle_stage IN ('candidate', 'applicant', 'offered', 'onboarding', 'employee')),
  ADD COLUMN IF NOT EXISTS frappe_employee_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_internal_employee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_domain VARCHAR(255);

-- Applications: Add offer tracking
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS frappe_job_applicant_id VARCHAR(100);

-- Index for internal employee lookups
CREATE INDEX IF NOT EXISTS idx_users_internal
  ON public.users (is_internal_employee) WHERE is_internal_employee = true;

-- Index for lifecycle stage queries
CREATE INDEX IF NOT EXISTS idx_users_lifecycle
  ON public.users (lifecycle_stage);

-- Index for job visibility filtering
CREATE INDEX IF NOT EXISTS idx_jobs_visibility
  ON public.jobs (visibility);

-- Auto-populate email_domain on insert/update
CREATE OR REPLACE FUNCTION public.set_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email_domain = split_part(NEW.email, '@', 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_email_domain
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_email_domain();

-- Backfill email_domain for existing users
UPDATE public.users SET email_domain = split_part(email, '@', 2) WHERE email_domain IS NULL;
