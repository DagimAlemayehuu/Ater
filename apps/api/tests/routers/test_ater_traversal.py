import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import os
import json

from src.api.main import app
from src.api.deps import AppSecrets, get_app_secrets
# from src.api.deps import AppSecrets, get_app_secrets

# Mock dependencies to avoid actual database/AI calls and isolate routing logic
def mock_get_app_secrets():
    return AppSecrets(
        vault_path="/tmp/mock_vault",
        inbox_path="/tmp/mock_vault/Inbox",
        ai_key="mock-key"
    )

client = TestClient(app)

def setup_mock_vault():
    vault = Path("/tmp/mock_vault")
    vault.mkdir(parents=True, exist_ok=True)
    inbox = vault / "Inbox"
    inbox.mkdir(parents=True, exist_ok=True)
    
    (vault / "test_note.md").write_text("Hello world")
    
    practice_path = vault / "test_practice.md"
    practice_path.write_text("---\ncompleted: false\n---\n```json\n[]\n```")

    return vault

@pytest.fixture(autouse=True)
def vault_setup():
    app.dependency_overrides[get_app_secrets] = mock_get_app_secrets
    setup_mock_vault()
    yield
    app.dependency_overrides.pop(get_app_secrets, None)

def test_obsidian_file_path_traversal():
    response = client.get("/api/obsidian/file", params={"path": "../escape.md"})
    assert response.status_code == 400
    assert response.json() == {"detail": "Path escapes vault"}

def test_obsidian_file_write_path_traversal():
    response = client.post("/api/obsidian/file", params={"path": "../escape.md"}, content="malicious")
    assert response.status_code == 400

def test_obsidian_file_delete_path_traversal():
    response = client.delete("/api/obsidian/item", params={"path": "../escape.md"})
    assert response.status_code == 400

def test_practice_get_path_traversal():
    response = client.post("/api/practice/get", json={"path": "../escape.md"})
    assert response.status_code == 400

def test_practice_score_path_traversal():
    response = client.post("/api/practice/score", json={"path": "../escape.md", "score": 90})
    assert response.status_code == 400

def test_practice_delete_path_traversal():
    response = client.post("/api/practice/delete", json={"path": "../escape.md"})
    assert response.status_code == 400

def test_note_version_restore_path_traversal():
    response = client.post("/api/ater/notes/..%2Fescape.md/restore", json={"version_id": "test"})
    assert response.status_code == 400

def test_oracle_tutor_path_traversal():
    response = client.post("/api/oracle/tutor/..%2F..%2F..%2Fetc%2Fpasswd", json={"message": "hello", "session_id": "123"})
    assert response.status_code == 400

def test_inbox_upload_path_traversal(tmp_path):
    files = {"file": ("../escape.md", b"malicious content")}
    response = client.post("/api/ater/inbox/upload", files=files)
    assert response.status_code == 200
    assert response.json()["file_name"] != "../escape.md"
    assert "escape.md" in response.json()["file_name"]
    # Verify it strips directory parts safely
    
def test_interactive_quiz_path_traversal():
    response = client.post("/api/ater/interactive-quiz", json={"note_path": "../escape.md"})
    assert response.status_code == 400

def test_interactive_quiz_valid_path():
    # Test that valid path works (it might return 500/501 internally due to missing service but 
    # not a 400 path traversal)
    response = client.post("/api/ater/interactive-quiz", json={"note_path": "test_note.md"})
    assert response.status_code in [200, 500, 501]

def test_valid_paths_still_work():
    response = client.get("/api/obsidian/file", params={"path": "test_note.md"})
    assert response.status_code == 200
