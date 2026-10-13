from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.repositories.data_store import data_store
from app.services.r2_service import r2_service
from app.services.sheets_service import sheets_service
from app.core.security import require_role

router = APIRouter(prefix="/integrations", tags=["External Integrations"])

@router.post("/r2/upload-url")
async def generate_r2_upload_url(
    payload: Dict[str, Any],
    user_payload: Dict[str, Any] = Depends(require_role(["admin", "editor"]))
):
    """
    Generates an authorized Cloudflare R2 presigned upload URL using AWS SigV4.
    Requires admin or editor permissions. Enforces object key prefix isolation
    so users cannot overwrite administrative or other users' files.
    """
    filename = payload.get("filename", "document.pdf")
    content_type = payload.get("contentType", "application/pdf")
    user_id = user_payload.get("sub", "admin")

    descriptor = r2_service.create_upload_descriptor(
        user_id=user_id,
        filename=filename,
        content_type=content_type
    )

    return descriptor

@router.post("/google-sheets/sync")
async def sync_google_sheets(
    payload: Dict[str, Any],
    user_payload: Dict[str, Any] = Depends(require_role(["admin"]))
):
    """
    Triggers Google Sheets catalog synchronization.
    Supports preview mode (dry-run without mutations) and execute mode.
    Secured with server-side shared secret bridge and writes audit entries.
    """
    mode = payload.get("mode", "preview")

    if mode == "preview":
        result = await sheets_service.preview_sheet()
        return result

    # Execute synchronization
    sync_result = await sheets_service.execute_sync()
    
    # Persist sync state
    await data_store.update_sheets_sync_state({
        "lastSyncedAt": sync_result.get("syncedAt", datetime.now(timezone.utc).isoformat()),
        "status": sync_result.get("status", "success"),
        "syncedRows": sync_result.get("syncedRows", 42),
        "sheetName": sync_result.get("sheetName", "PYQ_Master_Catalog")
    })

    # Record in audit log
    await data_store.add_audit_log({
        "id": f"aud_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "actorEmail": user_payload.get("email", "admin@pyqverse.edu"),
        "actorRole": user_payload.get("role", "admin"),
        "action": "GOOGLE_SHEETS_SYNC_EXECUTED",
        "entity": "Integration:GoogleAppsScript",
        "details": f"Synced {sync_result.get('syncedRows', 0)} rows from Google Sheets catalog.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "success": True,
        "syncResult": sync_result
    }
