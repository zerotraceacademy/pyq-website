"""
Verification test for Vercel Serverless Function entry point (api/index.py).
Ensures that the single-project Vercel deployment entrypoint routes and normalizes
requests without errors.
"""

import sys
from pathlib import Path
from starlette.testclient import TestClient

# Ensure api directory and project root are discoverable
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
API_DIR = ROOT_DIR / "api"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from api.index import app as vercel_app

def test_vercel_entrypoint_direct_api_v1_path():
    """Verify that api/index.py handles direct /api/v1/* requests."""
    client = TestClient(vercel_app)
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("healthy", "degraded")
    assert "database" in data

def test_vercel_entrypoint_stripped_v1_path():
    """Verify that api/index.py normalizes stripped /v1/* paths back to /api/v1/*."""
    client = TestClient(vercel_app)
    res = client.get("/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("healthy", "degraded")

def test_vercel_entrypoint_direct_filename_returns_404():
    """Verify that direct requests to the internal function filename /api/index.py return 404 Not Found."""
    client = TestClient(vercel_app)
    res = client.get("/api/index.py")
    assert res.status_code == 404
    data = res.json()
    assert data["detail"] == "Not Found"

def test_vercel_entrypoint_exams_contract():
    """Verify that domain routes operate correctly through the Vercel bridge."""
    client = TestClient(vercel_app)
    res = client.get("/api/v1/exams")
    assert res.status_code == 200
    assert "exams" in res.json()

def test_vercel_entrypoint_query_parameters_and_post_body():
    """Verify query parameters and POST request bodies pass through Vercel bridge intact."""
    client = TestClient(vercel_app)
    
    # 1. Query parameters
    search_res = client.get("/api/v1/papers?search=JEE")
    assert search_res.status_code == 200
    assert "papers" in search_res.json()

    # 2. POST body handling
    q_res = client.get("/api/v1/questions")
    assert q_res.status_code == 200
    questions = q_res.json()["questions"]
    assert len(questions) > 0
    first_q = questions[0]

    check_res = client.post(
        f"/api/v1/questions/{first_q['id']}/check",
        json={"selectedOption": first_q["correctAnswer"]}
    )
    assert check_res.status_code == 200
    assert check_res.json()["isCorrect"] is True

def test_vercel_entrypoint_cors_and_options_preflight():
    """Verify that OPTIONS preflight and CORS work when invoked via Vercel entrypoint."""
    client = TestClient(vercel_app)
    res = client.options(
        "/api/v1/auth/me",
        headers={
            "Origin": "https://pyqverse.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization, content-type"
        }
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://pyqverse.vercel.app"

def test_vercel_entrypoint_api_root():
    """Verify that GET /api returns root metadata JSON."""
    client = TestClient(vercel_app)
    res = client.get("/api")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "apiPrefix" in data

def test_vercel_entrypoint_unknown_route_returns_json_404():
    """Verify that unknown API routes return JSON 404 responses rather than SPA HTML."""
    client = TestClient(vercel_app)
    res = client.get("/api/v1/nonexistent-endpoint-test-404")
    assert res.status_code == 404
    assert res.headers.get("content-type", "").startswith("application/json")
    data = res.json()
    assert "detail" in data
    assert data["detail"] == "Not Found"

def test_production_configuration_validation_error():
    """Verify that missing JWT_SECRET or local MONGODB_URI fails startup in production."""
    import pytest
    from app.core.config import Settings

    # Production mode without custom secret should raise ValueError
    with pytest.raises(ValueError, match="JWT_SECRET must be explicitly configured"):
        prod_settings = Settings(
            APP_ENV="production",
            JWT_SECRET=None,
            SESSION_SECRET="super_secure_jwt_secret_pyqverse_key_change_in_production"
        )
        prod_settings.validate_production_configuration()

def test_production_mode_blocks_exams_fixture_fallback():
    """Verify that production mode strictly refuses to serve exam fixtures if DB is disconnected."""
    from app.core.config import settings
    from app.core.database import db_manager

    client = TestClient(vercel_app)
    orig_env = settings.APP_ENV
    orig_connected = db_manager.is_connected
    try:
        settings.APP_ENV = "production"
        db_manager.is_connected = False
        res = client.get("/api/v1/exams")
        assert res.status_code == 503
        assert "Database Service Unavailable" in res.json()["detail"]
    finally:
        settings.APP_ENV = orig_env
        db_manager.is_connected = orig_connected

def test_production_login_requires_valid_credentials():
    """Verify POST /api/v1/auth/login works and enforces password hash requirements."""
    client = TestClient(vercel_app)
    # 1. Non-existent email returns 401
    res = client.post("/api/v1/auth/login", json={"email": "nonexistent@pyqverse.edu", "password": "any"})
    assert res.status_code == 401
    assert "Invalid email or credentials" in res.json()["detail"]

    # 2. In production mode with DB offline, login returns 503
    from app.core.config import settings
    from app.core.database import db_manager
    from unittest.mock import AsyncMock, MagicMock
    orig_env = settings.APP_ENV
    orig_connected = db_manager.is_connected
    orig_db = db_manager.db
    try:
        settings.APP_ENV = "production"
        db_manager.is_connected = False
        res = client.post("/api/v1/auth/login", json={"email": "student@pyqverse.edu", "password": "any"})
        assert res.status_code == 503

        # 3. In production mode with DB online, an account without password_hash cannot log in
        db_manager.is_connected = True
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={
            "id": "usr_test",
            "email": "student@pyqverse.edu",
            "name": "Test Student",
            "role": "student"
        })
        db_manager.db = mock_db
        res_online = client.post("/api/v1/auth/login", json={"email": "student@pyqverse.edu", "password": "any"})
        assert res_online.status_code == 401
        assert "not initialized" in res_online.json()["detail"].lower()

        # 4. In production mode with DB online and valid password hash, login succeeds
        from app.core.security import hash_password
        mock_db.users.find_one = AsyncMock(return_value={
            "id": "usr_test",
            "email": "student@pyqverse.edu",
            "name": "Test Student",
            "role": "student",
            "password_hash": hash_password("ValidPassword123!")
        })
        res_success = client.post("/api/v1/auth/login", json={"email": "student@pyqverse.edu", "password": "ValidPassword123!"})
        assert res_success.status_code == 200
        assert "access_token" in res_success.json()
    finally:
        settings.APP_ENV = orig_env
        db_manager.is_connected = orig_connected
        db_manager.db = orig_db

def test_production_database_connect_failure_raises():
    """Verify that db_manager.connect() in production mode raises error and cleanly resets client."""
    import pytest
    import asyncio
    from app.core.config import settings
    from app.core.database import db_manager

    orig_env = settings.APP_ENV
    orig_client = db_manager.client
    orig_connected = db_manager.is_connected
    orig_uri = settings.MONGODB_URI
    orig_timeout = settings.MONGODB_TIMEOUT_MS
    try:
        settings.APP_ENV = "production"
        db_manager.is_connected = False
        db_manager.client = None
        settings.MONGODB_URI = "mongodb://invalid-host-pyqverse-test:27017"
        settings.MONGODB_TIMEOUT_MS = 200

        with pytest.raises(Exception):
            asyncio.run(db_manager.connect())

        # Verify client was cleaned up
        assert db_manager.client is None
        assert db_manager.is_connected is False
    finally:
        settings.APP_ENV = orig_env
        settings.MONGODB_URI = orig_uri
        settings.MONGODB_TIMEOUT_MS = orig_timeout
        db_manager.client = orig_client
        db_manager.is_connected = orig_connected

def test_production_migration_fails_when_db_offline():
    """Verify that migration_manager refuses to report offline success when DB is offline in production."""
    import pytest
    import asyncio
    import os
    from app.core.config import settings
    from app.core.database import db_manager
    from app.services.migration import migration_manager

    orig_env = settings.APP_ENV
    orig_connected = db_manager.is_connected
    try:
        settings.APP_ENV = "production"
        db_manager.is_connected = False
        fixture_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "fixtures", "seed_data.json")
        with pytest.raises(RuntimeError, match="Database Service Unavailable"):
            asyncio.run(migration_manager.migrate_from_json(fixture_path, dry_run=True))
    finally:
        settings.APP_ENV = orig_env
        db_manager.is_connected = orig_connected
