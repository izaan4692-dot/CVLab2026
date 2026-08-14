# CVLab / ResumeAI

AI-powered resume optimization platform with a 3-prompt pipeline architecture. Built with Next.js (frontend) and FastAPI (backend).

## Features

### Authentication
- **Supabase Auth** - Email/password and Google OAuth
- **JWT-based API authentication** - Secure backend communication
- **Auto-login after signup** - Seamless user experience

### Resume Processing
- **S3 File Storage** - AWS S3 for secure resume uploads
- **OCR Text Extraction** - OpenAI Vision API for PDF processing
- **3-Prompt AI Pipeline**:
  1. **The Analyst** - CV analysis with ceiling/floor/delta mapping
  2. **The Gatherer** - Generates 10-25 targeted questions
  3. **The Craftsman** - Creates optimized CV (ZERO FABRICATION rule)
- **Intelligent Resume Parsing** - Extracts structured data from optimized resumes:
  - Supports markdown headers (`# Name`, `## Section`)
  - Handles plain text formats (ALL CAPS section headers)
  - Extracts contact info, experience, education, skills, certifications
  - Robust name extraction from various formats
  - Graceful fallback to raw text display

### User Interface
- **Bilingual Support** - English/Arabic with RTL support
- **Drag & Drop Upload** - Modern file upload experience
- **Real-time Progress** - Status tracking during processing
- **Resume Preview** - Multiple template options (Classic, Modern, Executive, Technical)
- **Robust Resume Parsing** - Handles multiple formats (markdown, plain text, various structures)
- **Graceful Fallbacks** - Raw text display when structured parsing fails

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- Supabase Client

### Backend
- FastAPI (Python 3.11+)
- PostgreSQL + SQLAlchemy
- Celery + Redis (Background tasks)
- Claude/GPT-4o (LLM)
- AWS S3
- CORS middleware for cross-origin requests
- Nginx reverse proxy configuration

## Project Structure

```
cv-build/
├── app/                    # Next.js pages
│   ├── api/upload/         # S3 upload API route
│   ├── signin/             # Sign in page
│   ├── signup/             # Sign up page
│   ├── payment/            # Payment page
│   ├── processing/         # Processing status
│   ├── questions/          # Q&A flow
│   └── admin/              # Admin dashboard
├── components/             # React components
├── contexts/               # React contexts (Auth, Language)
├── lib/                    # Utilities & Supabase client
├── backend/                # FastAPI backend (see backend/README.md)
└── public/                 # Static assets
```

## Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start services (PostgreSQL + Redis)
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

## Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=your-region
S3_BUCKET=your-bucket
```

### Backend (.env)
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cv_build
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Landing page with upload |
| `/signin` | Sign in |
| `/signup` | Sign up |
| `/payment` | Payment flow |
| `/processing` | Processing status |
| `/questions` | Optimization questions |
| `/resume-preview` | Preview optimized resume with template selection |
| `/profile` | User profile |
| `/contact-us` | Contact page |

### Admin
| Route | Description |
|-------|-------------|
| `/admin/overview` | Dashboard overview |
| `/admin/resumes` | Resume management |
| `/admin/users` | User management |
| `/admin/prompts` | Prompt management |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload-s3` | Register S3 upload |
| GET | `/api/v1/status/{id}` | Check processing status |
| GET | `/api/v1/questions/{id}` | Get generated questions |
| POST | `/api/v1/answers` | Submit user answers |
| GET | `/api/v1/preview/{id}` | Get optimized resume preview (JSON) |
| GET | `/api/v1/download/{id}` | Download optimized resume |

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build

# Lint
npm run lint
```

## Internationalization

- Global language state via `LanguageContext`
- Runtime direction switching (`ltr`/`rtl`)
- Text translated via `t('key')` function

## Resume Rendering

The platform supports multiple resume templates with intelligent parsing:

### Supported Templates
- **Classic** - Traditional & Professional (ATS Friendly)
- **Modern** - Contemporary & Creative (Bold Design)
- **Executive** - Leadership & Senior Roles (Elegant)
- **Technical** - IT & Engineering Roles

### Parsing Capabilities
The resume parser (`lib/parseResumeText.ts`) handles:
- Markdown format with headers (`# Name`, `## Section`)
- Plain text format with ALL CAPS section headers
- Pipe-separated contact information
- Various experience formats (bold titles, pipe-separated, bullet points)
- Education entries with multiple formats
- Skills (colon-separated categories, comma-separated lists)
- Certifications and languages

### Fallback Mechanism
If structured parsing fails, the system gracefully falls back to displaying the raw optimized text, ensuring users always see their resume content.

## Deployment

### Production Setup
- Frontend: Next.js standalone build in Docker (port 8001)
- Backend: FastAPI with Docker Compose (port 8002)
- Nginx: Reverse proxy for `cvlab.sa` and `api.cvlab.sa`
- Celery: Background task processing for resume optimization
- Redis: Task queue and caching

### CORS Configuration
- Frontend origin: `https://cvlab.sa`
- API origin: `https://api.cvlab.sa`
- CORS headers configured in both FastAPI middleware and Nginx

## Recent Updates

### Resume Parsing & Rendering (Latest)
- Enhanced name extraction from various formats
- Improved section detection (markdown and plain text)
- Better experience/education parsing with pipe-separated formats
- Skills parsing with category support
- Graceful fallback to raw text when parsing fails
- Multiple template support with robust data handling

### CORS & Infrastructure
- Fixed CORS policy for cross-origin API requests
- Nginx configuration for API subdomain
- Improved error handling in optimization tasks
- Enhanced status checking for resume processing

## License

Proprietary - All rights reserved.
