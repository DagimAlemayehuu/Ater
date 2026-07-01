import sqlite3
import pytest
import uuid
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
from src.api.routers.notebooklm import (
    get_notebooklm_artifact_dir,
    safe_artifact_filename,
    sync_artifact_to_db
)

# =====================================================================
# PR 24: get_notebooklm_artifact_dir Tests
# =====================================================================

def test_get_notebooklm_artifact_dir():
    with patch("src.api.routers.notebooklm.Path.home") as mock_home:
        mock_home_path = MagicMock(spec=Path)
        mock_home.return_value = mock_home_path

        mock_ater = MagicMock(spec=Path)
        mock_home_path.__truediv__.return_value = mock_ater

        mock_artifacts = MagicMock(spec=Path)
        mock_ater.__truediv__.return_value = mock_artifacts

        result = get_notebooklm_artifact_dir()

        assert result == mock_artifacts

        # Verify mkdir was called correctly
        mock_artifacts.mkdir.assert_called_once_with(parents=True, exist_ok=True)


# =====================================================================
# PR 24: safe_artifact_filename Tests
# =====================================================================

class TestSafeArtifactFilename:
    @patch.dict("src.api.routers.notebooklm.DOWNLOAD_EXTENSIONS", {"quiz": "json"})
    def test_basic_generation(self):
        result = safe_artifact_filename(
            notebook_id="notebook123",
            artifact_type="quiz",
            artifact_id="art123",
            output_format=None
        )
        assert result == "notebook_quiz_art123.json"

    @patch.dict("src.api.routers.notebooklm.FORMAT_EXTENSIONS", {"markdown": "md"})
    def test_custom_output_format(self):
        result = safe_artifact_filename(
            notebook_id="notebook123",
            artifact_type="report",
            artifact_id="art123",
            output_format="markdown"
        )
        assert result == "notebook_report_art123.md"

    @patch.dict("src.api.routers.notebooklm.DOWNLOAD_EXTENSIONS", {"quiz": "json"})
    def test_truncation(self):
        result = safe_artifact_filename(
            notebook_id="1234567890",
            artifact_type="quiz",
            artifact_id="123456789012345",
            output_format=None
        )
        assert result == "12345678_quiz_123456789012.json"

    @patch.dict("src.api.routers.notebooklm.DOWNLOAD_EXTENSIONS", {"quiz": "json"})
    def test_default_artifact_id(self):
        result = safe_artifact_filename(
            notebook_id="nb1",
            artifact_type="quiz",
            artifact_id=None,
            output_format=None
        )
        assert result == "nb1_quiz_latest.json"

    def test_fallback_extension(self):
        result = safe_artifact_filename(
            notebook_id="nb1",
            artifact_type="unknown_type",
            artifact_id="art1",
            output_format=None
        )
        assert result == "nb1_unknown_type_art1.bin"

    def test_sanitization(self):
        result = safe_artifact_filename(
            notebook_id="n/b!1",
            artifact_type="qui z*",
            artifact_id="a@r#t",
            output_format=None
        )
        assert result == "n_b_1_qui_z__a_r_t.bin"


# =====================================================================
# PR 34: sync_artifact_to_db Tests
# =====================================================================

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
