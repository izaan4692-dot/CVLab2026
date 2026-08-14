"""
Celery Application Configuration
Background task processing for CV analysis and optimization
"""
from celery import Celery
from app.config import settings

# Create Celery app
celery_app = Celery(
    "cv_build",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.analysis_task",
        "app.tasks.optimization_task",
        "app.tasks.notification_task"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,  # 30 minutes max per task
    task_soft_time_limit=1500,  # 25 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# Task routes (using default queue for simplicity)
# To use separate queues, uncomment below and run workers with: -Q analysis,optimization,celery
# celery_app.conf.task_routes = {
#     "app.tasks.analysis_task.*": {"queue": "analysis"},
#     "app.tasks.optimization_task.*": {"queue": "optimization"},
# }


@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery"""
    print(f"Request: {self.request!r}")
    return "Celery is working!"
