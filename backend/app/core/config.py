import json
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    # Application & Environment
    APP_ENV: str = Field(default="development", description="development | production | test")
    APP_NAME: str = "PYQVerse Backend Engine"
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://pyqverse.edu"
    ]
    CORS_ORIGIN_REGEX: Optional[str] = r"^https://.*\.vercel\.app$"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    @field_validator("FRONTEND_ORIGINS", mode="before")
    @classmethod
    def parse_frontend_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Persona & Auth Security
    DEMO_PERSONAS_ENABLED: bool = Field(
        default=True,
        description="Disabled automatically in production mode unless explicitly forced"
    )
    SESSION_SECRET: str = "super_secure_jwt_secret_pyqverse_key_change_in_production"
    JWT_SECRET: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "pyqverse_production"
    MONGODB_TIMEOUT_MS: int = 5000

    # AI Providers
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    AI_DEFAULT_PROVIDER: str = "gemini"
    AI_FALLBACK_ENABLED: bool = True
    AI_REQUEST_TIMEOUT: int = 25
    AI_MAX_RETRIES: int = 2
    AI_DAILY_USER_QUOTA: int = 100

    # Cloudflare R2 S3-Compatible Storage
    CLOUDFLARE_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "pyqverse-vault"
    R2_ENDPOINT_URL: str = ""
    R2_PUBLIC_BASE_URL: str = ""
    R2_SIGNED_URL_EXPIRATION_SECONDS: int = 900  # 15 minutes

    # Google Apps Script Integration Bridge
    GOOGLE_APPS_SCRIPT_URL: str = ""
    GOOGLE_APPS_SCRIPT_SHARED_SECRET: str = ""
    GOOGLE_SHEETS_SYNC_TIMEOUT_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_jwt_secret(self) -> str:
        return self.JWT_SECRET or self.SESSION_SECRET

    def is_demo_mode_allowed(self) -> bool:
        if self.APP_ENV.lower() == "production":
            return False
        return self.DEMO_PERSONAS_ENABLED

    def validate_production_configuration(self) -> None:
        """
        Validates that critical security secrets and remote service configurations
        are provided when running in production mode.
        """
        if self.APP_ENV.lower() == "production":
            jwt_sec = self.get_jwt_secret()
            if not jwt_sec or jwt_sec == "super_secure_jwt_secret_pyqverse_key_change_in_production":
                raise ValueError(
                    "Production configuration error: JWT_SECRET must be explicitly configured with a secure key."
                )
            if not self.MONGODB_URI or "localhost" in self.MONGODB_URI or "127.0.0.1" in self.MONGODB_URI:
                raise ValueError(
                    "Production configuration error: MONGODB_URI must be configured with a remote cluster connection string."
                )

settings = Settings()
