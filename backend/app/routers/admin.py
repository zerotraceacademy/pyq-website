from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.repositories.data_store import data_store
from app.core.security import require_role

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/dashboard-stats")
async def get_admin_dashboard_stats(
    user_payload: Dict[str, Any] = Depends(require_role(["admin", "editor"]))
):
    """
    Returns platform-wide administrative metrics and catalog ingestion status.
    Strictly RBAC-gated to administrator and editor accounts.
    """
    papers = await data_store.list_papers()
    questions = await data_store.list_questions()
    exams = await data_store.list_exams()
    sheets_state = await data_store.get_sheets_sync_state()
    audit_logs = await data_store.list_audit_logs(limit=10)

    pending_review = len([p for p in papers if p.get("reviewStatus") == "pending_review"])

    return {
        "catalogStats": {
            "totalPapers": len(papers),
            "totalQuestions": len(questions),
            "totalExamsSupported": len(exams),
            "pendingReviewCount": pending_review,
            "publishedPapers": len(papers) - pending_review
        },
        "storageStats": {
            "bucket": "pyqverse-vault",
            "provider": "Cloudflare R2",
            "totalFilesCount": len(papers),
            "storageStatus": "online"
        },
        "sheetsSyncStatus": sheets_state,
        "recentAuditLogs": audit_logs
    }

@router.post("/papers")
async def create_paper(
    payload: Dict[str, Any],
    user_payload: Dict[str, Any] = Depends(require_role(["admin", "editor"]))
):
    """
    Creates a new past-year question paper entry in catalog.
    Enforces required metadata, sets unique slug, and writes audit record.
    """
    title = payload.get("title")
    exam_id = payload.get("examId")
    year = payload.get("year")
    r2_key = payload.get("r2ObjectKey")

    if not title or not exam_id or not year or not r2_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: title, examId, year, r2ObjectKey"
        )

    timestamp_str = datetime.now(timezone.utc).isoformat()
    slug_base = "".join(c if c.isalnum() else "-" for c in title.lower()).strip("-")
    slug = f"{slug_base}-{year}"

    paper_id = f"pap_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    new_paper = {
        "id": paper_id,
        "slug": slug,
        "title": title,
        "examId": exam_id,
        "examName": payload.get("examName", "National Examination"),
        "subjectId": payload.get("subjectId"),
        "subjectName": payload.get("subjectName"),
        "institution": payload.get("institution", "National Testing Agency"),
        "year": int(year),
        "session": payload.get("session", "Session 1"),
        "paperType": payload.get("paperType", "Official Exam"),
        "durationMinutes": int(payload.get("durationMinutes", 180)),
        "maxMarks": int(payload.get("maxMarks", 300)),
        "language": payload.get("language", "English"),
        "r2ObjectKey": r2_key,
        "fileSizeBytes": int(payload.get("fileSizeBytes", 2500000)),
        "verifiedSolutionAvailable": bool(payload.get("verifiedSolutionAvailable", True)),
        "reviewStatus": payload.get("reviewStatus", "published"),
        "checksum": payload.get("checksum", "sha256:verified_authoritative"),
        "downloadsCount": 0,
        "viewsCount": 0,
        "createdAt": timestamp_str
    }

    created = await data_store.create_paper(new_paper)

    # Log to audit trail
    await data_store.add_audit_log({
        "id": f"aud_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "actorEmail": user_payload.get("email", "admin@pyqverse.edu"),
        "actorRole": user_payload.get("role", "admin"),
        "action": "PAPER_CREATED",
        "entity": f"QuestionPaper:{paper_id}",
        "details": f"Created paper '{title}' mapped to R2 key '{r2_key}'",
        "timestamp": timestamp_str
    })

    return {"success": True, "paper": created}

@router.put("/papers/{id}")
async def update_paper(
    id: str,
    payload: Dict[str, Any],
    user_payload: Dict[str, Any] = Depends(require_role(["admin", "editor"]))
):
    paper = await data_store.get_paper_by_id(id)
    if not paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paper not found")

    updated = await data_store.update_paper(id, payload)

    timestamp_str = datetime.now(timezone.utc).isoformat()
    await data_store.add_audit_log({
        "id": f"aud_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "actorEmail": user_payload.get("email", "admin@pyqverse.edu"),
        "actorRole": user_payload.get("role", "admin"),
        "action": "PAPER_UPDATED",
        "entity": f"QuestionPaper:{id}",
        "details": f"Updated metadata fields for '{paper.get('title')}'",
        "timestamp": timestamp_str
    })

    return {"success": True, "paper": updated}
