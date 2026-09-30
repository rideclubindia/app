import asyncio
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import settings
from core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from api.routers import auth, tracking, pins, analytics, dashboard, intelligence, grca, traffic, sos, emergency, riders, profiles, places
from api.routers.websockets import gateway, sio
import socketio
import logging

logging.basicConfig(
    level=logging.INFO,
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)


async def _purge_stale_locations():
    # Live positions are only needed during a ride; drop them after it ends (or after 2 days)
    from core.database import engine
    from sqlalchemy import text
    while True:
        try:
            with engine.begin() as conn:
                conn.execute(text("SELECT public.rc_purge_stale_locations()"))
        except Exception as e:
            logging.getLogger(__name__).warning("Location purge skipped: %s", type(e).__name__)
        await asyncio.sleep(6 * 3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # A known or short signing secret would let anyone forge a session for any rider
    if len(settings.JWT_SECRET) < 24 or settings.JWT_SECRET.startswith("supersecret"):
        raise RuntimeError("JWT_SECRET must be set to a random value of at least 24 characters")
    # Start the real-time platform (Redis store, location pipeline, sweeper)
    await gateway.start()
    purge = asyncio.create_task(_purge_stale_locations())
    yield
    purge.cancel()
    # Graceful shutdown: notify clients, drain connections, flush batches
    await gateway.stop()


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Rate limiting
# Add CORS middleware FIRST so all responses including exceptions and 429 have CORS headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(tracking.router, prefix=f"{settings.API_V1_STR}/location", tags=["GPS Tracking"])
app.include_router(pins.router, prefix="/api/pins")
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics & Intelligence"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(intelligence.router, prefix=f"{settings.API_V1_STR}/ml", tags=["Machine Learning"])
app.include_router(grca.router, prefix=f"{settings.API_V1_STR}")
app.include_router(traffic.router, prefix=f"{settings.API_V1_STR}/traffic", tags=["Traffic"])
app.include_router(sos.router, prefix=f"{settings.API_V1_STR}/sos", tags=["SOS"])
app.include_router(emergency.router, prefix="/api", tags=["Emergency"])
app.include_router(riders.router, prefix=f"{settings.API_V1_STR}/riders", tags=["Riders"])
app.include_router(profiles.router, prefix=settings.API_V1_STR, tags=["Profiles"])
app.include_router(places.router, prefix=settings.API_V1_STR, tags=["Places"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RIE Backend"}


@app.get("/readyz")
async def readiness_check():
    """Kubernetes readiness: fails while the node is draining or Redis is down.

    Load balancers stop routing NEW websocket handshakes to a node that fails
    readiness; existing connections keep working until the node finishes
    draining (connection draining for rolling deployments).
    """
    redis_ok = gateway.store.redis is not None
    if redis_ok:
        try:
            await gateway.store.redis.ping()
        except Exception:
            redis_ok = False
    ready = redis_ok and not gateway.draining
    return Response(
        content='{"status":"%s"}' % ("ready" if ready else "not_ready"),
        status_code=200 if ready else 503,
        media_type="application/json",
    )


@app.get("/metrics")
def prometheus_metrics():
    """Prometheus text exposition of all realtime platform metrics."""
    from realtime.metrics import registry
    return Response(content=registry.render(), media_type="text/plain; version=0.0.4")


# Realtime gateway: Socket.IO ASGI app mounted on the same server.
# The gateway uses the Redis manager, so any node can emit to any room.
app.mount("/socket.io", socketio.ASGIApp(sio, socketio_path="socket.io"))

if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=os.getenv("ENV", "development") != "production")
