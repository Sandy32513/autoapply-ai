-- Create tailored_resumes table for storing AI-generated tailored resumes
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  tailored_output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can only access their own tailored resumes" ON tailored_resumes
  FOR ALL USING (auth.uid() = user_id);