# AutoApply AI

AI-powered job application automation platform that helps users find jobs, tailor their resumes, and automate the application process.

## Overview

**Purpose:** Automate the job search and application process using AI. Users can upload resumes, get AI-powered resume tailoring for specific job descriptions, discover job listings, and track applications.

**Target Audience:**
- Job seekers looking to streamline their application process
- Career changers wanting to optimize their resumes for different roles
- Professionals applying to multiple positions simultaneously

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS v4
- **Auth:** Supabase Auth (SSR compatible)
- **State:** React Context (AuthContext)
- **Package Manager:** npm

```json
// Key Dependencies
{
  "next": "16.2.3",
  "react": "19.2.4",
  "@supabase/ssr": "^0.10.2",
  "@supabase/supabase-js": "^2.103.0",
  "tailwindcss": "^4"
}
```

### Backend
- **Framework:** Express.js
- **Language:** JavaScript (Node.js)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage (for resume files)
- **Queue:** Bull + Redis (for job application processing)
- **AI:** Ollama (default) or OpenAI (optional)

```json
// Key Dependencies
{
  "express": "^4.18.2",
  "@supabase/supabase-js": "^2.39.0",
  "bull": "^4.16.5",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "multer": "^2.1.1",
  "pdf-parse": "^2.4.5",
  "mammoth": "^1.12.0",
  "playwright": "^1.59.1"
}
```

### Database
- **Type:** PostgreSQL (hosted on Supabase)
- **Schema:** SQL with Row Level Security (RLS)
- **Storage:** Supabase Storage bucket for resume files

---

## Architecture

### Frontend-Backend Interaction

```
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   Next.js       │ ────────▶ │   Express API   │ ────────▶ │   Supabase      │
│   Frontend      │  REST API  │   Backend      │  JS Client    │   PostgreSQL    │
│   (Port 3000)   │           │   (Port 5000)  │             │   + Storage    │
└─────────────────┘           └─────────────────┘           └─────────────────┘
                                       │
                                       ▼
                               ┌─────────────────┐
                               │   Ollama/OpenAI  │
                               │   (AI Service)  │
                               └─────────────────┘
```

### Data Flow

1. **User Authentication:**
   - Frontend → Supabase Auth (email/password)
   - Supabase returns JWT session token
   - Token stored in React Context for state management
   - Token passed in Authorization header to backend API

2. **Resume Upload:**
   - User selects PDF/DOCX file in frontend
   - File sent via FormData to `/api/resumes/upload`
   - Backend parses with pdf-parse/mammoth
   - Text extracted (skills, experience, education)
   - File stored in Supabase Storage
   - Metadata saved to `resumes` table

3. **AI Resume Tailoring:**
   - User selects resume + pastes job description
   - Request sent to `/api/resumes/tailor`
   - Backend calls Ollama/OpenAI with resume text + job description
   - AI returns tailored resume content
   - Saved to `tailored_resumes` table

4. **Job Discovery:**
   - Frontend calls `/api/jobs` with search params
   - Backend queries Supabase jobs table
   - Supports pagination, keyword search, location filter

5. **Application Tracking:**
   - User clicks "Apply" on job listing
   - Request sent to `/api/applications/apply`
   - Job queued in Bull/Redis for processing
   - Status tracked in applications table

### State Management
- **Auth State:** React Context (`AuthContext.tsx`)
- **Server State:** Next.js Server Components (App Router)
- **API Client:** Custom `api.ts` utilities with fetch wrappers

### Architectural Pattern
- **Frontend:** Next.js App Router (Server Components + Client Components)
- **Backend:** Express MVC pattern (Routes → Controllers → Services)
- **API Style:** RESTful JSON API

---

## Project Structure

