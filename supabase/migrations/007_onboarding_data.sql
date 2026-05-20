-- Onboarding Data - Multi-step wizard with partial saves

CREATE TABLE public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  personal_info JSONB DEFAULT '{}',
  address JSONB DEFAULT '{}',
  identity_documents JSONB DEFAULT '{}',
  bank_details JSONB DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '{}',
  education JSONB DEFAULT '[]',
  employment_history JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  declaration_accepted BOOLEAN DEFAULT false,
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'pushed_to_frappe')),
  frappe_employee_id VARCHAR(100),
  frappe_user_id VARCHAR(100),
  pushed_to_frappe_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update trigger
CREATE TRIGGER update_onboarding_data_updated_at
  BEFORE UPDATE ON public.onboarding_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS policies
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding data"
  ON public.onboarding_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data"
  ON public.onboarding_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data"
  ON public.onboarding_data FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft'));

CREATE POLICY "Admins can view all onboarding data"
  ON public.onboarding_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update onboarding data"
  ON public.onboarding_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );
