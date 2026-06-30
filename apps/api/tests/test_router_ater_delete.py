import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.api.main import app

client = TestClient(app)

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

    import pathlib
    monkeypatch.setattr(pathlib.Path, "unlink", mock_unlink)

    response = client.delete("/api/obsidian/item?path=test_file_err.txt", headers=headers)
    assert response.status_code == 500
    assert response.json() == {"detail": "Mocked exception"}
    assert test_file.exists()
