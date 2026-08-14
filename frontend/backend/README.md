# CV Build AI - Backend

AI-Powered Resume Optimization System using a 3-Prompt Pipeline Architecture.

## Overview

This backend implements a CV analysis and optimization system using three specialized AI agents:

1. **Prompt 1: The Analyst** - Analyzes CV and identifies improvement areas with ceiling/floor/delta mapping
2. **Prompt 2: The Gatherer** - Generates 10-25 targeted conversational questions
3. **Prompt 3: The Craftsman** - Creates optimized CV with ZERO FABRICATION rule

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Task Queue**: Celery + Redis
- **AI Models**: Claude Sonnet 4 (Anthropic) / GPT-4o (OpenAI)
- **Storage**: AWS S3
- **Auth**: Supabase JWT verification
- **Containerization**: Docker Compose

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── api/v1/                 # API endpoints
│   │   ├── upload.py           # File upload (local + S3)
│   │   ├── status.py           # Status checking
│   │   ├── questions.py        # Get questions
│   │   ├── answers.py          # Submit answers
│   │   └── download.py         # Download optimized resume
│   ├── auth/
│   │   └── middleware.py       # JWT authentication
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── services/
│   │   ├── llm_handler.py      # Unified LLM interface
│   │   ├── file_service.py     # File management
│   │   ├── ocr_service.py      # Text extraction (Vision API)
│   │   └── s3_service.py       # AWS S3 operations
│   ├── agents/                 # AI Agents
│   │   ├── prompt1_analyst.py
│   │   ├── prompt2_gatherer.py
│   │   └── prompt3_craftsman.py
│   ├── tasks/                  # Celery background tasks
│   │   ├── analysis_task.py
│   │   └── optimization_task.py
│   └── db/
│       └── database.py
├── prompts/                    # AI prompt templates
├── requirements.txt
└── docker-compose.yml
```

## Setup

### 1. Prerequisites

- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### 2. Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables

Create `.env` file:

```env
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cv_build

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS S3
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=me-central-1
S3_BUCKET=your-bucket

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx

# LLM Settings
DEFAULT_LLM_PROVIDER=claude
CLAUDE_MODEL=claude-sonnet-4-20250514
MAX_TOKENS=8000

# App Settings
DEBUG=True
APP_PORT=8000
```

### 4. Database Setup

```bash
# Using Docker
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head
```

### 5. Run Application

```bash
# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### User Endpoints (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Upload resume file |
| POST | `/api/v1/upload-s3` | Register S3 uploaded file |
| GET | `/api/v1/status/{id}` | Check processing status |
| GET | `/api/v1/questions/{id}` | Get generated questions |
| POST | `/api/v1/answers` | Submit user answers |
| GET | `/api/v1/download/{id}` | Download optimized resume |
| POST | `/api/v1/claims` | Create support claim |
| GET | `/api/v1/claims` | List user's claims |

### Admin Endpoints (Requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/{id}` | Get user details |
| PATCH | `/api/admin/users/{id}/status` | Update user status |
| DELETE | `/api/admin/users/{id}` | Delete user |
| GET | `/api/admin/resumes` | List all resumes |
| GET | `/api/admin/resumes/export` | Export to Excel |
| GET | `/api/admin/resumes/{id}` | Get resume details |
| DELETE | `/api/admin/resumes/{id}` | Delete resume |
| GET | `/api/admin/claims/stats` | Claims statistics |
| GET | `/api/admin/claims` | List all claims |
| GET | `/api/admin/claims/export` | Export to Excel |
| PATCH | `/api/admin/claims/{id}/status` | Update claim status |
| GET | `/api/admin/llm-config` | Get LLM configuration |
| PUT | `/api/admin/llm-config` | Update LLM configuration |
| GET | `/api/admin/prompts` | List all prompts |
| PUT | `/api/admin/prompts/{id}` | Update prompt |

### Root Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Service status |

## Workflow

```
1. User uploads resume → S3
2. Backend registers upload → Celery task starts
3. OCR extracts text (OpenAI Vision API)
4. Prompt 1 analyzes CV → ceiling/floor/delta mapping
5. Prompt 2 generates questions → 10-25 questions
6. User answers questions
7. Prompt 3 optimizes CV → ZERO FABRICATION rule
8. Optimized resume ready for download
```

## Processing Status

| Status | Description |
|--------|-------------|
| UPLOADED | File received |
| EXTRACTING | OCR in progress |
| EXTRACTED | Text extracted |
| ANALYZING | Prompt 1 running |
| ANALYZED | Analysis complete |
| QUESTIONS_GENERATED | Prompt 2 complete |
| AWAITING_ANSWERS | Waiting for user |
| OPTIMIZING | Prompt 3 running |
| COMPLETED | Ready for download |
| FAILED | Error occurred |

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## File Limits

- Maximum file size: 10MB
- Supported formats: PDF, DOC, DOCX

## Troubleshooting

### Database Connection
```bash
docker-compose ps postgres
psql -h localhost -U postgres -d cv_build
```

### Redis Connection
```bash
docker-compose ps redis
redis-cli ping
```

### Celery Worker
```bash
celery -A app.tasks.celery_app inspect active
celery -A app.tasks.celery_app purge
```
