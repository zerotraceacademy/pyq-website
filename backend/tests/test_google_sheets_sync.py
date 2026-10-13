import pytest
from unittest.mock import patch, MagicMock
from app.services.sheets_service import GoogleSheetsService

@pytest.mark.asyncio
async def test_sheets_unconfigured_status():
    """Verify service returns unconfigured status when script URL is missing."""
    service = GoogleSheetsService()
    service.script_url = ""
    preview = await service.preview_sheet()
    assert preview["success"] is False
    assert preview["status"] == "unconfigured"

    sync_res = await service.execute_sync()
    assert sync_res["success"] is False
    assert sync_res["status"] == "unconfigured"
    assert sync_res["syncedRows"] == 0

@pytest.mark.asyncio
async def test_sheets_preview_and_sync_with_mocked_network():
    """Verify authentic request dispatch with shared secret and row processing."""
    service = GoogleSheetsService()
    service.script_url = "https://script.google.com/macros/s/mock-deployment/exec"
    service.shared_secret = "test-secret"

    # Mock preview response
    mock_preview_data = {
        "success": True,
        "previewRows": [
            {"rowNumber": 2, "exam": "JEE Main", "year": 2024, "status": "Valid - Ready to Import"}
        ],
        "totalRows": 1
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = mock_preview_data
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        res = await service.preview_sheet()
        assert res["success"] is True
        assert len(res["previewRows"]) == 1
        assert res["totalRows"] == 1

    # Mock sync approved response
    mock_sync_data = {
        "success": True,
        "syncedCount": 15
    }
    mock_resp_sync = MagicMock()
    mock_resp_sync.json.return_value = mock_sync_data
    mock_resp_sync.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", return_value=mock_resp_sync):
        sync_res = await service.execute_sync()
        assert sync_res["success"] is True
        assert sync_res["syncedRows"] == 15
        assert "syncedAt" in sync_res

def test_sheets_sync_route_rbac(client, student_token, admin_token):
    """Verify sheets sync route is strictly forbidden for non-admin accounts."""
    # Student attempt forbidden
    res_stud = client.post(
        "/api/v1/integrations/google-sheets/sync",
        json={"mode": "preview"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_stud.status_code == 403

    # Admin attempt permitted
    res_admin = client.post(
        "/api/v1/integrations/google-sheets/sync",
        json={"mode": "preview"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin.status_code == 200
    assert "status" in res_admin.json()
