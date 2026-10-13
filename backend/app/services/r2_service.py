import logging
import boto3
from botocore.config import Config
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("pyqverse.r2")

class R2StorageService:
    """
    Cloudflare R2 Object Storage service using official AWS-compatible SDK (boto3).
    Generates authentic SigV4 presigned upload (PUT) and download (GET) URLs,
    enforcing object key prefix isolation, mime-type verification, and expiration constraints.
    """

    def __init__(self):
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.access_key_id = settings.R2_ACCESS_KEY_ID
        self.secret_access_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME
        self.endpoint_url = settings.R2_ENDPOINT_URL or (
            f"https://{self.account_id}.r2.cloudflarestorage.com" if self.account_id else None
        )
        self._client = None

    def _get_client(self):
        """Initializes or returns cached boto3 S3 client with SigV4 config."""
        if self._client is None:
            endpoint = self.endpoint_url or f"https://{self.bucket_name}.r2.cloudflarestorage.com"
            self._client = boto3.client(
                "s3",
                endpoint_url=endpoint,
                aws_access_key_id=self.access_key_id or "mock_access_key",
                aws_secret_access_key=self.secret_access_key or "mock_secret_key",
                region_name="auto",
                config=Config(
                    signature_version="s3v4",
                    s3={"addressing_style": "path"}
                )
            )
        return self._client

    def generate_presigned_url(
        self,
        method: str,
        object_key: str,
        expires_seconds: Optional[int] = None,
        content_type: Optional[str] = None
    ) -> str:
        """
        Generates authentic AWS SigV4 presigned URL using boto3 official SDK.
        """
        client = self._get_client()
        client_method = "put_object" if method.upper() == "PUT" else "get_object"
        expires = expires_seconds or settings.R2_SIGNED_URL_EXPIRATION_SECONDS

        params: Dict[str, Any] = {
            "Bucket": self.bucket_name,
            "Key": object_key
        }

        if client_method == "put_object" and content_type:
            params["ContentType"] = content_type

        return client.generate_presigned_url(
            ClientMethod=client_method,
            Params=params,
            ExpiresIn=expires
        )

    def create_upload_descriptor(self, user_id: str, filename: str, content_type: str = "application/pdf") -> Dict[str, Any]:
        """
        Creates an isolated upload request. Restricts key prefix to uploads/{user_id}/ to prevent overwriting others.
        """
        safe_name = "".join(c for c in filename if c.isalnum() or c in "._-")
        if not safe_name:
            safe_name = "document.pdf"
        timestamp = int(datetime.now(timezone.utc).timestamp())
        object_key = f"uploads/{user_id}/{timestamp}_{safe_name}"

        url = self.generate_presigned_url(
            method="PUT",
            object_key=object_key,
            expires_seconds=settings.R2_SIGNED_URL_EXPIRATION_SECONDS,
            content_type=content_type
        )

        return {
            "uploadUrl": url,
            "objectKey": object_key,
            "maxSizeBytes": 50 * 1024 * 1024,  # 50MB
            "expiresInSeconds": settings.R2_SIGNED_URL_EXPIRATION_SECONDS
        }

    def create_download_descriptor(self, object_key: str, filename: str) -> Dict[str, Any]:
        """
        Creates an authorized expiring download URL for a paper.
        """
        url = self.generate_presigned_url(
            method="GET",
            object_key=object_key,
            expires_seconds=settings.R2_SIGNED_URL_EXPIRATION_SECONDS
        )
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=settings.R2_SIGNED_URL_EXPIRATION_SECONDS)).isoformat()

        return {
            "downloadUrl": url,
            "filename": filename,
            "expiresAt": expires_at
        }

r2_service = R2StorageService()
