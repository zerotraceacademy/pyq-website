import pytest
from datetime import datetime, timezone, timedelta
from app.services.exam_engine import ExamEngine

def test_question_sanitization():
    """Verify answer keys and solutions are completely stripped during active tests."""
    raw_questions = [
        {
            "id": "q1",
            "questionNumber": 1,
            "questionText": "What is the speed of light?",
            "options": [{"key": "A", "text": "3e8 m/s"}, {"key": "B", "text": "2e8 m/s"}],
            "correctAnswer": "A",
            "marks": 4.0,
            "negativeMarks": 1.0,
            "difficulty": "Easy",
            "verifiedSolution": {"finalAnswer": "A", "stepByStep": ["Measured experimentally."]}
        }
    ]

    sanitized = ExamEngine.sanitize_questions_for_attempt(raw_questions)
    assert len(sanitized) == 1
    assert "correctAnswer" not in sanitized[0]
    assert "verifiedSolution" not in sanitized[0]
    assert sanitized[0]["questionText"] == "What is the speed of light?"
    assert sanitized[0]["marks"] == 4.0

def test_scoring_jee_main_marking_scheme():
    """Verify standard JEE Main marking scheme (+4, -1, 0)."""
    test_meta = {
        "id": "t1",
        "questionIds": ["q1", "q2", "q3", "q4"],
        "negativeMarkingRatio": 0.25
    }
    questions = [
        {"id": "q1", "marks": 4.0, "negativeMarks": 1.0, "correctAnswer": "A"},
        {"id": "q2", "marks": 4.0, "negativeMarks": 1.0, "correctAnswer": "B"},
        {"id": "q3", "marks": 4.0, "negativeMarks": 1.0, "correctAnswer": "C"},
        {"id": "q4", "marks": 4.0, "negativeMarks": 1.0, "correctAnswer": "D"},
    ]
    # 2 correct (q1, q2), 1 incorrect (q3 with 'A'), 1 unattempted (q4)
    submitted_answers = {
        "q1": {"selectedOption": "A", "timeSpentSeconds": 60},
        "q2": {"selectedOption": "B", "timeSpentSeconds": 70},
        "q3": {"selectedOption": "A", "timeSpentSeconds": 45},  # wrong
        "q4": {"selectedOption": None, "timeSpentSeconds": 10}
    }

    result = ExamEngine.score_attempt(test_meta, questions, submitted_answers)

    assert result["correctCount"] == 2
    assert result["incorrectCount"] == 1
    assert result["unansweredCount"] == 1
    # 2 * 4 - 1 * 1 = 7.0
    assert result["score"] == 7.0
    assert result["maxMarks"] == 16.0
    # Accuracy: 2 / (2 + 1) * 100 = 66.7%
    assert result["accuracyPercentage"] == 66.7
    assert result["status"] == "completed"

def test_scoring_gate_fractional_marking():
    """Verify GATE examination 1/3rd fractional negative marks."""
    test_meta = {
        "id": "t_gate",
        "questionIds": ["q1", "q2"],
        "negativeMarkingRatio": 0.3333
    }
    questions = [
        {"id": "q1", "marks": 1.0, "negativeMarks": 0.33, "correctAnswer": "B"},
        {"id": "q2", "marks": 2.0, "negativeMarks": 0.67, "correctAnswer": "D"}
    ]
    # 1 correct (q1), 1 incorrect (q2)
    submitted = {
        "q1": {"selectedOption": "B", "timeSpentSeconds": 90},
        "q2": {"selectedOption": "A", "timeSpentSeconds": 120}
    }

    result = ExamEngine.score_attempt(test_meta, questions, submitted)
    assert result["correctCount"] == 1
    assert result["incorrectCount"] == 1
    # 1.0 - 0.67 = 0.33
    assert result["score"] == 0.33

def test_timer_calculation_and_expiry():
    """Verify server-side timer calculations."""
    now = datetime.now(timezone.utc)
    started_recent = (now - timedelta(minutes=10)).isoformat()
    remaining = ExamEngine.calculate_time_remaining(started_recent, duration_minutes=60)
    # Remaining should be approximately 50 minutes = 3000 seconds
    assert 2990 <= remaining <= 3005

    # Expired attempt (started 2 hours ago for a 60 min test)
    started_old = (now - timedelta(hours=2)).isoformat()
    assert ExamEngine.is_attempt_expired(started_old, duration_minutes=60) is True
    assert ExamEngine.calculate_time_remaining(started_old, duration_minutes=60) == 0
