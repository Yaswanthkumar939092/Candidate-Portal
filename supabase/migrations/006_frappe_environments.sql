-- Frappe Environment Configuration
-- Supports LOCAL/DEV/UAT/PROD multi-environment switching

CREATE TABLE public.frappe_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_key VARCHAR(20) NOT NULL CHECK (environment_key IN ('LOCAL', 'DEV', 'UAT', 'PROD')),
  label VARCHAR(100) NOT NULL,
  frappe_url VARCHAR(500) NOT NULL,
  api_key VARCHAR(500),
  api_secret VARCHAR(500),
  username VARCHAR(200),
  password VARCHAR(500),
  webhook_secret VARCHAR(500),
  is_active BOOLEAN DEFAULT false,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 1,
  last_connection_test_at TIMESTAMP WITH TIME ZONE,
  last_connection_status VARCHAR(50),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only ONE environment is active at a time
CREATE UNIQUE INDEX idx_frappe_environments_active
  ON public.frappe_environments (is_active)
  WHERE is_active = true;

-- Ensure unique environment keys
CREATE UNIQUE INDEX idx_frappe_environments_key
  ON public.frappe_environments (environment_key);

-- Update trigger
CREATE TRIGGER update_frappe_environments_updated_at
  BEFORE UPDATE ON public.frappe_environments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS policies
ALTER TABLE public.frappe_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view frappe environments"
  ON public.frappe_environments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage frappe environments"
  ON public.frappe_environments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );
