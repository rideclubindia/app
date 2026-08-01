from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from api.routers import auth, tracking, pins, analytics, dashboard, intelligence, grca, traffic, sos
from api.routers.websockets import sio
import socketio

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware FIRST - must be before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RIE Backend"}

# Test: Create the combined ASGI app with Socket.IO mounted directly on app instead of wrapping
app.mount("/socket.io", socketio.ASGIApp(sio, socketio_path='socket.io'))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
