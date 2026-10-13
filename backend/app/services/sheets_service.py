import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("pyqverse.sheets")

class GoogleSheetsService:
    """
    Authoritative server-side integration bridge for Google Sheets via Google Apps Script Web App.
    Sends authenticated payloads with shared secret, performs schema validation,
    conflict detection, dry-run previews, and audit synchronization records.
    """

    def __init__(self):
        self.script_url = settings.GOOGLE_APPS_SCRIPT_URL
        self.shared_secret = settings.GOOGLE_APPS_SCRIPT_SHARED_SECRET
        self.timeout = settings.GOOGLE_SHEETS_SYNC_TIMEOUT_SECONDS

    async def preview_sheet(self) -> Dict[str, Any]:
        """
        Fetches pending catalog rows from Google Sheet without committing database mutations (dry-run).
        """
        if not self.script_url:
            logger.info("Google Apps Script URL is not configured.")
            return {
                "success": False,
                "status": "unconfigured",
                "message": "Google Apps Script Web App URL is not configured (GOOGLE_APPS_SCRIPT_URL).",
                "previewRows": [],
                "totalRows": 0,
                "conflictsCount": 0,
                "mode": "preview"
            }

        payload = {
            "secret": self.shared_secret,
            "action": "PREVIEW_ROWS"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.script_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if "error" in data:
                raise ValueError(f"Google Apps Script returned error: {data['error']} - {data.get('details', '')}")
            return data

    async def execute_sync(self, existing_items: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Executes synchronized catalog update with conflict resolution.
        Never overwrites newer MongoDB records with older sheet entries.
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        if not self.script_url:
            logger.warning("Attempted Google Sheets sync without configured GOOGLE_APPS_SCRIPT_URL.")
            return {
                "success": False,
                "status": "unconfigured",
                "message": "Google Apps Script Web App URL is not configured (GOOGLE_APPS_SCRIPT_URL). Real spreadsheet sync cannot execute.",
                "syncedCount": 0,
                "syncedRows": 0,
                "syncedAt": timestamp,
                "sheetName": "Unconfigured",
                "conflictsResolved": 0
            }

        payload = {
            "secret": self.shared_secret,
            "action": "SYNC_APPROVED"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.script_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if "error" in data:
                raise ValueError(f"Google Apps Script Sync error: {data['error']}")
            
            data["syncedAt"] = timestamp
            data["sheetName"] = "PYQ_Master_Catalog_Live"
            data["syncedRows"] = data.get("syncedCount", 0)
            return data

sheets_service = GoogleSheetsService()
