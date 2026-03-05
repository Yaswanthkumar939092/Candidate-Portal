-- Action Center: Tasks and Requests

-- Assigned Tasks
CREATE TABLE public.action_center_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(30) NOT NULL CHECK (task_type IN ('onboarding_task', 'document_upload', 'form_fill', 'custom')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-submitted Requests
CREATE TABLE public.action_center_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'approved', 'rejected', 'closed')),
  attachments TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_user ON public.action_center_tasks (user_id);
CREATE INDEX idx_tasks_status ON public.action_center_tasks (status);
CREATE INDEX idx_requests_user ON public.action_center_requests (user_id);
CREATE INDEX idx_requests_status ON public.action_center_requests (status);

-- Update triggers
CREATE TRIGGER update_action_center_tasks_updated_at
  BEFORE UPDATE ON public.action_center_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_action_center_requests_updated_at
  BEFORE UPDATE ON public.action_center_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS policies for tasks
ALTER TABLE public.action_center_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON public.action_center_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.action_center_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tasks"
  ON public.action_center_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

-- RLS policies for requests
ALTER TABLE public.action_center_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON public.action_center_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
  ON public.action_center_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests"
  ON public.action_center_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );
