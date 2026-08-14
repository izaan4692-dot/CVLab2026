"""
FastAPI Main Application
CV Build AI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.db.database import init_db

# Setup logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    Startup and shutdown logic
    """
    # Startup
    logger.info("Starting CV Build AI Backend...")
    logger.info(f"Version: {settings.VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # Ensure upload directories exist
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.OPTIMIZED_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory: {settings.UPLOAD_DIR}")
    logger.info(f"Optimized directory: {settings.OPTIMIZED_DIR}")

    yield

    # Shutdown
    logger.info("Shutting down CV Build AI Backend...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Powered Resume Optimization System with 3-Prompt Pipeline",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "CV Build AI Backend",
        "version": settings.VERSION,
        "status": "running"
    }


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Add actual DB check
        "redis": "connected"  # TODO: Add actual Redis check
    }


# API v1 router
from app.api.v1.router import router as api_v1_router
app.include_router(api_v1_router, prefix="/api/v1")

# Admin API router
from app.api.admin.router import router as admin_router
app.include_router(admin_router, prefix="/api/admin")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG
    )
