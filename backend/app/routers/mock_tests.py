from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.repositories.data_store import data_store
from app.services.exam_engine import exam_engine
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/mock-tests", tags=["Mock Tests"])

@router.get("")
async def get_mock_tests():
    tests = await data_store.list_mock_tests()
    return {"mockTests": tests}

@router.get("/{id}")
async def get_mock_test_details(id: str):
    test = await data_store.get_mock_test_by_id(id)
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock test not found")
    questions = await data_store.list_questions()
    test_questions = [q for q in questions if q["id"] in test.get("questionIds", [])]
    return {"test": test, "questions": test_questions}

@router.post("/{id}/start")
async def start_mock_test(
    id: str,
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    """
    Initializes a new CBT exam attempt.
    CRITICAL: Strips answers and solutions before returning questions to browser
    so students cannot extract keys via network inspection or developer tools!
    """
    test = await data_store.get_mock_test_by_id(id)
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock test not found")

    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    attempt_id = f"att_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    started_at = datetime.now(timezone.utc).isoformat()
    duration_minutes = test.get("durationMinutes", 180)

    new_attempt = {
        "id": attempt_id,
        "userId": user_id,
        "mockTestId": test["id"],
        "mockTestTitle": test["title"],
        "examName": test["examName"],
        "startedAt": started_at,
        "submittedAt": None,
        "status": "in_progress",
        "timeRemainingSeconds": duration_minutes * 60,
        "answers": {}
    }

    await data_store.create_attempt(new_attempt)

    # Increment attempts count on test
    new_count = test.get("attemptsCount", 0) + 1
    # Note: data store keeps test in memory or DB
    test["attemptsCount"] = new_count

    # Fetch and sanitize questions
    all_questions = await data_store.list_questions()
    test_questions = [q for q in all_questions if q["id"] in test.get("questionIds", [])]
    safe_questions = exam_engine.sanitize_questions_for_attempt(test_questions)

    return {
        "attempt": new_attempt,
        "test": test,
        "questions": safe_questions
    }
