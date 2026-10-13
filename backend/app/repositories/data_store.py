import json
import os
import copy
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.core.database import db_manager
from app.core.config import settings

FIXTURE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fixtures", "seed_data.json")

class DataStore:
    """
    Unified MongoDB Atlas persistence repository with resilient dev/test fallback.
    Provides collection-level operations with validation, index queries, and transactional updates.
    Enforces that production mode NEVER silently falls back to local fixtures.
    """

    def __init__(self):
        self._memory_data: Dict[str, Any] = {}
        self._load_memory_fixtures()

    @property
    def is_production(self) -> bool:
        return settings.APP_ENV.lower() == "production"

    def _check_production_db(self):
        """Strict gate: Prevents silent fixture fallback when MongoDB is unavailable in production."""
        if self.is_production:
            self._memory_data = {}
            if not db_manager.is_connected or db_manager.db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database Service Unavailable: Live MongoDB Atlas connection is required in production mode."
                )

    def _load_memory_fixtures(self):
        if self.is_production:
            self._memory_data = {}
            return
        if os.path.exists(FIXTURE_PATH):
            try:
                with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
                    self._memory_data = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load seed_data.json: {e}")
                self._memory_data = {}
        else:
            self._memory_data = {}

    # --- Users ---
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.users.find_one({"id": user_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for u in self._memory_data.get("users", []):
            if u["id"] == user_id:
                return copy.deepcopy(u)
        return None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.users.find_one({"email": email.lower()})
            if doc:
                doc.pop("_id", None)
                return doc
        for u in self._memory_data.get("users", []):
            if u["email"].lower() == email.lower():
                return copy.deepcopy(u)
        return None

    async def get_user_by_role(self, role: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.users.find_one({"role": role})
            if doc:
                doc.pop("_id", None)
                return doc
        for u in self._memory_data.get("users", []):
            if u["role"] == role:
                return copy.deepcopy(u)
        return None

    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.users.update_one({"id": user_id}, {"$set": updates})
            return await self.get_user_by_id(user_id)
        for i, u in enumerate(self._memory_data.get("users", [])):
            if u["id"] == user_id:
                self._memory_data["users"][i].update(updates)
                return copy.deepcopy(self._memory_data["users"][i])
        return None

    # --- Exams & Subjects ---
    async def list_exams(self) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.exams.find({})
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        return copy.deepcopy(self._memory_data.get("exams", []))

    async def get_exam_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.exams.find_one({"slug": slug})
            if doc:
                doc.pop("_id", None)
                return doc
        for ex in self._memory_data.get("exams", []):
            if ex["slug"] == slug:
                return copy.deepcopy(ex)
        return None

    async def list_subjects(self, exam_id: Optional[str] = None) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            q = {"examId": exam_id} if exam_id else {}
            cursor = db_manager.db.subjects.find(q)
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        subs = self._memory_data.get("subjects", [])
        if exam_id:
            subs = [s for s in subs if s.get("examId") == exam_id]
        return copy.deepcopy(subs)

    async def get_subject_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.subjects.find_one({"slug": slug})
            if doc:
                doc.pop("_id", None)
                return doc
        for s in self._memory_data.get("subjects", []):
            if s["slug"] == slug:
                return copy.deepcopy(s)
        return None

    async def list_topics(self, subject_id: Optional[str] = None) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            q = {"subjectId": subject_id} if subject_id else {}
            cursor = db_manager.db.topics.find(q)
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        topics = self._memory_data.get("topics", [])
        if subject_id:
            topics = [t for t in topics if t.get("subjectId") == subject_id]
        return copy.deepcopy(topics)

    # --- Papers ---
    async def list_papers(self, exam_id: Optional[str] = None, year: Optional[int] = None, search: Optional[str] = None, paper_type: Optional[str] = None) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            q: Dict[str, Any] = {}
            if exam_id:
                q["examId"] = exam_id
            if year:
                q["year"] = int(year)
            if paper_type:
                q["paperType"] = paper_type
            if search:
                q["$or"] = [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"institution": {"$regex": search, "$options": "i"}},
                    {"examName": {"$regex": search, "$options": "i"}}
                ]
            cursor = db_manager.db.papers.find(q)
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        papers = self._memory_data.get("papers", [])
        if exam_id:
            papers = [p for p in papers if p.get("examId") == exam_id]
        if year:
            papers = [p for p in papers if p.get("year") == int(year)]
        if paper_type:
            papers = [p for p in papers if p.get("paperType") == paper_type]
        if search:
            s_lower = search.lower()
            papers = [
                p for p in papers
                if s_lower in p.get("title", "").lower() or s_lower in p.get("institution", "").lower() or s_lower in p.get("examName", "").lower()
            ]
        return copy.deepcopy(papers)

    async def get_paper_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.papers.find_one({"slug": slug})
            if doc:
                doc.pop("_id", None)
                return doc
        for p in self._memory_data.get("papers", []):
            if p["slug"] == slug:
                return copy.deepcopy(p)
        return None

    async def get_paper_by_id(self, paper_id: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.papers.find_one({"id": paper_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for p in self._memory_data.get("papers", []):
            if p["id"] == paper_id:
                return copy.deepcopy(p)
        return None

    async def create_paper(self, paper: Dict[str, Any]) -> Dict[str, Any]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.papers.insert_one(paper)
        else:
            self._memory_data.setdefault("papers", []).append(paper)
        return copy.deepcopy(paper)

    async def update_paper(self, paper_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.papers.update_one({"id": paper_id}, {"$set": updates})
            return await self.get_paper_by_id(paper_id)
        for i, p in enumerate(self._memory_data.get("papers", [])):
            if p["id"] == paper_id:
                self._memory_data["papers"][i].update(updates)
                return copy.deepcopy(self._memory_data["papers"][i])
        return None

    # --- Questions ---
    async def list_questions(
        self,
        exam_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        paper_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            q: Dict[str, Any] = {}
            if exam_id:
                q["examId"] = exam_id
            if subject_id:
                q["subjectId"] = subject_id
            if topic_id:
                q["topicId"] = topic_id
            if difficulty:
                q["difficulty"] = difficulty
            if paper_id:
                q["paperId"] = paper_id
            cursor = db_manager.db.questions.find(q)
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        questions = self._memory_data.get("questions", [])
        if exam_id:
            questions = [q for q in questions if q.get("examId") == exam_id]
        if subject_id:
            questions = [q for q in questions if q.get("subjectId") == subject_id]
        if topic_id:
            questions = [q for q in questions if q.get("topicId") == topic_id]
        if difficulty:
            questions = [q for q in questions if q.get("difficulty") == difficulty]
        if paper_id:
            questions = [q for q in questions if q.get("paperId") == paper_id]
        return copy.deepcopy(questions)

    async def get_question_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.questions.find_one({"id": question_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for q in self._memory_data.get("questions", []):
            if q["id"] == question_id:
                return copy.deepcopy(q)
        return None

    # --- Mock Tests & Attempts ---
    async def list_mock_tests(self) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.mock_tests.find({})
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        return copy.deepcopy(self._memory_data.get("mockTests", []))

    async def get_mock_test_by_id(self, test_id: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.mock_tests.find_one({"id": test_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for t in self._memory_data.get("mockTests", []):
            if t["id"] == test_id:
                return copy.deepcopy(t)
        return None

    async def create_attempt(self, attempt: Dict[str, Any]) -> Dict[str, Any]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.attempts.insert_one(attempt)
        else:
            self._memory_data.setdefault("attempts", []).append(attempt)
        return copy.deepcopy(attempt)

    async def get_attempt_by_id(self, attempt_id: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.attempts.find_one({"id": attempt_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for a in self._memory_data.get("attempts", []):
            if a["id"] == attempt_id:
                return copy.deepcopy(a)
        return None

    async def list_user_attempts(self, user_id: str) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.attempts.find({"userId": user_id}).sort("startedAt", -1)
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        attempts = [a for a in self._memory_data.get("attempts", []) if a.get("userId") == user_id]
        return copy.deepcopy(attempts)

    async def update_attempt(self, attempt_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.attempts.update_one({"id": attempt_id}, {"$set": updates})
            return await self.get_attempt_by_id(attempt_id)
        for i, a in enumerate(self._memory_data.get("attempts", [])):
            if a["id"] == attempt_id:
                self._memory_data["attempts"][i].update(updates)
                return copy.deepcopy(self._memory_data["attempts"][i])
        return None

    # --- Mistakes ---
    async def list_mistakes(self, user_id: str) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.mistakes.find({"userId": user_id})
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        items = [m for m in self._memory_data.get("mistakes", []) if m.get("userId") == user_id]
        return copy.deepcopy(items)

    async def add_mistake(self, mistake: Dict[str, Any]):
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.mistakes.insert_one(mistake)
        else:
            self._memory_data.setdefault("mistakes", []).append(mistake)

    async def update_mistake(self, mistake_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.mistakes.update_one({"id": mistake_id}, {"$set": updates})
            doc = await db_manager.db.mistakes.find_one({"id": mistake_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for i, m in enumerate(self._memory_data.get("mistakes", [])):
            if m["id"] == mistake_id:
                self._memory_data["mistakes"][i].update(updates)
                return copy.deepcopy(self._memory_data["mistakes"][i])
        return None

    # --- Bookmarks ---
    async def list_bookmarks(self, user_id: str) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.bookmarks.find({"userId": user_id})
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        items = [b for b in self._memory_data.get("bookmarks", []) if b.get("userId") == user_id]
        return copy.deepcopy(items)

    async def add_bookmark(self, bookmark: Dict[str, Any]) -> Dict[str, Any]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.bookmarks.insert_one(bookmark)
        else:
            self._memory_data.setdefault("bookmarks", []).append(bookmark)
        return copy.deepcopy(bookmark)

    async def delete_bookmark(self, bookmark_id: str, user_id: str) -> bool:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            res = await db_manager.db.bookmarks.delete_one({"id": bookmark_id, "userId": user_id})
            return res.deleted_count > 0
        bmarks = self._memory_data.get("bookmarks", [])
        before = len(bmarks)
        self._memory_data["bookmarks"] = [b for b in bmarks if not (b["id"] == bookmark_id and b["userId"] == user_id)]
        return len(self._memory_data["bookmarks"]) < before

    # --- Study Plans ---
    async def get_study_plan(self, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.study_plans.find_one({"userId": user_id})
            if doc:
                doc.pop("_id", None)
                return doc
        for p in self._memory_data.get("studyPlans", []):
            if p.get("userId") == user_id:
                return copy.deepcopy(p)
        return None

    async def save_study_plan(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.study_plans.update_one(
                {"userId": plan["userId"]},
                {"$set": plan},
                upsert=True
            )
        else:
            existing = False
            for i, p in enumerate(self._memory_data.get("studyPlans", [])):
                if p.get("userId") == plan["userId"]:
                    self._memory_data["studyPlans"][i] = plan
                    existing = True
                    break
            if not existing:
                self._memory_data.setdefault("studyPlans", []).append(plan)
        return copy.deepcopy(plan)

    # --- Audit Logs ---
    async def add_audit_log(self, log: Dict[str, Any]):
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.audit_logs.insert_one(log)
        else:
            self._memory_data.setdefault("auditLogs", []).append(log)

    async def list_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.audit_logs.find({}).sort("timestamp", -1).limit(limit)
            items = []
            async for doc in cursor:
                doc.pop("_id", None)
                items.append(doc)
            if items:
                return items
        logs = self._memory_data.get("auditLogs", [])
        return copy.deepcopy(logs[:limit])

    # --- Google Sheets State ---
    async def get_sheets_sync_state(self) -> Dict[str, Any]:
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            doc = await db_manager.db.integrations.find_one({"type": "google_sheets_sync"})
            if doc:
                doc.pop("_id", None)
                return doc
        return copy.deepcopy(self._memory_data.get("googleSheetsSync", {
            "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
            "status": "idle",
            "syncedRows": 0,
            "sheetName": "PYQ_Master_Catalog"
        }))

    async def update_sheets_sync_state(self, state: Dict[str, Any]):
        self._check_production_db()
        if db_manager.is_connected and db_manager.db is not None:
            state["type"] = "google_sheets_sync"
            await db_manager.db.integrations.update_one(
                {"type": "google_sheets_sync"},
                {"$set": state},
                upsert=True
            )
        else:
            self._memory_data["googleSheetsSync"] = state

data_store = DataStore()
