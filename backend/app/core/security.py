import hashlib
import hmac
import base64
import json
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """PBKDF2-HMAC-SHA256 secure password hashing."""
    if not salt:
        salt = base64.b64encode(hashlib.sha256(str(time.time()).encode()).digest()[:16]).decode()
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:sha256:100000${salt}${base64.b64encode(key).decode('utf-8')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify PBKDF2 hash safely."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        salt = parts[1]
        expected_hash = parts[2]
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        actual_hash = base64.b64encode(key).decode("utf-8")
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    """Create signed HS256 JWT."""
    exp_mins = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    payload = data.copy()
    payload["iat"] = int(time.time())
    payload["exp"] = int(time.time()) + (exp_mins * 60)

    secret = settings.get_jwt_secret().encode("utf-8")
    header = {"alg": "HS256", "typ": "JWT"}

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(secret, signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify HS256 JWT."""
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure")

    header_b64, payload_b64, sig_b64 = parts
    secret = settings.get_jwt_secret().encode("utf-8")
    signing_input = f"{header_b64}.{payload_b64}".encode()

    expected_sig = hmac.new(secret, signing_input, hashlib.sha256).digest()
    
    # Pad base64
    sig_padding = 4 - (len(sig_b64) % 4)
    if sig_padding != 4:
        sig_b64_padded = sig_b64 + ("=" * sig_padding)
    else:
        sig_b64_padded = sig_b64

    actual_sig = base64.urlsafe_b64decode(sig_b64_padded.encode())
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature verification failed")

    # Decode payload
    payload_padding = 4 - (len(payload_b64) % 4)
    if payload_padding != 4:
        payload_b64_padded = payload_b64 + ("=" * payload_padding)
    else:
        payload_b64_padded = payload_b64

    payload = json.loads(base64.urlsafe_b64decode(payload_b64_padded.encode()).decode("utf-8"))
    if "exp" in payload and time.time() > payload["exp"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")

    return payload

async def get_current_user_payload(credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme)) -> Optional[Dict[str, Any]]:
    """Extract authenticated user payload or return None for public routes."""
    if not credentials:
        return None
    try:
        return decode_access_token(credentials.credentials)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed or invalid credential token")

def require_role(allowed_roles: list[str]):
    """Role-Based Access Control (RBAC) dependency."""
    async def role_checker(token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)) -> Dict[str, Any]:
        if not token_payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        user_role = token_payload.get("role", "student")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of roles {allowed_roles}, current: {user_role}"
            )
        return token_payload
    return role_checker
