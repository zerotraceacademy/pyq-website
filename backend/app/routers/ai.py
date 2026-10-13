from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, Optional
from app.services.ai_service import ai_service
from app.repositories.data_store import data_store

router = APIRouter(prefix="/ai", tags=["AI Mentor"])

@router.post("/explain")
async def explain_question(payload: Dict[str, Any]):
    """
    AI mentor explanation route.
    Accepts questionId or raw question details, calls Gemini with Groq fallback.
    Returns structured explanation marked clearly as AI-derived.
    """
    question_id = payload.get("questionId")
    language = payload.get("userLanguage", "english")

    if question_id:
        q = await data_store.get_question_by_id(question_id)
        if q:
            question_text = q["questionText"]
            options = q["options"]
            correct_answer = q["correctAnswer"]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    else:
        question_text = payload.get("questionText", "")
        options = payload.get("options", [])
        correct_answer = payload.get("correctAnswer", "")

    try:
        res = await ai_service.explain_question(question_text, options, correct_answer, language)
        return res
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/chat")
async def chat_with_tutor(payload: Dict[str, Any]):
    """
    Conversational AI doubt solving with senior mentor personality.
    """
    message = payload.get("message", "")
    exam_context = payload.get("examContext")
    language = payload.get("userLanguage", "english")

    if not message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    try:
        res = await ai_service.chat_with_tutor(message, exam_context, language)
        return res
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
