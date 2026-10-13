import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import db_manager
from app.core.security import require_role
from app.services.migration import migration_manager

# Import all domain routers
from app.routers import (
    auth,
    exams,
    papers,
    questions,
    mock_tests,
    attempts,
    analytics,
    mistakes,
    bookmarks,
    study_plans,
    ai,
    admin,
    integrations
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pyqverse.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager handling startup initialization and clean shutdown."""
    logger.info("Initializing PYQVerse Authoritative Backend Engine...")
    settings.validate_production_configuration()
    await db_manager.connect()
    yield
    logger.info("Shutting down PYQVerse Backend Engine...")
    await db_manager.disconnect()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

class PathNormalizationMiddleware:
    """
    Standard ASGI middleware ensuring routes match whether requested with
    or without the /api prefix across Vercel rewrite configurations.
    """
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path.startswith("/v1/"):
                scope["path"] = f"/api{path}"
            elif path == "/v1":
                scope["path"] = "/api/v1"
        await self.asgi_app(scope, receive, send)

app.add_middleware(PathNormalizationMiddleware)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Root Route
@app.get("/api", tags=["System Health"])
@app.get("/api/", tags=["System Health"])
async def api_root():
    """Root metadata endpoint for API verification."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "healthy",
        "apiPrefix": settings.API_V1_PREFIX
    }

# Health & Readiness Check Endpoint
@app.get("/api/v1/health", tags=["System Health"])
@app.get("/health", tags=["System Health"])
async def health_check():
    """
    Authoritative system health, database readiness, and provider verification endpoint.
    """
    db_healthy = db_manager.is_connected and await db_manager.ping()
    
    return {
        "status": "healthy" if db_healthy or settings.APP_ENV == "development" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.APP_ENV,
        "demoPersonasAllowed": settings.is_demo_mode_allowed(),
        "database": {
            "type": "MongoDB Atlas Async Engine",
            "connected": db_healthy,
            "databaseName": settings.MONGODB_DATABASE
        },
        "ai_providers": {
            "gemini": {
                "configured": bool(settings.GEMINI_API_KEY),
                "model": settings.GEMINI_MODEL
            },
            "groq": {
                "configured": bool(settings.GROQ_API_KEY),
                "model": settings.GROQ_MODEL
            },
            "default": settings.AI_DEFAULT_PROVIDER,
            "fallbackEnabled": settings.AI_FALLBACK_ENABLED
        },
        "storage": {
            "provider": "Cloudflare R2 (S3-Compatible)",
            "bucket": settings.R2_BUCKET_NAME,
            "configured": bool(settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY)
        },
        "integrations": {
            "googleSheetsBridge": bool(settings.GOOGLE_APPS_SCRIPT_URL)
        }
    }

# Admin Migration Route
@app.post("/api/v1/admin/migrate-from-json", tags=["Admin Portal"])
async def run_json_migration(
    dry_run: bool = False,
    user_payload: dict = Depends(require_role(["admin"]))
):
    """
    Triggers repeatable MongoDB Atlas migration from seed fixture.
    Validates records, detects duplicates, logs statistics.
    """
    import os
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "seed_data.json")
    try:
        report = await migration_manager.migrate_from_json(fixture_path, dry_run=dry_run)
        return {"success": True, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount all domain routers with API v1 prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(exams.router, prefix=settings.API_V1_PREFIX)
app.include_router(papers.router, prefix=settings.API_V1_PREFIX)
app.include_router(questions.router, prefix=settings.API_V1_PREFIX)
app.include_router(mock_tests.router, prefix=settings.API_V1_PREFIX)
app.include_router(attempts.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(mistakes.router, prefix=settings.API_V1_PREFIX)
app.include_router(bookmarks.router, prefix=settings.API_V1_PREFIX)
app.include_router(study_plans.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(integrations.router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
