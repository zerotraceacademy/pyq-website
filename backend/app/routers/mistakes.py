from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.repositories.data_store import data_store
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/mistakes", tags=["Mistake Notebook"])

@router.get("")
async def get_mistakes(token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    mistakes = await data_store.list_mistakes(user_id)
    return {"mistakes": mistakes}

@router.put("/{id}")
async def update_mistake(
    id: str,
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    updates: Dict[str, Any] = {}
    if "status" in payload:
        updates["status"] = payload["status"]
    if "studentNotes" in payload:
        updates["studentNotes"] = payload["studentNotes"]
    updates["lastReviewedAt"] = datetime.now(timezone.utc).isoformat()

    updated = await data_store.update_mistake(id, updates)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mistake entry not found")

    return {"success": True, "mistake": updated}
