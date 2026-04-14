-- Jobs table for storing discovered job listings
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  url TEXT UNIQUE NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'linkedin',
  salary TEXT,
  job_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Allow anyone to read jobs
CREATE POLICY "Anyone can view jobs" ON jobs
  FOR SELECT USING (true);

-- Allow service role to insert/update jobs
CREATE POLICY "Service can manage jobs" ON jobs
  FOR ALL USING (auth.role() = 'service_role');