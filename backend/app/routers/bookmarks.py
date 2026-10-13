from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.repositories.data_store import data_store
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])

@router.get("")
async def get_bookmarks(token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    bookmarks = await data_store.list_bookmarks(user_id)
    return {"bookmarks": bookmarks}

@router.post("")
async def add_bookmark(
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    bookmark_id = f"bm_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    new_bookmark = {
        "id": bookmark_id,
        "userId": user_id,
        "itemType": payload.get("itemType", "paper"),
        "itemId": payload.get("itemId", ""),
        "title": payload.get("title", ""),
        "subtitle": payload.get("subtitle", ""),
        "notes": payload.get("notes", ""),
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    saved = await data_store.add_bookmark(new_bookmark)
    return {"success": True, "bookmark": saved}

@router.delete("/{id}")
async def remove_bookmark(
    id: str,
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    deleted = await data_store.delete_bookmark(id, user_id)
    return {"success": deleted}
