-- Job Match Results - Cached resume-to-JD match scores

CREATE TABLE public.job_match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('keyword', 'ai')),
  match_score NUMERIC(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  analysis JSONB DEFAULT '{}',
  resume_document_id UUID REFERENCES public.documents(id),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure one result per user/job/type combination
CREATE UNIQUE INDEX idx_job_match_unique
  ON public.job_match_results (user_id, job_id, match_type);

-- Index for quick lookups
CREATE INDEX idx_job_match_user ON public.job_match_results (user_id);
CREATE INDEX idx_job_match_score ON public.job_match_results (match_score DESC);

-- RLS policies
ALTER TABLE public.job_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own match results"
  ON public.job_match_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own match results"
  ON public.job_match_results FOR ALL
  USING (auth.uid() = user_id);
