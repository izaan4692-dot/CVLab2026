"""
Application Configuration
Centralized settings loaded from environment variables
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application Settings"""

    # API Keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/cv_build"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # App Settings
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    APP_NAME: str = "CV Build AI"
    VERSION: str = "1.0.0"

    # CORS Settings - Production domains + localhost for dev
    CORS_ORIGINS: list = [
        # Production domains
        "https://cvlab.sa",
        "https://www.cvlab.sa",
        "http://cvlab.sa",
        "http://www.cvlab.sa",
    ]

    # File Storage
    UPLOAD_DIR: Path = BASE_DIR / "uploads" / "original"
    OPTIMIZED_DIR: Path = BASE_DIR / "uploads" / "optimized"
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".doc", ".docx"}

    # LLM Settings - Using Claude Sonnet 4 for best performance
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "claude")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "8000"))

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "me-central-1")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "file-upload-cvai")

    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # Session
    SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", "30"))

    # User Management - Inactivity threshold for status determination
    # Users inactive for more than this many hours will be marked as inactive
    USER_INACTIVE_THRESHOLD_HOURS: int = int(os.getenv("USER_INACTIVE_THRESHOLD_HOURS", "24"))

    # LangGraph (set to false to use Celery instead)
    USE_LANGGRAPH: bool = os.getenv("USE_LANGGRAPH", "false").lower() == "true"

    # Prompts
    PROMPTS_DIR: Path = BASE_DIR / "prompts"
    PROMPT1_PATH: Path = PROMPTS_DIR / "resume_analysis_prompt.txt"
    PROMPT2_PATH: Path = PROMPTS_DIR / "generate_questions_prompt.txt"
    PROMPT3_PATH: Path = PROMPTS_DIR / "resume_enhancement_prompt.txt"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure upload directories exist
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.OPTIMIZED_DIR.mkdir(parents=True, exist_ok=True)
        self.PROMPTS_DIR.mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = Settings()
