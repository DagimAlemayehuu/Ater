import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from src.api.main import app
from unittest.mock import patch

client = TestClient(app)

def test_list_obsidian_files_missing_vault_path():
    # Sending a request without X-Vault-Path header
    response = client.get("/api/obsidian/files")
    assert response.status_code == 400
    assert "Vault Path missing" in response.json()["detail"]

def test_list_obsidian_files_vault_not_found(tmp_path):
    # Vault Path not found
    non_existent = tmp_path / "does_not_exist"
    response = client.get("/api/obsidian/files", headers={"X-Vault-Path": str(non_existent)})
    assert response.status_code == 404
    assert "Vault Path not found" in response.json()["detail"]

def test_list_obsidian_files_success(tmp_path):
    # Create structure
    valid_file = tmp_path / "test.md"
    valid_file.write_text("content")

    subfolder = tmp_path / "subfolder"
    subfolder.mkdir()
    valid_sub_file = subfolder / "test2.md"
    valid_sub_file.write_text("content2")

    hidden_file = tmp_path / ".hidden"
    hidden_file.write_text("hidden")

    node_modules = tmp_path / "node_modules"
    node_modules.mkdir()
    ignored_file1 = node_modules / "test.js"
    ignored_file1.write_text("console.log")

    practice_dir = tmp_path / "Practice"
    practice_dir.mkdir()
    ignored_file2 = practice_dir / "test.md"
    ignored_file2.write_text("practice")

    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    ignored_file3 = git_dir / "config"
    ignored_file3.write_text("config")

    response = client.get("/api/obsidian/files", headers={"X-Vault-Path": str(tmp_path)})
    assert response.status_code == 200
    data = response.json()
    files = data["files"]

    # Extract file paths
    paths = {f["path"] for f in files}

    assert "test.md" in paths
    assert "subfolder" in paths
    assert "subfolder/test2.md" in paths

    assert ".hidden" not in paths
    assert "node_modules" not in paths
    assert "node_modules/test.js" not in paths
    assert "Practice" not in paths
    assert "Practice/test.md" not in paths
    assert ".git" not in paths
    assert ".git/config" not in paths

    # Check attributes
    test_md_info = next(f for f in files if f["path"] == "test.md")
    assert not test_md_info["isDir"]
    assert "size" in test_md_info

    subfolder_info = next(f for f in files if f["path"] == "subfolder")
    assert subfolder_info["isDir"]

def test_list_obsidian_files_exception(tmp_path):
    with patch("pathlib.Path.rglob", side_effect=Exception("Mocked error")):
        response = client.get("/api/obsidian/files", headers={"X-Vault-Path": str(tmp_path)})
        assert response.status_code == 500
        assert "Mocked error" in response.json()["detail"]
