from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from app.repositories.data_store import data_store

router = APIRouter(tags=["Exams & Subjects"])

@router.get("/exams")
async def get_exams():
    exams = await data_store.list_exams()
    return {"exams": exams}

@router.get("/exams/{slug}")
async def get_exam_details(slug: str):
    exam = await data_store.get_exam_by_slug(slug)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    subjects = await data_store.list_subjects(exam["id"])
    papers = await data_store.list_papers(exam_id=exam["id"])
    return {"exam": exam, "subjects": subjects, "papers": papers}

@router.get("/subjects")
async def get_subjects(examId: Optional[str] = Query(None)):
    subjects = await data_store.list_subjects(examId)
    return {"subjects": subjects}

@router.get("/subjects/{slug}")
async def get_subject_details(slug: str):
    subject = await data_store.get_subject_by_slug(slug)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    topics = await data_store.list_topics(subject["id"])
    questions = await data_store.list_questions(subject_id=subject["id"])
    return {"subject": subject, "topics": topics, "questions": questions}

@router.get("/topics")
async def get_topics(subjectId: Optional[str] = Query(None)):
    topics = await data_store.list_topics(subjectId)
    return {"topics": topics}