```
autoapply-ai/
├── frontend/                    # Next.js app (port 3000)
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   │   ├── login/         # Login page
│   │   │   ├── register/     # Registration page
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   │   ├── jobs/     # Job discovery
│   │   │   │   ├── resumes/  # Resume management
│   │   │   │   ├── tailor/   # AI resume tailoring
│   │   │   │   └── applications/  # Application tracking
│   │   │   └── reset-password/
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state management
│   │   ├── lib/
│   │   │   ├── api.ts       # API utilities
│   │   │   └── supabase.ts  # Supabase client
│   │   └── middleware.ts    # Route protection
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── .env.local
│
├── backend/                    # Express API (port 5000)
│   ├── config/
│   │   └── supabase.js      # Supabase client
│   ├── controllers/          # Route handlers
│   │   ├── resumeController.js
│   │   ├── jobController.js
│   │   ├── applicationController.js
│   │   └── userController.js
│   ├── middlewares/          # Express middleware
│   │   ├── auth.js          # JWT validation
│   │   ├── upload.js        # Multer file upload
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js # Error handling
│   ├── routes/              # API routes
│   │   ├── resumes.js
│   │   ├── jobs.js
│   │   ├── applications.js
│   │   └── users.js
│   ├── services/             # Business logic
│   │   ├── aiService.js      # Ollama/OpenAI integration
│   │   ├── parserService.js # Resume parsing
│   │   └── scraperService.js  # Job scraping
│   ├── sql/                 # Database schemas
│   │   ├── applications.sql
│   │   ├── jobs.sql
│   │   └── tailored_resumes.sql
│   ├── server.js            # Express server
│   ├── worker.js            # Bull queue worker
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Database Schema

### Tables

#### resumes
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT,
  file_url TEXT,
  parsed_data JSONB,    -- { text, skills[], experience[], education[] }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### jobs
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

#### applications
```sql
CREATE TABLE applications (
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
```

#### tailored_resumes
```sql
CREATE TABLE tailored_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  tailored_output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relationships
- `applications.job_id` → `jobs.id`
- `applications.resume_id` → `resumes.id`
- `tailored_resumes.user_id` → `auth.users.id`
- `tailored_resumes.resume_id` → `resumes.id`

---

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| POST | `/api/users/register` | Register user |
| POST | `/api/users/login` | Login user |
| POST | `/api/users/logout` | Logout user |
| POST | `/api/users/reset-password` | Reset password |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resumes` | List resumes |
| GET | `/api/resumes/:id` | Get resume by ID |
| POST | `/api/resumes/upload` | Upload & parse resume |
| POST | `/api/resumes/tailor` | AI-tailor resume |
| GET | `/api/resumes/tailored` | List tailored resumes |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (with search/pagination) |
| GET | `/api/jobs/:id` | Get job by ID |
| POST | `/api/jobs/scrape` | Scrape and save jobs |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List applications |
| GET | `/api/applications/:id` | Get application by ID |
| POST | `/api/applications/apply` | Apply to job |
| GET | `/api/applications/queue/status` | Get queue status |

---

## API Request/Response Formats

### POST /api/resumes/upload
**Request:** Multipart form data with `resume` file field

**Response:**
```json
{
  "success": true,
  "resume": {
    "id": "uuid",
    "file_name": "resume.pdf",
    "file_url": "https://...",
    "parsed_data": {
      "text": "...",
      "skills": ["javascript", "react", "node"],
      "experience": ["Senior Dev at Company"],
      "education": ["BS Computer Science"]
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/resumes/tailor
**Request:**
```json
{
  "resumeId": "uuid",
  "jobDescription": "We are looking for a Senior React Developer..."
}
```

**Response:**
```json
{
  "success": true,
  "tailored": {
    "id": "uuid",
    "resume_id": "uuid",
    "job_description": "We are looking for a Senior React Developer...",
    "tailored_output": "Jane Doe\\nSenior React Developer\\n\\nEXPERIENCE\\n• Led development of...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/jobs
**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Keyword search
- `location` (optional): Location filter

**Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "uuid",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "url": "https://linkedin.com/jobs/...",
      "description": "We are building...",
      "source": "linkedin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "page": 1,
  "totalPages": 10,
  "total": 100
}
```

### POST /api/applications/apply
**Request:**
```json
{
  "jobId": "uuid",
  "resumeId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "job_id": "uuid",
    "job_title": "Software Engineer",
    "company": "Tech Corp",
    "resume_id": "uuid",
    "status": "pending",
    "attempts": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## AI Configuration

### Option 1: Ollama (Default - Free)
- Install from https://ollama.ai
- Run: `ollama serve` (defaults to localhost:11434)
- Set model in `.env`: `OLLAMA_MODEL=llama3.1` (text-only recommended)
- Pull model: `ollama pull llama3.1`

### Option 2: OpenAI (Paid)
- Get API key from https://platform.openai.com
- Set in `.env`:
  ```
  USE_OPENAI=true
  OPENAI_API_KEY=your-openai-api-key
  ```
- Uses `gpt-4o-mini` model

**Note:** As of the current update, `llama3.2` vision models have compatibility issues with the `/api/generate` endpoint. Use `llama3.1` for text-only processing or ensure proper configuration.

---

## Middleware (Backend)

| Middleware | Purpose |
|-----------|---------|
| `authenticate` | Validates Supabase JWT token |
| `apiLimiter` | Rate limit: 100 req/15min per IP |
| `authLimiter` | Rate limit: 10 req/15min for auth |
| `upload` | Multer for file upload (memory storage) |
| `errorHandler` | Global error handler |
| `helmet` | Security headers |
| `cors` | CORS configuration |

---

## Security Measures

- **Authentication:** Supabase JWT tokens
- **Rate Limiting:** express-rate-limit (100 req/15min)
- **Security Headers:** helmet.js
- **CORS:** Configured for specific origins
- **Input Validation:** Basic validation in controllers
- **Row Level Security:** PostgreSQL RLS policies
- **File Upload Limits:** Max 5MB

---

## Hosting & Deployment

### Current Development Setup
- **Frontend:** Next.js dev server (localhost:3000)
- **Backend:** Express dev server (localhost:5000)
- **Database:** Supabase Cloud (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible)
- **Redis:** Local Redis (localhost:6379)

### Recommended Production
- **Frontend:** Vercel (Next.js optimized)
- **Backend:** Render/DigitalOcean/AWS (Node.js)
- **Database:** Supabase Pro or self-hosted PostgreSQL
- **Redis:** Redis Cloud or self-hosted
- **AI:** Ollama self-hosted or OpenAI API

---

## Build Verification

Both frontend and backend have been verified:
- **Backend:** Syntax check passed
- **Frontend:** TypeScript check passed, build successful

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

---

## Testing Mechanisms

### Current Status
- No unit/integration tests configured
- ESLint configured for code quality
- Manual testing via frontend UI

### Recommended Additions
- **Unit Tests:** Jest (backend), Vitest (frontend)
- **E2E Tests:** Playwright (already installed)
- **API Tests:** Supertest
- **Code Quality:** ESLint, TypeScript strict mode

---

## Known Bugs & Issues

### Current Issues

1. **Ollama Model Compatibility**
   - **Issue:** `llama3.2` vision models show "Cannot read image" error
   - **Severity:** Medium
   - **Workaround:** Use `llama3.1` (text-only) model
   - **Fix:** Change `.env` `OLLAMA_MODEL=llama3.1` and run `ollama pull llama3.1`

### Potential Future Issues

1. **PDF Parsing** - Scanned PDFs (images) won't parse correctly
2. **Rate Limiting** - IP-based limiting may affect shared networks
3. **Session Timeouts** - JWT refresh not implemented

### Pending Tasks (Priority Order)

1. **HIGH:** Test Ollama integration with llama3.1 model
2. **HIGH:** Add session refresh mechanism for JWT
3. **MEDIUM:** Add unit tests for controllers
4. **MEDIUM:** Implement scraped job data handling
5. **LOW:** Add E2E tests with Playwright

---

## Credits Status

### API Credits Check

| Service | Status |
|--------|--------|
| Supabase | Using free tier - no direct rate limits |
| OpenAI | Not configured (USE_OPENAI=false) |
| Ollama | Local - unlimited usage |
| Redis | Local - unlimited usage |

**Status:** Credits not running low. All services are either free tier (Supabase) or self-hosted local instances (Ollama, Redis).

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free)
- Ollama (optional, for local AI)

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Backend (.env)
```bash
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000

# AI Settings
USE_OPENAI=false
OPENAI_API_KEY=your-openai-api-key
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

### Quick Start

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment (see Environment Variables above)

# Start development servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev

# Open browser: http://localhost:3000
```

---

## Development Commands

### Backend
```bash
cd backend
npm run dev         # Start with nodemon (port 5000)
npm start           # Start production
npm run worker     # Start Bull queue worker
```

### Frontend
```bash
cd frontend
npm run dev        # Start development (port 3000)
npm run build      # Production build
npm run lint       # ESLint check
```

---

## License

MIT

---

## Credits

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Express.js](https://expressjs.com)
- [Ollama](https://ollama.ai)
- [Tailwind CSS](https://tailwindcss.com)