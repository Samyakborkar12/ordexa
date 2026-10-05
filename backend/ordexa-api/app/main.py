"""
ORDEXA API — FastAPI Backend Engine
One Platform. Every Queue. Real-Time.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, organizations, services, counters, queues, staff, analytics
from app.websocket.manager import router as ws_router

app = FastAPI(
    title="ORDEXA API",
    description="Configurable real-time customer-flow and queue-management backend platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["Organizations"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(counters.router, prefix="/api/counters", tags=["Counters"])
app.include_router(queues.router, prefix="/api/queues", tags=["Queues"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ws_router, tags=["WebSocket Real-Time"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ORDEXA API"}
