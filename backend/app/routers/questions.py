from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.repositories.data_store import data_store

router = APIRouter(prefix="/questions", tags=["Questions & Practice"])

@router.get("")
async def get_questions(
    examId: Optional[str] = Query(None),
    subjectId: Optional[str] = Query(None),
    topicId: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None)
):
    questions = await data_store.list_questions(
        exam_id=examId,
        subject_id=subjectId,
        topic_id=topicId,
        difficulty=difficulty
    )
    return {"questions": questions}

@router.get("/{id}")
async def get_question(id: str):
    question = await data_store.get_question_by_id(id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return {"question": question}

@router.post("/{id}/check")
async def check_answer(id: str, payload: Dict[str, Any]):
    """
    Practice mode instant answer checker.
    Validates selected option against answer key and returns verified breakdown.
    Logs to mistake notebook if answered incorrectly.
    """
    question = await data_store.get_question_by_id(id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    selected_option = payload.get("selectedOption", "").strip().upper()
    correct_answer = question.get("correctAnswer", "").strip().upper()
    is_correct = (selected_option == correct_answer)

    # If incorrect, automatically record in mistake notebook for student review
    if not is_correct and selected_option:
        mistake = {
            "id": f"mst_{int(datetime.now(timezone.utc).timestamp())}_{id}",
            "userId": "usr_student_demo",
            "questionId": question["id"],
            "questionText": question["questionText"],
            "subjectName": question["subjectName"],
            "topicName": question["topicName"],
            "examName": question["examName"],
            "yourAnswer": selected_option,
            "correctAnswer": correct_answer,
            "status": "unresolved",
            "studentNotes": payload.get("notes") or "Reviewed in practice mode.",
            "sourceType": "practice",
            "recordedAt": datetime.now(timezone.utc).isoformat()
        }
        await data_store.add_mistake(mistake)

    return {
        "isCorrect": is_correct,
        "correctAnswer": question["correctAnswer"],
        "solution": question.get("verifiedSolution", {
            "finalAnswer": question["correctAnswer"],
            "stepByStep": ["Refer to conceptual syllabus guide."],
            "keyConcept": "Standard syllabus topic.",
            "commonMistakes": ""
        })
    }
