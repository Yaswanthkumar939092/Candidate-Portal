-- SSO Providers - Extensible SSO configuration

CREATE TABLE public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type VARCHAR(30) NOT NULL CHECK (provider_type IN ('saml', 'oidc', 'frappe_sso')),
  name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  email_domain_restriction TEXT[] DEFAULT '{}',
  auto_create_profile BOOLEAN DEFAULT true,
  default_role VARCHAR(50) DEFAULT 'candidate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Domains - For internal employee detection
CREATE TABLE public.company_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  frappe_company_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update triggers
CREATE TRIGGER update_sso_providers_updated_at
  BEFORE UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_company_domains_updated_at
  BEFORE UPDATE ON public.company_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS policies for SSO providers
ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled SSO providers"
  ON public.sso_providers FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Super admins can manage SSO providers"
  ON public.sso_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- RLS policies for company domains
ALTER TABLE public.company_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view company domains"
  ON public.company_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage company domains"
  ON public.company_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );
