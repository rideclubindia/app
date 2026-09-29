import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "rie_worker",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "workers.tasks.process_location_update": {"queue": "tracking"},
        "workers.tasks.calculate_analytics": {"queue": "analytics"},
    },
    beat_schedule={
        # SOS Escalation Architecture.md §4 — server-authoritative countdown
        # expiry. Requires a `celery -A workers.celery_app beat` process
        # running alongside the worker (not yet added to docker-compose.yml).
        "sos-expiry-sweep": {
            "task": "workers.tasks.sos_expiry_sweep",
            "schedule": 5.0,
        },
    },
)

celery_app.autodiscover_tasks(["workers.tasks"])
