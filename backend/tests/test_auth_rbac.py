import pytest
import time
from fastapi import HTTPException
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.core.config import settings

def test_password_hash_and_verify():
    """Verify PBKDF2 secure password hashing and verification."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed.startswith("pbkdf2:sha256:100000$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_roundtrip():
    """Verify HS256 JWT creation, claims preservation, and decoding."""
    payload = {
        "sub": "usr_test_123",
        "email": "student@pyqverse.edu",
        "role": "student"
    }
    token = create_access_token(payload, expires_minutes=15)
    decoded = decode_access_token(token)

    assert decoded["sub"] == "usr_test_123"
    assert decoded["email"] == "student@pyqverse.edu"
    assert decoded["role"] == "student"
    assert "exp" in decoded

def test_jwt_tampered_token_rejected():
    """Verify that modified token signatures fail cryptographic verification."""
    token = create_access_token({"sub": "usr_test", "role": "student"})
    tampered = token[:-4] + "ABCD"
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(tampered)
    assert exc_info.value.status_code == 401

def test_jwt_expired_token_rejected():
    """Verify that expired tokens are cleanly rejected."""
    # Create token that expired 10 seconds ago
    token = create_access_token({"sub": "usr_expired"}, expires_minutes=-1)
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()

def test_rbac_admin_endpoint_forbidden_for_student(client, student_token):
    """Verify students cannot access administrative endpoints."""
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/v1/admin/dashboard-stats", headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_rbac_admin_endpoint_allowed_for_admin(client, admin_token):
    """Verify administrators have access to dashboard statistics."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/v1/admin/dashboard-stats", headers=headers)
    assert response.status_code == 200
    assert "catalogStats" in response.json()
