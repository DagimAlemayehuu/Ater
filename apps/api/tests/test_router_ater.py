import os
import tempfile
import pathlib
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.routers.ater import resolve_note_path

client = TestClient(app)

# =====================================================================
# PR 38: resolve_note_path Helper Tests
# =====================================================================

def test_resolve_note_path_valid(tmp_path):
    # Simple relative path
    (tmp_path / "hello.md").write_text("content")
    res = resolve_note_path("hello.md", tmp_path)
    assert res == "hello.md"

def test_resolve_note_path_nested(tmp_path):
    # Subdirectories
    sub = tmp_path / "Sub" / "Folder"
    sub.mkdir(parents=True)
    (sub / "notes.md").write_text("content")
    res = resolve_note_path("Sub/Folder/notes.md", tmp_path)
    assert res == "Sub/Folder/notes.md"

def test_resolve_note_path_absolute_safety(tmp_path):
    # Absolute paths are forced relative to vault root
    note_path = tmp_path / "file.md"
    note_path.write_text("content")
    res = resolve_note_path(str(note_path), tmp_path)
    assert res == "file.md"

def test_resolve_note_path_relative_escape(tmp_path):
    res = resolve_note_path("/absolute/path/file.md", tmp_path)
    assert res is None

def test_resolve_note_path_search(tmp_path):
    sub = tmp_path / "Sub"
    sub.mkdir()
    (sub / "target_note.md").write_text("content")
    res = resolve_note_path("target_note", tmp_path)
    assert res == "Sub/target_note.md"


# =====================================================================
# PR 30: Read Obsidian File Endpoint Tests
# =====================================================================

def test_read_obsidian_file_missing_vault_path():
    response = client.get("/api/obsidian/file?path=test.md")
    assert response.status_code == 400
    assert response.json() == {"detail": "Vault Path missing"}

