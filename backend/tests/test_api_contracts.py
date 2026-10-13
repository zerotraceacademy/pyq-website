import pytest
from app.core.config import settings
from app.core.database import db_manager
from app.core.security import create_access_token

def test_health_check_contract(client):
    """Verify health check endpoint schema."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "database" in data
    assert "ai_providers" in data
    assert "storage" in data

def test_exams_and_details_contract(client):
    """Verify exams and single exam detail routes."""
    res = client.get("/api/v1/exams")
    assert res.status_code == 200
    exams = res.json()["exams"]
    assert len(exams) > 0
    first_slug = exams[0]["slug"]

    res_detail = client.get(f"/api/v1/exams/{first_slug}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert "exam" in detail
    assert "subjects" in detail
    assert "papers" in detail

def test_papers_search_and_filter(client):
    """Verify paper filtering by search query and year."""
    res = client.get("/api/v1/papers?search=JEE")
    assert res.status_code == 200
    papers = res.json()["papers"]
    assert len(papers) > 0
    for p in papers:
        assert "jee" in p["title"].lower() or "jee" in p["examName"].lower()

def test_practice_question_answer_check(client):
    """Verify practice answer checker returns verified solution."""
    q_res = client.get("/api/v1/questions")
    assert q_res.status_code == 200
    questions = q_res.json()["questions"]
    assert len(questions) > 0

    first_q = questions[0]
    correct_opt = first_q["correctAnswer"]

    check_res = client.post(
        f"/api/v1/questions/{first_q['id']}/check",
        json={"selectedOption": correct_opt}
    )
    assert check_res.status_code == 200
    check_data = check_res.json()
    assert check_data["isCorrect"] is True
    assert "solution" in check_data

def test_cbt_attempt_lifecycle_and_idempotency(client, student_token):
    """
    Test full CBT lifecycle:
    1. Start test -> receive sanitized questions (no answers exposed)
    2. Autosave progress
    3. Final submit -> calculate marks and negative marks
    4. Resubmit -> idempotent return of same attempt
    5. Review attempt -> answers now accessible
    """
    headers = {"Authorization": f"Bearer {student_token}"}

    tests_res = client.get("/api/v1/mock-tests")
    assert tests_res.status_code == 200
    mock_tests = tests_res.json()["mockTests"]
    assert len(mock_tests) > 0
    test_id = mock_tests[0]["id"]

    start_res = client.post(f"/api/v1/mock-tests/{test_id}/start", headers=headers)
    assert start_res.status_code == 200
    start_data = start_res.json()
    attempt = start_data["attempt"]
    attempt_id = attempt["id"]
    questions = start_data["questions"]

    for q in questions:
        assert "correctAnswer" not in q
        assert "verifiedSolution" not in q

    q_id = questions[0]["id"]
    autosave_res = client.post(
        f"/api/v1/attempts/{attempt_id}/save-progress",
        json={"answers": {q_id: {"selectedOption": "A", "timeSpentSeconds": 45}}},
        headers=headers
    )
    assert autosave_res.status_code == 200
    assert autosave_res.json()["success"] is True

    submit_res = client.post(
        f"/api/v1/attempts/{attempt_id}/submit",
        json={"answers": {q_id: {"selectedOption": "A", "timeSpentSeconds": 45}}},
        headers=headers
    )
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["success"] is True
    assert sub_data["alreadySubmitted"] is False
    assert "score" in sub_data["attempt"]

    first_score = sub_data["attempt"]["score"]

    dup_res = client.post(
        f"/api/v1/attempts/{attempt_id}/submit",
        json={"answers": {q_id: {"selectedOption": "B"}}},
        headers=headers
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["alreadySubmitted"] is True
    assert dup_data["attempt"]["score"] == first_score

    review_res = client.get(f"/api/v1/attempts/{attempt_id}", headers=headers)
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["attempt"]["status"] in ("completed", "expired")
    assert "correctAnswer" in rev_data["questions"][0]

def test_attempt_cross_user_isolation(client, student_token):
    """Verify that Student B cannot mutate or save Student A's attempt."""
    headers_a = {"Authorization": f"Bearer {student_token}"}
    tests_res = client.get("/api/v1/mock-tests")
    test_id = tests_res.json()["mockTests"][0]["id"]

    start_res = client.post(f"/api/v1/mock-tests/{test_id}/start", headers=headers_a)
    attempt_id = start_res.json()["attempt"]["id"]

    # Student B token
    token_b = create_access_token({
        "sub": "usr_other_student",
        "email": "other@pyqverse.edu",
        "role": "student"
    })
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Student B tries to mutate Student A's attempt
    res = client.post(
        f"/api/v1/attempts/{attempt_id}/save-progress",
        json={"answers": {}},
        headers=headers_b
    )
    assert res.status_code == 403
    assert "Cannot mutate another user's examination attempt" in res.json()["detail"]

def test_production_mode_blocks_silent_fallback(client):
    """Verify that production mode strictly refuses to serve memory fixtures if DB is disconnected."""
    orig_env = settings.APP_ENV
    orig_connected = db_manager.is_connected
    try:
        settings.APP_ENV = "production"
        db_manager.is_connected = False

        res = client.get("/api/v1/auth/me")
        # In production without DB, must not silently serve demo fixture
        assert res.status_code in (401, 503)
    finally:
        settings.APP_ENV = orig_env
        db_manager.is_connected = orig_connected

def test_cors_vercel_origin_handling(client):
    """Verify that requests and preflights from Vercel deployments receive correct CORS headers."""
    # 1. Simple request from a Vercel preview domain
    vercel_origin = "https://pyqverse-production-preview.vercel.app"
    res = client.get("/api/v1/health", headers={"Origin": vercel_origin})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == vercel_origin
    assert res.headers.get("access-control-allow-credentials") == "true"

    # 2. Preflight OPTIONS request with Authorization header
    options_res = client.options(
        "/api/v1/auth/me",
        headers={
            "Origin": vercel_origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization, content-type"
        }
    )
    assert options_res.status_code == 200
    assert options_res.headers.get("access-control-allow-origin") == vercel_origin
