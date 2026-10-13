import pytest
import urllib.parse
from app.services.r2_service import r2_service

def test_r2_sigv4_presigned_upload_url():
    """Verify authentic AWS SigV4 signed PUT upload URL structure."""
    user_id = "usr_student_demo"
    desc = r2_service.create_upload_descriptor(
        user_id=user_id,
        filename="physics_2025.pdf",
        content_type="application/pdf"
    )

    assert "uploadUrl" in desc
    assert "objectKey" in desc
    assert desc["objectKey"].startswith(f"uploads/{user_id}/")
    assert desc["objectKey"].endswith("_physics_2025.pdf")
    assert desc["maxSizeBytes"] == 50 * 1024 * 1024

    url = desc["uploadUrl"]
    assert "X-Amz-Algorithm=AWS4-HMAC-SHA256" in url
    assert "X-Amz-Signature=" in url
    assert "X-Amz-Expires=900" in url

def test_r2_presigned_download_url():
    """Verify authentic AWS SigV4 signed GET download URL structure and expiration."""
    desc = r2_service.create_download_descriptor(
        object_key="papers/jee_main_2024_s1.pdf",
        filename="jee_main_2024_s1.pdf"
    )

    assert "downloadUrl" in desc
    assert "expiresAt" in desc
    url = desc["downloadUrl"]
    assert "papers/jee_main_2024_s1.pdf" in url
    assert "X-Amz-Signature=" in url

def test_r2_upload_route_requires_privileged_role(client, student_token, admin_token):
    """Verify only admin/editor accounts can invoke R2 upload descriptor endpoint."""
    # Student attempt
    res = client.post(
        "/api/v1/integrations/r2/upload-url",
        json={"filename": "test.pdf", "contentType": "application/pdf"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403

    # Admin attempt
    res_admin = client.post(
        "/api/v1/integrations/r2/upload-url",
        json={"filename": "test.pdf", "contentType": "application/pdf"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin.status_code == 200
    assert "uploadUrl" in res_admin.json()
