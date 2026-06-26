import pytest
import json
import sqlite3
import tempfile
from pathlib import Path
from datetime import datetime
from src.domains.ater.learner_model_service import LearnerModelManager, LearnerTopicProfile, LessonRecommendation
from src.domains.ater.srs import SRSEngine

@pytest.fixture
def temp_vault():
    with tempfile.TemporaryDirectory() as tmpdir:
        vault = Path(tmpdir)
        
        # Setup typical structure
        (vault / "database/learning paths").mkdir(parents=True, exist_ok=True)
        (vault / "database/General/Git/01_Foundations").mkdir(parents=True, exist_ok=True)
        (vault / "database/General/Git/02_Advanced").mkdir(parents=True, exist_ok=True)
        (vault / "Inbox").mkdir(parents=True, exist_ok=True)
        
        # 1. Create a dummy Hub
        hub_content = """---
type: Learning Hub
topic: Git
chapters:
  - "[[Chapter_01_Foundations]]"
  - "[[Chapter_02_Advanced]]"
---
# Git Practice Hub
"""
        (vault / "database/learning paths/Git_Hub.md").write_text(hub_content, encoding="utf-8")
        
        # 2. Create Chapter 1
        chapter1_content = """---
type: Chapter
hub: "[[Git_Hub]]"
order: 1
notes:
  - "[[Git_Intro]]"
---
# Chapter 1
"""
        (vault / "database/General/Git/01_Foundations/Chapter_01_Foundations.md").write_text(chapter1_content, encoding="utf-8")
        
        # 3. Create Chapter 2
        chapter2_content = """---
type: Chapter
hub: "[[Git_Hub]]"
order: 2
notes:
  - "[[Git_Advanced_Flow]]"
---
# Chapter 2
"""
        (vault / "database/General/Git/02_Advanced/Chapter_02_Advanced.md").write_text(chapter2_content, encoding="utf-8")
        
        # 4. Create dummy notes
        note1_content = """---
title: Git Intro
type: Atomic Note
prerequisites: []
---
# Git Intro
"""
        (vault / "database/General/Git/01_Foundations/Git_Intro.md").write_text(note1_content, encoding="utf-8")

        note2_content = """---
title: Git Advanced Flow
type: Atomic Note
prerequisites:
  - "[[Git_Intro]]"
---
# Git Advanced Flow
"""
        (vault / "database/General/Git/02_Advanced/Git_Advanced_Flow.md").write_text(note2_content, encoding="utf-8")
        
        yield vault

@pytest.fixture
def db_path(temp_vault):
    return temp_vault / "Inbox/ater_queue.db"

def test_learner_profile_schema_and_persistence(temp_vault, db_path):
    # Initialize SRSEngine to run DB migrations first
    srs = SRSEngine(db_path)
    
    manager = LearnerModelManager(db_path, temp_vault)
    
    # Check table exists and schema is valid
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    res = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='learner_profile_stats'").fetchone()
    assert res is not None
    conn.close()
    
    # Update profile on a topic with no prior entries
    profile = manager.update_profile("Git")
    assert profile is not None
    assert profile.topic == "Git"
    assert profile.notes_completed_fraction == 0.0
    assert profile.accuracy_rate == 1.0
    assert profile.calibration_status == "calibrated"
    
    # Verify row was persisted in database
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM learner_profile_stats WHERE topic='Git'").fetchone()
    assert row is not None
    assert row["notes_total"] == 2
    assert row["notes_completed"] == 0
    conn.close()

def test_calibration_and_misconceptions(temp_vault, db_path):
    srs = SRSEngine(db_path)
    manager = LearnerModelManager(db_path, temp_vault)
    
    # Simulate a tutor session with overconfident wagers
    wagers = {
        "q1": {"wager": "high", "correct": False},
        "q2": {"wager": "high", "correct": False},
        "q3": {"wager": "high", "correct": False},
    }
    
    conn = sqlite3.connect(str(db_path))
    conn.execute("""
        INSERT INTO tutor_sessions (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "sess1", "database/learning paths/Git_Hub.md", "database/General/Git/01_Foundations/Git_Intro.md",
        json.dumps([]), json.dumps(wagers), 0, "completed", datetime.now().isoformat()
    ))
    conn.commit()
    
    # Log a misconception
    conn.execute("""
        INSERT INTO user_misconceptions (topic, note_title, misconception_text, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        "Git", "Git_Intro", "Confused working tree with index.", datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    
    profile = manager.update_profile("Git")
    assert profile.calibration_status == "overconfident"
    assert "Confused working tree with index." in profile.common_misconceptions
    
    # Underconfident scenario: high ratio of correct answers wagered with low confidence
    conn = sqlite3.connect(str(db_path))
    conn.execute("DELETE FROM tutor_sessions")
    wagers_under = {
        "q1": {"wager": "low", "correct": True},
        "q2": {"wager": "low", "correct": True},
        "q3": {"wager": "low", "correct": True},
    }
    conn.execute("""
        INSERT INTO tutor_sessions (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "sess2", "database/learning paths/Git_Hub.md", "database/General/Git/01_Foundations/Git_Intro.md",
        json.dumps([]), json.dumps(wagers_under), 0, "completed", datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    
    profile2 = manager.update_profile("Git")
    assert profile2.calibration_status == "underconfident"

def test_next_lesson_recommendation_and_prerequisites(temp_vault, db_path):
    srs = SRSEngine(db_path)
    manager = LearnerModelManager(db_path, temp_vault)
    
    # Get recommendations when no lessons have been studied yet
    recs = manager.recommend_next_lessons("Git", limit=5)
    assert len(recs) == 2
    
    # Git_Intro should be ranked above Git_Advanced_Flow because Git_Advanced_Flow has prerequisite penalty
    assert recs[0].note_path == "database/General/Git/01_Foundations/Git_Intro.md"
    assert recs[0].reason != "Prerequisites not met"
    assert recs[1].note_path == "database/General/Git/02_Advanced/Git_Advanced_Flow.md"
    assert recs[1].reason == "Prerequisites not met"
    
    # Now complete Git_Intro
    srs.review("database/General/Git/01_Foundations/Git_Intro.md", rating=3) # reps becomes 1
    
    # Re-evaluate recommendations
    recs2 = manager.recommend_next_lessons("Git", limit=5)
    assert len(recs2) == 1
    assert recs2[0].note_path == "database/General/Git/02_Advanced/Git_Advanced_Flow.md"
    assert recs2[0].reason != "Prerequisites not met"
