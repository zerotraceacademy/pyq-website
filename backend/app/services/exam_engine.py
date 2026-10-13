import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from app.models.schemas import TestAttemptModel, MockTestModel, QuestionModel, AttemptAnswerModel

class ExamEngine:
    """
    Authoritative server-side examination timing, validation, and scoring engine.
    Controls attempt lifecycles, autosaves, question sanitization, and idempotent submission.
    """

    GRACE_PERIOD_SECONDS = 60  # Allow up to 60s network latency on final submission

    @staticmethod
    def sanitize_questions_for_attempt(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Strips answer keys and step-by-step solutions from questions
        so students cannot extract answers via browser developer tools.
        """
        sanitized = []
        for q in questions:
            sanitized.append({
                "id": q.get("id"),
                "questionNumber": q.get("questionNumber", 1),
                "questionText": q.get("questionText", ""),
                "options": q.get("options", []),
                "marks": q.get("marks", 4.0),
                "negativeMarks": q.get("negativeMarks", 1.0),
                "difficulty": q.get("difficulty", "Medium"),
                "subjectName": q.get("subjectName", ""),
                "topicName": q.get("topicName", "")
            })
        return sanitized

    @staticmethod
    def calculate_time_remaining(started_at_iso: str, duration_minutes: int) -> int:
        """Computes server-authoritative time remaining in seconds."""
        started_dt = datetime.fromisoformat(started_at_iso.replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        elapsed = (now_dt - started_dt).total_seconds()
        total_seconds = duration_minutes * 60
        remaining = int(total_seconds - elapsed)
        return max(0, remaining)

    @staticmethod
    def is_attempt_expired(started_at_iso: str, duration_minutes: int) -> bool:
        """Determines if the attempt window plus grace period has lapsed."""
        started_dt = datetime.fromisoformat(started_at_iso.replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        max_allowed_dt = started_dt + timedelta(minutes=duration_minutes, seconds=ExamEngine.GRACE_PERIOD_SECONDS)
        return now_dt > max_allowed_dt

    @classmethod
    def score_attempt(
        cls,
        test: Dict[str, Any],
        questions: List[Dict[str, Any]],
        submitted_answers: Dict[str, Any],
        is_expired: bool = False
    ) -> Dict[str, Any]:
        """
        Server-authoritative scoring engine supporting dynamic marking schemes.
        Corrects for negative marking ratio, marks per question, and aggregates accuracy.
        """
        questions_by_id = {q["id"]: q for q in questions}
        final_answers: Dict[str, Dict[str, Any]] = {}
        
        total_score: float = 0.0
        correct_count: int = 0
        incorrect_count: int = 0
        unanswered_count: int = 0
        total_time_spent: int = 0
        max_possible_marks: float = 0.0

        for q_id in test.get("questionIds", []):
            q = questions_by_id.get(q_id)
            if not q:
                continue

            q_marks = float(q.get("marks", 4.0))
            q_neg_marks = float(q.get("negativeMarks", q_marks * float(test.get("negativeMarkingRatio", 0.25))))
            max_possible_marks += q_marks

            user_ans = submitted_answers.get(q_id) or {}
            selected_option = user_ans.get("selectedOption")
            time_spent = int(user_ans.get("timeSpentSeconds", 0))
            marked_review = bool(user_ans.get("markedForReview", False))
            total_time_spent += time_spent

            if selected_option:
                correct_opt = q.get("correctAnswer", "")
                if selected_option.strip().upper() == correct_opt.strip().upper():
                    is_correct = True
                    score_awarded = q_marks
                    total_score += score_awarded
                    correct_count += 1
                else:
                    is_correct = False
                    score_awarded = -abs(q_neg_marks)
                    total_score += score_awarded
                    incorrect_count += 1
            else:
                is_correct = False
                score_awarded = 0.0
                unanswered_count += 1

            final_answers[q_id] = {
                "questionId": q_id,
                "selectedOption": selected_option,
                "timeSpentSeconds": time_spent,
                "markedForReview": marked_review,
                "isCorrect": is_correct,
                "scoreAwarded": round(score_awarded, 2)
            }

        attempted_total = correct_count + incorrect_count
        accuracy = round((correct_count / attempted_total) * 100, 1) if attempted_total > 0 else 0.0
        
        return {
            "score": round(total_score, 2),
            "maxMarks": round(max_possible_marks, 2),
            "accuracyPercentage": accuracy,
            "correctCount": correct_count,
            "incorrectCount": incorrect_count,
            "unansweredCount": unanswered_count,
            "totalTimeSpentSeconds": total_time_spent,
            "answers": final_answers,
            "status": "completed" if not is_expired else "expired"
        }

exam_engine = ExamEngine()
