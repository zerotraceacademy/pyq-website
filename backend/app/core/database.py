import asyncio
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("pyqverse.database")

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False

    async def connect(self):
        """Initialize MongoDB Atlas client and establish connection with timeout and serverless connection reuse."""
        if self.is_connected and self.client is not None:
            return
        try:
            logger.info(f"Connecting to MongoDB Atlas database '{settings.MONGODB_DATABASE}'...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                maxPoolSize=20,
            )
            self.db = self.client[settings.MONGODB_DATABASE]
            # Verify connectivity via ping
            await self.client.admin.command('ping')
            self.is_connected = True
            logger.info("Successfully connected to MongoDB Atlas.")
            await self.ensure_indexes()
        except Exception as e:
            if self.client:
                self.client.close()
                self.client = None
            self.db = None
            self.is_connected = False
            if settings.APP_ENV.lower() == "production":
                logger.error(f"Critical: MongoDB connection failed in production mode: {e}")
                raise
            logger.warning(f"MongoDB connection failed: {e}. Falling back to in-memory/isolated storage mode.")

    async def disconnect(self):
        """Close MongoDB Atlas connections cleanly."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB Atlas connection closed.")

    async def ping(self) -> bool:
        """Check live database health."""
        if not self.client:
            return False
        try:
            await self.client.admin.command('ping')
            return True
        except Exception:
            return False

    async def ensure_indexes(self):
        """Create indexes and constraints on all collections."""
        if not self.is_connected or self.db is None:
            return
        try:
            # Users: unique email
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("id", unique=True)

            # Exams & Papers: unique slugs
            await self.db.exams.create_index("slug", unique=True)
            await self.db.exams.create_index("id", unique=True)
            await self.db.papers.create_index("slug", unique=True)
            await self.db.papers.create_index("id", unique=True)
            await self.db.papers.create_index([("examId", 1), ("year", -1)])

            # Questions: index by examId, paperId, topicId
            await self.db.questions.create_index("id", unique=True)
            await self.db.questions.create_index([("examId", 1), ("subjectId", 1)])
            await self.db.questions.create_index("paperId")

            # Mock Tests & Attempts
            await self.db.mock_tests.create_index("id", unique=True)
            await self.db.attempts.create_index("id", unique=True)
            await self.db.attempts.create_index([("userId", 1), ("mockTestId", 1)])
            await self.db.attempts.create_index("startedAt")

            # Mistakes & Bookmarks
            await self.db.mistakes.create_index("id", unique=True)
            await self.db.mistakes.create_index([("userId", 1), ("status", 1)])
            await self.db.bookmarks.create_index("id", unique=True)
            await self.db.bookmarks.create_index([("userId", 1), ("itemId", 1)])

            # Study Plans
            await self.db.study_plans.create_index("userId")

            # Audit logs
            await self.db.audit_logs.create_index("timestamp")

            logger.info("MongoDB Atlas indexes verified and initialized.")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

db_manager = DatabaseManager()

def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Dependency for obtaining active database instance."""
    return db_manager.db
