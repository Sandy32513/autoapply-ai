# AutoApply AI

AI-powered job application automation platform that helps users find jobs, tailor their resumes, and automate the application process.

## Overview

**Purpose:** Automate the job search and application process using AI. Users can upload resumes, get AI-powered resume tailoring for specific job descriptions, discover job listings, and track applications.

**Target Audience:**
- Job seekers looking to streamline their application process
- Career changers wanting to optimize their resumes for different roles
- Professionals applying to multiple positions simultaneously

---

## Quick Start

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment (see Environment Variables below)

# Start development servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev

# Open http://localhost:3000
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS v4
- **Auth:** Supabase Auth (SSR compatible)
- **State:** React Context (AuthContext)

### Backend
- **Framework:** Express.js
- **Language:** JavaScript (Node.js)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage (for resume files)
- **Queue:** Bull + Redis
- **AI:** OpenAI (default) or Ollama (optional)

### Database
- **Type:** PostgreSQL (hosted on Supabase)
- **Schema:** SQL with Row Level Security (RLS)

---

## Features

### 1. Authentication
- Supabase Auth (email/password)
- Route protection via middleware
- Password reset functionality

### 2. Resume Upload
- Upload PDFs and DOCX files (max 5MB)
- Automatic text extraction
- Parses skills, experience, and education

### 3. AI Resume Tailoring
- Tailor resume for specific job descriptions
- Uses OpenAI GPT-4 or Ollama
- Automatic fallback if primary fails

### 4. Job Discovery
- Browse job listings
- Search by keyword and location
- Scrape new jobs (mock data for MVP)

### 5. Application Tracking
- Track applied jobs
- Status: pending, processing, success, failed

---

## Project Structure

```
autoapply-ai/
├── frontend/                    # Next.js app (port 3000)
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   │   ├── jobs/
│   │   │   │   ├── resumes/
│   │   │   │   ├── tailor/
│   │   │   │   └── applications/
│   │   │   └── reset-password/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── supabase.ts
│   └── package.json
│
├── backend/                    # Express API (port 5000)
│   ├── config/
│   │   └── supabase.js
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   │   ├── aiService.js       # AI integration
│   │   ├── parserService.js   # Resume parsing
│   │   └── scraperService.js
│   ├── sql/                   # Database schemas
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```bash
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000

# AI Settings
USE_OPENAI=true
OPENAI_API_KEY=sk-your-openai-api-key
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

---

## AI Configuration

### Option 1: OpenAI (Default - Recommended)
Get your API key from https://platform.openai.com/api-keys

Set in `.env`:
```
USE_OPENAI=true
OPENAI_API_KEY=sk-your-key
```

### Option 2: Ollama (Local - Free)
1. Download from https://ollama.ai
2. Run: `ollama pull llama3.1`
3. Set in `.env`:
   ```
   USE_OPENAI=false
   OLLAMA_MODEL=llama3.1
   ```

### Automatic Fallback
The system automatically falls back to OpenAI if Ollama fails (when OpenAI key is configured).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/resumes` | List resumes |
| POST | `/api/resumes/upload` | Upload & parse resume |
| POST | `/api/resumes/tailor` | AI-tailor resume |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Get job by ID |
| POST | `/api/jobs/scrape` | Scrape jobs |
| GET | `/api/applications` | List applications |
| POST | `/api/applications/apply` | Apply to job |

---

## Database Schema

### Tables

**resumes**
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT,
  file_url TEXT,
  parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**jobs**
```sql
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
```

**applications**
```sql
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
```

**tailored_resumes**
```sql
CREATE TABLE tailored_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  resume_id UUID REFERENCES resumes(id),
  job_description TEXT NOT NULL,
  tailored_output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Supabase Setup

### 1. Create Project
Go to https://supabase.com and create a new project.

### 2. Create Tables
Run the SQL in the `sql/` folder or use the schema above.

### 3. Create Storage Bucket
1. Go to Storage in Supabase dashboard
2. Create bucket named `resumes`
3. Make it public

### 4. Get Credentials
- Supabase URL: Project Settings → API
- Anon Key: Project Settings → API
- Service Role Key: (only for backend, never expose)

---

## Security & Key Management

### NEVER commit secrets!

| File | What to Store |
|------|------------|
| `.env` | Real API keys, tokens, passwords |
| `.env.local` | Real Supabase keys |
| `*.pem` | Private keys/certificates |

### Always Use Placeholders

```bash
# BAD - real key in repo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...realKey

# GOOD - placeholder
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### GitHub Email Protection

1. Go to https://github.com/settings/emails
2. Uncheck "Keep my email address private" OR use noreply email
3. Set globally:
   ```bash
   git config --global user.email "your-noreply@users.noreply.github.com"
   ```

### If Keys Are Exposed

1. **Immediate action:** Rotate exposed keys in respective service
2. **For Supabase:** Regenerate in Dashboard → Settings → API
3. **For OpenAI:** Regenerate at https://platform.openai.com/api-keys
4. **Force-push clean commit:**
   ```bash
   git commit --amend --author="YourName <your-noreply@users.noreply.github.com>" --no-edit
   git push --force-with-lease origin main
   ```

---

## Middleware (Backend)

| Middleware | Purpose |
|-----------|---------|
| `authenticate` | Validates Supabase JWT token |
| `apiLimiter` | Rate limit: 100 req/15min per IP |
| `authLimiter` | Rate limit: 10 req/15min for auth |
| `upload` | Multer for file upload |
| `errorHandler` | Global error handler |
| `helmet` | Security headers |
| `cors` | CORS configuration |

---

## Build Verification

```bash
# Frontend
cd frontend
npm run build      # Production build
npm run lint      # ESLint check
npx tsc --noEmit # TypeScript check

# Backend
cd backend
npm run dev       # Development
```

---

## Development Commands

### Backend
```bash
cd backend
npm run dev         # Start with nodemon (port 5000)
npm start           # Start production
npm run worker    # Start Bull queue worker
```

### Frontend
```bash
cd frontend
npm run dev        # Start development (port 3000)
npm run build     # Production build
npm run lint      # ESLint check
```

---

## Known Issues & Fixes

### 1. Ollama "Cannot read image" error
- **Cause:** Using vision model (llama3.2) with text-only API
- **Fix:** Use `llama3.1` model or switch to OpenAI

### 2. Ollama not in PATH
- **Fix:** Download from https://ollama.ai or use OpenAI

---

## License

MIT

---

## Credits

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Express.js](https://expressjs.com)
- [OpenAI](https://openai.com)
- [Ollama](https://ollama.ai)
- [Tailwind CSS](https://tailwindcss.com)