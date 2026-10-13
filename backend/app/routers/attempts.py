from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from app.repositories.data_store import data_store
from app.services.exam_engine import exam_engine
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/attempts", tags=["Exam Attempts"])

@router.post("/{id}/save-progress")
async def save_test_progress(
    id: str,
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    """
    Autosaves examination answers and calculates remaining time.
    Guards against tampering with time or saving to submitted attempts.
    """
    attempt = await data_store.get_attempt_by_id(id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    if attempt.get("status") in ("completed", "expired"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attempt has already been finalized")

    # Verify attempt ownership if token is present
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    if attempt.get("userId") != user_id and user_id != "usr_admin_demo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot mutate another user's examination attempt")

    test = await data_store.get_mock_test_by_id(attempt["mockTestId"])
    duration = test.get("durationMinutes", 180) if test else 180

    # Calculate authoritative time remaining from server clock
    server_time_remaining = exam_engine.calculate_time_remaining(attempt["startedAt"], duration)
    
    # Store validated answers
    answers = payload.get("answers") or attempt.get("answers", {})
    updates = {
        "answers": answers,
        "timeRemainingSeconds": server_time_remaining,
        "lastSavedAt": datetime.now(timezone.utc).isoformat()
    }

    # If timer expired on server, transition attempt
    if server_time_remaining <= 0 and exam_engine.is_attempt_expired(attempt["startedAt"], duration):
        updates["status"] = "expired"

    await data_store.update_attempt(id, updates)
    return {"success": True, "savedAt": updates["lastSavedAt"], "timeRemainingSeconds": server_time_remaining}

@router.post("/{id}/submit")
async def submit_mock_test(
    id: str,
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    """
    Finalizes and scores CBT attempt.
    IDEMPOTENT: If submitted multiple times concurrently or on retry, returns
    existing computed score immediately without recalculating or double-counting.
    """
    attempt = await data_store.get_attempt_by_id(id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    test = await data_store.get_mock_test_by_id(attempt["mockTestId"])
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock test metadata missing")

    # Idempotency check: Return existing result immediately
    if attempt.get("status") in ("completed", "expired"):
        return {
            "success": True,
            "attempt": attempt,
            "test": test,
            "alreadySubmitted": True
        }

    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    if attempt.get("userId") != user_id and user_id != "usr_admin_demo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot submit another user's examination attempt")

    submitted_answers = payload.get("answers") or attempt.get("answers", {})

    # Check expiration
    is_expired = exam_engine.is_attempt_expired(attempt["startedAt"], test.get("durationMinutes", 180))

    # Fetch questions for authoritative scoring
    all_questions = await data_store.list_questions()
    test_questions = [q for q in all_questions if q["id"] in test.get("questionIds", [])]

    scoring_result = exam_engine.score_attempt(
        test=test,
        questions=test_questions,
        submitted_answers=submitted_answers,
        is_expired=is_expired
    )

    submitted_at = datetime.now(timezone.utc).isoformat()
    updates = {
        **scoring_result,
        "submittedAt": submitted_at,
        "timeRemainingSeconds": 0
    }

    updated_attempt = await data_store.update_attempt(id, updates)

    # Automatically record wrong answers in Mistake Notebook
    questions_by_id = {q["id"]: q for q in test_questions}
    for q_id, ans in scoring_result["answers"].items():
        if ans.get("selectedOption") and not ans.get("isCorrect"):
            q_info = questions_by_id.get(q_id)
            if q_info:
                mistake_entry = {
                    "id": f"mst_{id}_{q_id}",
                    "userId": user_id,
                    "questionId": q_id,
                    "questionText": q_info["questionText"],
                    "subjectName": q_info["subjectName"],
                    "topicName": q_info["topicName"],
                    "examName": test["examName"],
                    "yourAnswer": ans["selectedOption"],
                    "correctAnswer": q_info["correctAnswer"],
                    "status": "unresolved",
                    "studentNotes": "Logged from CBT mock test attempt.",
                    "sourceType": "mock_test",
                    "recordedAt": submitted_at
                }
                await data_store.add_mistake(mistake_entry)

    return {
        "success": True,
        "attempt": updated_attempt,
        "test": test,
        "alreadySubmitted": False
    }

@router.get("/{id}")
async def get_attempt_review(id: str):
    """
    Returns full test attempt breakdown with verified answers and explanations.
    Answer solutions are only published once the attempt status is completed or expired.
    """
    attempt = await data_store.get_attempt_by_id(id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    test = await data_store.get_mock_test_by_id(attempt["mockTestId"])
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock test metadata missing")

    all_questions = await data_store.list_questions()
    test_questions = [q for q in all_questions if q["id"] in test.get("questionIds", [])]

    # If test is still in progress, strip answers to prevent leakage before completion
    if attempt.get("status") == "in_progress":
        safe_questions = exam_engine.sanitize_questions_for_attempt(test_questions)
        return {"attempt": attempt, "test": test, "questions": safe_questions}

    return {"attempt": attempt, "test": test, "questions": test_questions}

@router.get("")
async def get_user_attempts(token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)):
    """Returns past attempts for current user."""
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    attempts = await data_store.list_user_attempts(user_id)
    return {"attempts": attempts}
