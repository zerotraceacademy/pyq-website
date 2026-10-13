from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from app.repositories.data_store import data_store
from app.core.security import get_current_user_payload

router = APIRouter(prefix="/study-plans", tags=["Study Planner"])

@router.get("")
async def get_study_plan(token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    plan = await data_store.get_study_plan(user_id)
    if not plan:
        # Generate default initial plan fixture
        plan = {
            "id": f"stp_{user_id}",
            "userId": user_id,
            "targetExam": "JEE Main & Advanced 2025",
            "examDate": "2025-05-25",
            "dailyHours": 6.5,
            "weakTopics": ["Rotational Dynamics", "Coordination Compounds", "Definite Integration"],
            "totalTasks": 4,
            "completedTasks": 1,
            "tasks": [
                {
                    "id": "tsk_01",
                    "title": "Master Rotational Kinematics & Moment of Inertia PYQs",
                    "subject": "Physics",
                    "topic": "Rotational Dynamics",
                    "targetQuestions": 25,
                    "estimatedMinutes": 90,
                    "completed": True,
                    "dueDate": "2025-03-01",
                    "priority": "high"
                },
                {
                    "id": "tsk_02",
                    "title": "Solve Coordination Chemistry Isomerism & CFT Questions",
                    "subject": "Chemistry",
                    "topic": "Coordination Compounds",
                    "targetQuestions": 30,
                    "estimatedMinutes": 80,
                    "completed": False,
                    "dueDate": "2025-03-03",
                    "priority": "high"
                },
                {
                    "id": "tsk_03",
                    "title": "Practice Definite Integrals Properties & King's Rule",
                    "subject": "Mathematics",
                    "topic": "Definite Integration",
                    "targetQuestions": 20,
                    "estimatedMinutes": 75,
                    "completed": False,
                    "dueDate": "2025-03-05",
                    "priority": "medium"
                },
                {
                    "id": "tsk_04",
                    "title": "Full CBT Mock Test 01 - 3hr Proctored Simulation",
                    "subject": "All Subjects",
                    "topic": "Comprehensive Full Syllabus",
                    "targetQuestions": 75,
                    "estimatedMinutes": 180,
                    "completed": False,
                    "dueDate": "2025-03-08",
                    "priority": "high"
                }
            ]
        }
        await data_store.save_study_plan(plan)

    return {"plan": plan}

@router.post("/generate")
async def generate_study_plan(
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    target_exam = payload.get("targetExam", "JEE Main")
    exam_date = payload.get("examDate", "2025-05-25")
    daily_hours = float(payload.get("dailyHours", 5.0))

    tasks = [
        {
            "id": f"tsk_{int(datetime.now(timezone.utc).timestamp())}_1",
            "title": f"High-Weightage PYQ Drill for {target_exam}",
            "subject": "Core Subjects",
            "topic": "Diagnostic Sprint",
            "targetQuestions": int(daily_hours * 5),
            "estimatedMinutes": int(daily_hours * 30),
            "completed": False,
            "dueDate": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
            "priority": "high"
        },
        {
            "id": f"tsk_{int(datetime.now(timezone.utc).timestamp())}_2",
            "title": "Mistake Notebook Revision & Concept Cleansing",
            "subject": "Weak Areas",
            "topic": "Error Analysis",
            "targetQuestions": 15,
            "estimatedMinutes": 60,
            "completed": False,
            "dueDate": (datetime.now(timezone.utc) + timedelta(days=4)).strftime("%Y-%m-%d"),
            "priority": "medium"
        }
    ]

    new_plan = {
        "id": f"stp_{user_id}",
        "userId": user_id,
        "targetExam": target_exam,
        "examDate": exam_date,
        "dailyHours": daily_hours,
        "weakTopics": ["Rotational Dynamics", "Organic Reaction Mechanisms"],
        "totalTasks": len(tasks),
        "completedTasks": 0,
        "tasks": tasks
    }

    saved = await data_store.save_study_plan(new_plan)
    return {"success": True, "plan": saved}

@router.put("/tasks/{id}")
async def toggle_plan_task(
    id: str,
    payload: Dict[str, Any],
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_payload)
):
    user_id = token_payload["sub"] if token_payload else "usr_student_demo"
    plan = await data_store.get_study_plan(user_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found")

    completed = bool(payload.get("completed", False))
    task_found = False

    for t in plan.get("tasks", []):
        if t["id"] == id:
            t["completed"] = completed
            task_found = True
            break

    if not task_found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in study plan")

    plan["completedTasks"] = sum(1 for t in plan.get("tasks", []) if t.get("completed"))
    updated = await data_store.save_study_plan(plan)
    return {"success": True, "plan": updated}
