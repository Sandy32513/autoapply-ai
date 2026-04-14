-- Applications table with status tracking
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  job_id UUID REFERENCES jobs(id),
  job_url TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_url TEXT,
  resume_id UUID REFERENCES resumes(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'processing', 'applied', 'rejected', 'interviewed', 'success', 'failed')),
  source TEXT DEFAULT 'web',
  error_message TEXT,
  applied_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only see their own applications
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON applications
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all applications
CREATE POLICY "Service can manage applications" ON applications
  FOR ALL USING (auth.role() = 'service_role');