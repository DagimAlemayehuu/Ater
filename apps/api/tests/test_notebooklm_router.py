import sqlite3
import pytest
import uuid
import json
from pathlib import Path
from unittest.mock import patch
from src.api.routers.notebooklm import sync_artifact_to_db

@pytest.fixture
def temp_db(tmp_path):
    db_path = tmp_path / "ater_queue.db"
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        "CREATE TABLE notebooklm_quizzes (id TEXT PRIMARY KEY, notebook_id TEXT, title TEXT, data TEXT, created_at TEXT)"
    )
    conn.execute(
        "CREATE TABLE notebooklm_flashcards (id TEXT PRIMARY KEY, notebook_id TEXT, title TEXT, data TEXT, created_at TEXT)"
    )
    conn.commit()
    conn.close()
    return db_path

def test_sync_artifact_to_db_quiz_success(temp_db):
    notebook_id = "nb_123"
    artifact_type = "quiz"
    title = "Test Quiz"
    data_json = json.dumps({"question": "What is 2+2?", "answer": "4"})

    artifact_id = sync_artifact_to_db(temp_db, notebook_id, artifact_type, title, data_json)

    assert isinstance(artifact_id, str)
    uuid.UUID(artifact_id)  # Should not raise exception

    conn = sqlite3.connect(str(temp_db))
    cursor = conn.execute("SELECT notebook_id, title, data, created_at FROM notebooklm_quizzes WHERE id = ?", (artifact_id,))
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row[0] == notebook_id
    assert row[1] == title
    assert row[2] == data_json
    assert row[3] is not None  # created_at should be populated

def test_sync_artifact_to_db_flashcards_success(temp_db):
    notebook_id = "nb_456"
    artifact_type = "flashcards"
    title = "Test Flashcards"
    data_json = json.dumps([{"front": "A", "back": "B"}])

    artifact_id = sync_artifact_to_db(temp_db, notebook_id, artifact_type, title, data_json)

    conn = sqlite3.connect(str(temp_db))
    cursor = conn.execute("SELECT notebook_id, title, data FROM notebooklm_flashcards WHERE id = ?", (artifact_id,))
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row[0] == notebook_id
    assert row[1] == title
    assert row[2] == data_json

def test_sync_artifact_to_db_failure_raises_exception(tmp_path):
    # Pass a path to a non-existent directory or just rely on missing tables
    db_path = tmp_path / "missing_tables.db"

    with pytest.raises(Exception):
        sync_artifact_to_db(db_path, "nb_789", "quiz", "Fail Title", "{}")