def test_read_obsidian_file_not_found(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    response = client.get("/api/obsidian/file?path=nonexistent.md", headers=headers)
    assert response.status_code == 404
    assert response.json() == {"detail": "File not found"}

def test_read_obsidian_file_success(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    test_file = tmp_path / "test.md"
    test_file.write_text("Hello Obsidian content", encoding="utf-8")

    response = client.get("/api/obsidian/file?path=test.md", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"content": "Hello Obsidian content", "metadata": {}}


# =====================================================================
# PR 40: Write Obsidian File Endpoint Tests
# =====================================================================

def test_write_obsidian_file_missing_vault_path():
    response = client.post("/api/obsidian/file?path=test.md", json="test")
    assert response.status_code == 400
    assert response.json() == {"detail": "Vault Path missing"}

def test_write_obsidian_file_success(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    response = client.post("/api/obsidian/file?path=subfolder/new_note.md", json="Written content", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    written_file = tmp_path / "subfolder" / "new_note.md"
    assert written_file.exists()
    assert written_file.read_text(encoding="utf-8") == "Written content"

def test_write_obsidian_file_failure(tmp_path, monkeypatch):
    headers = {"x-vault-path": str(tmp_path)}
    
    def mock_write_text(self, *args, **kwargs):
        raise IOError("Mocked disk error")

    monkeypatch.setattr(pathlib.Path, "write_text", mock_write_text)

    response = client.post("/api/obsidian/file?path=error.md", json="written", headers=headers)
    assert response.status_code == 500
    assert "Mocked disk error" in response.json()["detail"]


# =====================================================================
# PR 28: List Obsidian Files Endpoint Tests
# =====================================================================

def test_list_obsidian_files_missing_vault():
    response = client.get("/api/obsidian/files")
    assert response.status_code == 400
    assert response.json() == {"detail": "Vault Path missing"}

def test_list_obsidian_files_empty(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    response = client.get("/api/obsidian/files", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"files": []}

def test_list_obsidian_files_success(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    
    # Create structure
    (tmp_path / "file1.md").write_text("1")
    (tmp_path / "file2.txt").write_text("2")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "nested.md").write_text("3")

    response = client.get("/api/obsidian/files", headers=headers)
    assert response.status_code == 200
    data = response.json()
    files = data["files"]
    
    assert len(files) == 4
    # Check that they include file paths relative to vault root
    paths = [f["path"] for f in files]
    assert "file1.md" in paths
    assert "file2.txt" in paths
    assert "sub" in paths
    assert "sub/nested.md" in paths


# =====================================================================
# PR 42: Delete Obsidian Item Endpoint Tests
# =====================================================================

def test_delete_obsidian_item_missing_vault():
    response = client.delete("/api/obsidian/item?path=some_file.txt")
    assert response.status_code == 400
    assert response.json() == {"detail": "Vault Path missing"}

def test_delete_obsidian_item_not_found(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    response = client.delete("/api/obsidian/item?path=nonexistent.txt", headers=headers)
    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found"}

def test_delete_obsidian_item_file(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    test_file = tmp_path / "test_file.txt"
    test_file.write_text("hello")

    response = client.delete("/api/obsidian/item?path=test_file.txt", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "success"}
    assert not test_file.exists()

def test_delete_obsidian_item_dir(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    test_dir = tmp_path / "test_dir"
    test_dir.mkdir()
    test_file = test_dir / "inside.txt"
    test_file.write_text("hello")

    response = client.delete("/api/obsidian/item?path=test_dir", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "success"}
    assert not test_dir.exists()

def test_delete_obsidian_item_exception(tmp_path, monkeypatch):
    headers = {"x-vault-path": str(tmp_path)}
    test_file = tmp_path / "test_file_err.txt"
    test_file.write_text("hello")

    def mock_unlink(self, *args, **kwargs):
        raise Exception("Mocked exception")

    monkeypatch.setattr(pathlib.Path, "unlink", mock_unlink)

    response = client.delete("/api/obsidian/item?path=test_file_err.txt", headers=headers)
    assert response.status_code == 500
    assert response.json() == {"detail": "Mocked exception"}
    assert test_file.exists()


# =====================================================================
# Refine Source Learning Job Roadmap Tests
# =====================================================================

from unittest.mock import patch, AsyncMock

def test_refine_source_learning_job_roadmap_missing_instruction(tmp_path):
    headers = {"x-vault-path": str(tmp_path)}
    response = client.post("/api/ater/source/jobs/srcjob_123/roadmap/refine", json={}, headers=headers)
    assert response.status_code == 400
    assert "instruction is required" in response.json()["detail"]

@patch("src.domains.ai.factory.ModelFactory.get_model")
@patch("src.api.routers.ater._source_job_service")
def test_refine_source_learning_job_roadmap_success(mock_service_factory, mock_get_model, tmp_path):
    headers = {"x-vault-path": str(tmp_path), "x-ai-key": "mock-key"}
    
    # Mock source job service and job
    mock_service = mock_service_factory.return_value
    mock_service.get_job.return_value = {
        "job_id": "srcjob_123",
        "topic": "Economics",
        "domain": "Microeconomics",
        "roadmap": [{"title": "Concept 1"}, {"title": "Concept 2"}]
    }
    mock_service.update_roadmap_titles.return_value = {
        "job_id": "srcjob_123",
        "roadmap": [{"title": "Concept 1"}, {"title": "New Concept 2"}]
    }
    
    # Mock LLM response
    mock_llm = AsyncMock()
    mock_res = AsyncMock()
    mock_res.content = '["Concept 1", "New Concept 2"]'
    mock_llm.ainvoke.return_value = mock_res
    mock_get_model.return_value = mock_llm
    
    payload = {
        "instruction": "rename 2 to New Concept 2",
        "current_titles": ["Concept 1", "Concept 2"]
    }
    
    response = client.post("/api/ater/source/jobs/srcjob_123/roadmap/refine", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["roadmap"] == [{"title": "Concept 1"}, {"title": "New Concept 2"}]
    
    mock_service.update_roadmap_titles.assert_called_once_with("srcjob_123", ["Concept 1", "New Concept 2"])
