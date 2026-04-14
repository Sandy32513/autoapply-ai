# AutoApply AI

AI-powered job application automation platform.

## Features

- User authentication (email/password)
- Resume upload (PDF/DOCX)
- AI resume tailoring for job descriptions
- Job discovery and search
- Application tracking

## Quick Start

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment variables

# Start development servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev

# Open http://localhost:3000
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Backend | Express.js, Node.js |
| Database | Supabase PostgreSQL |
| AI | OpenAI (default) or Ollama |

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000

# AI Settings
USE_OPENAI=true
OPENAI_API_KEY=sk-your-openai-key
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

## AI Configuration

### OpenAI (Default - Recommended)
Set `USE_OPENAI=true` and add your OpenAI API key in `.env`.

### Ollama (Optional - Local)
1. Download from https://ollama.ai
2. Run: `ollama pull llama3.1`
3. Set `USE_OPENAI=false` in `.env`

The system automatically falls back to OpenAI if Ollama fails.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET/POST | `/api/resumes` | List/upload resumes |
| POST | `/api/resumes/tailor` | AI-tailor resume |
| GET | `/api/jobs` | List jobs |
| POST | `/api/jobs/scrape` | Scrape jobs |
| GET/POST | `/api/applications` | List/apply to jobs |

## Database Schema

```sql
-- resumes
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT,
  file_url TEXT,
  parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  url TEXT UNIQUE NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'linkedin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id),
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  resume_id UUID REFERENCES resumes(id),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- tailored_resumes
CREATE TABLE tailored_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  resume_id UUID REFERENCES resumes(id),
  job_description TEXT NOT NULL,
  tailored_output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- Never commit `.env` files
- Use placeholders in examples
- Rotate exposed API keys immediately

## Known Issues

1. **Ollama "Cannot read image"** - Use `llama3.1` or switch to OpenAI
2. **Ollama not in PATH** - Use OpenAI instead

## License

MIT