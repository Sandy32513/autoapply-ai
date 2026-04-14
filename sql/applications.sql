-- Applications table with status tracking
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_url TEXT,
  resume_id UUID REFERENCES resumes(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Allow anyone to read, only service to insert/update
CREATE POLICY "Anyone can view applications" ON applications
  FOR SELECT USING (true);

CREATE POLICY "Service can manage applications" ON applications
  FOR ALL USING (auth.role() = 'service_role');