from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import create_access_token, get_current_user_payload, hash_password, verify_password
from app.repositories.data_store import data_store
from app.models.schemas import DemoLoginRequest, UserLoginRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me")
async def get_current_user(token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)):
    """Returns the authenticated user or default demo persona in development mode."""
    if token_payload and "sub" in token_payload:
        user = await data_store.get_user_by_id(token_payload["sub"])
        if user:
            return {"user": user}

    # If demo mode is permitted and no token is present, supply default demo student
    if settings.is_demo_mode_allowed():
        demo_user = await data_store.get_user_by_role("student")
        if demo_user:
            return {"user": demo_user, "isDemoPersona": True}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

@router.post("/demo-login")
async def demo_login(payload: DemoLoginRequest):
    """
    Persona Switcher endpoint.
    Strictly gated: only allowed in development/staging environments. Disabled in production.
    Issues a cryptographically signed JWT token for the requested role.
    """
    if not settings.is_demo_mode_allowed():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo persona switching is strictly disabled in production mode."
        )

    target_user = await data_store.get_user_by_role(payload.role)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No user found for role '{payload.role}'")

    token_data = {
        "sub": target_user["id"],
        "email": target_user["email"],
        "role": target_user["role"],
        "name": target_user["name"]
    }
    access_token = create_access_token(token_data)

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": target_user
    }

@router.post("/login")
async def login(payload: UserLoginRequest):
    """Production password-authenticated login endpoint."""
    user = await data_store.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or credentials")

    # In production, verify stored password hash
    if "password_hash" in user:
        if not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or credentials")
    elif settings.APP_ENV.lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password authentication not initialized for this account. Please reset password."
        )

    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"]
    }
    access_token = create_access_token(token_data)

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/update-profile")
async def update_profile(
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    """Updates user profile preferences (name, target exam, preferred language)."""
    if not token_payload:
        if settings.APP_ENV.lower() == "production":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        user_id = "usr_student_demo"
    else:
        user_id = token_payload["sub"]
    allowed_fields = {"name", "targetExam", "preferredLanguage", "avatar"}
    updates = {k: v for k, v in payload.items() if k in allowed_fields}

    updated_user = await data_store.update_user(user_id, updates)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"success": True, "user": updated_user}
