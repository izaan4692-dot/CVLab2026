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

### User Interface
- **Bilingual Support** - English/Arabic with RTL support
- **Drag & Drop Upload** - Modern file upload experience
- **Real-time Progress** - Status tracking during processing

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

## License

Proprietary - All rights reserved.
