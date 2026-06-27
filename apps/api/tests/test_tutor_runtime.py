import pytest
import sqlite3
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from src.api.main import app
from src.domains.ater.tutor_service import TutorSessionManager
from src.domains.ater.srs import SRSEngine

@pytest.fixture
def temp_vault():
    with tempfile.TemporaryDirectory() as tmpdir:
        vault = Path(tmpdir)
        
        # Setup typical structure
        (vault / "database/learning paths").mkdir(parents=True, exist_ok=True)
        (vault / "database/General/Git/01_Foundations").mkdir(parents=True, exist_ok=True)
        (vault / "Inbox").mkdir(parents=True, exist_ok=True)
        
        # 1. Create a dummy Hub
        hub_content = """---
type: Learning Hub
topic: Git
chapters:
  - "[[Chapter_01_Foundations]]"
---
# Git Practice Hub
"""
        (vault / "database/learning paths/Git_Hub.md").write_text(hub_content, encoding="utf-8")
        
        # 2. Create a dummy Chapter
        chapter_content = """---
type: Chapter
hub: "[[Git_Hub]]"
order: 1
notes:
  - "[[Git_Three_State_Model]]"
---
# Chapter 1 Foundations
"""
        (vault / "database/General/Git/01_Foundations/Chapter_01_Foundations.md").write_text(chapter_content, encoding="utf-8")
        
        # 3. Create dummy note
        note_content = """---
title: Git Three State Model
type: atomic
course: CS101
---
# 1. Mental Model
Some explanation.
# 2. The Core Execution
Mechanism details.
# 3. Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "What state is not part of the Git three-state model?",
    "options": ["Working Directory", "Staging Area", "Remote Mirror", "Local Repository"],
    "answer": "Remote Mirror",
    "explanation": "Git states are working directory, staging area, and local repository."
  }
]
```
"""
        (vault / "database/General/Git/01_Foundations/Git_Three_State_Model.md").write_text(note_content, encoding="utf-8")
        
        yield vault

@pytest.fixture
def srs_db(temp_vault):
    db_path = temp_vault / "Inbox/ater_queue.db"
    engine = SRSEngine(db_path)
    engine.db.close()
    return db_path

def test_sqlite_schema_init(srs_db):
    conn = sqlite3.connect(str(srs_db))
    conn.row_factory = sqlite3.Row
    
    # Check tables exist
    res = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    tables = [r["name"] for r in res]
    assert "tutor_sessions" in tables
    assert "user_misconceptions" in tables
    
    # Check columns
    cols_res = conn.execute("PRAGMA table_info(tutor_sessions)").fetchall()
    cols = [c["name"] for c in cols_res]
    assert "session_id" in cols
    assert "hub_path" in cols
    assert "score" in cols
    assert "status" in cols
    assert "active_note_unlocks" in cols
    assert "consecutive_failures" in cols
    assert "active_question_overrides" in cols
    conn.close()


def test_tutor_session_state_machine(temp_vault, srs_db):
    manager = TutorSessionManager(srs_db, temp_vault)
    
    # Start Session
    session = manager.start_session("session1", "database/learning paths/Git_Hub.md")
    assert session["session_id"] == "session1"
    assert session["score"] == 0
    assert "Git_Three_State_Model.md" in session["current_note_path"]
    assert len(session["curriculum"]) == 1
    
    # Load Session
    loaded = manager.get_session("session1")
    assert loaded["session_id"] == "session1"
    assert loaded["current_note_path"] == session["current_note_path"]

def test_confidence_scoring_logic(temp_vault, srs_db):
    manager = TutorSessionManager(srs_db, temp_vault)
    manager.start_session("session2", "database/learning paths/Git_Hub.md")
    
    # Correct + High Confidence -> +10
    res = manager.submit_answer("session2", "q1", is_correct=True, wager="high")
    assert res["score"] == 10
    assert res["score_change"] == 10
    
    # Incorrect + High Confidence -> -5
    res = manager.submit_answer("session2", "q1", is_correct=False, wager="high")
    assert res["score"] == 5
    assert res["score_change"] == -5
    
    # Correct + Low Confidence -> +5
    res = manager.submit_answer("session2", "q1", is_correct=True, wager="low")
    assert res["score"] == 10
    assert res["score_change"] == 5
    
    # Incorrect + Low Confidence -> 0 (no change)
    res = manager.submit_answer("session2", "q1", is_correct=False, wager="low")
    assert res["score"] == 10
    assert res["score_change"] == 0

    # Test Floor (score cannot go below 0)
    # Deducting 5 repeatedly
    manager.submit_answer("session2", "q1", is_correct=False, wager="high") # 10 -> 5
    res = manager.submit_answer("session2", "q1", is_correct=False, wager="high") # 5 -> 0
    assert res["score"] == 0
    res = manager.submit_answer("session2", "q1", is_correct=False, wager="high") # 0 -> 0 (clamped)
    assert res["score"] == 0

def test_misconception_logging(temp_vault, srs_db):
    manager = TutorSessionManager(srs_db, temp_vault)
    manager.start_session("session3", "database/learning paths/Git_Hub.md")
    
    # Submit incorrect answer 1st time to get a hint (not misconception yet)
    res1 = manager.submit_answer("session3", "q1", is_correct=False, wager="high", user_answer="remote clone")
    assert res1["diagnosis"]["is_misconception"] is False
    
    # Submit incorrect answer 2nd consecutive time to trigger misconception logging
    res2 = manager.submit_answer("session3", "q1", is_correct=False, wager="high", user_answer="remote clone")
    assert res2["diagnosis"]["is_misconception"] is True
    
    # Query database to check if misconception is saved
    conn = sqlite3.connect(str(srs_db))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM user_misconceptions").fetchone()
    assert row is not None
    assert row["note_title"] == "Git_Three_State_Model"
    assert "q1" in row["misconception_text"] or "concept" in row["misconception_text"]
    conn.close()


def test_tutor_advance_progression(temp_vault, srs_db):
    manager = TutorSessionManager(srs_db, temp_vault)
    manager.start_session("session4", "database/learning paths/Git_Hub.md")
    
    res = manager.advance_note("session4")
    # Only one note in curriculum, advancing should mark session complete
    assert res["status"] == "completed"

def test_tutor_endpoints_e2e(temp_vault, srs_db):
    # Setup test client headers and mock app secrets
    from src.api.deps import get_app_secrets, AppSecrets
    
    secrets = AppSecrets(
        vault_path=str(temp_vault),
        inbox_path=str(temp_vault / "Inbox"),
        academic_path=str(temp_vault),
        ai_provider="openai",
        ai_model="gpt-4o-mini",
        ai_key="mock-key"
    )
    
    app.dependency_overrides[get_app_secrets] = lambda: secrets
    client = TestClient(app)
    
    # 1. Start Tutor Endpoint
    res = client.post("/api/ater/tutor/start", json={
        "session_id": "test_e2e",
        "hub_path": "database/learning paths/Git_Hub.md"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] == "test_e2e"
    assert data["score"] == 0
    
    # 2. Status Endpoint
    res = client.get("/api/ater/tutor/status?session_id=test_e2e")
    assert res.status_code == 200
    assert res.json()["session_id"] == "test_e2e"
    
    # 3. Submit Endpoint
    res = client.post("/api/ater/tutor/submit", json={
        "session_id": "test_e2e",
        "question_id": "q1",
        "is_correct": True,
        "wager": "high",
        "user_answer": "correct_answer"
    })
    assert res.status_code == 200
    assert res.json()["score"] == 10
    
    # Clean overrides
    app.dependency_overrides.clear()
