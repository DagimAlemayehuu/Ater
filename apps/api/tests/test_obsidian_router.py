import tempfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_create_vault_row_success():
    with tempfile.TemporaryDirectory() as temp_dir:
        vault_path = temp_dir
        headers = {"X-Vault-Path": vault_path}

        payload = {
            "title": "My Test Row",
            "properties": {
                "status": "In Progress",
                "priority": "High"
            }
        }
        response = client.post("/api/vault/databases/test_db", json=payload, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["id"] == "My Test Row"

        db_path = Path(vault_path) / "database" / "test_db"
        file_path = db_path / "My Test Row.md"
        assert file_path.exists()

        content = file_path.read_text(encoding="utf-8")
        assert "status: In Progress" in content
        assert "priority: High" in content

def test_create_vault_row_unauthorized():
    payload = {
        "title": "My Test Row",
        "properties": {}
    }
    # No headers provided
    response = client.post("/api/vault/databases/test_db", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "X-Vault-Path header missing"

def test_create_vault_row_sanitize_title():
    with tempfile.TemporaryDirectory() as temp_dir:
        vault_path = temp_dir
        headers = {"X-Vault-Path": vault_path}

        payload = {
            "title": "Bad * Title ?",
            "properties": {}
        }
        response = client.post("/api/vault/databases/test_db", json=payload, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # "Bad * Title ?" -> "Bad  Title " -> "Bad  Title"
        assert data["id"] == "Bad  Title"

        db_path = Path(vault_path) / "database" / "test_db"
        file_path = db_path / "Bad  Title.md"
        assert file_path.exists()

def test_create_vault_row_empty_title():
    with tempfile.TemporaryDirectory() as temp_dir:
        vault_path = temp_dir
        headers = {"X-Vault-Path": vault_path}

        payload = {
            "title": "***???", # Strips down to empty
            "properties": {}
        }
        response = client.post("/api/vault/databases/test_db", json=payload, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "Untitled"

        db_path = Path(vault_path) / "database" / "test_db"
        file_path = db_path / "Untitled.md"
        assert file_path.exists()

def test_create_vault_row_duplicate_title():
    with tempfile.TemporaryDirectory() as temp_dir:
        vault_path = temp_dir
        headers = {"X-Vault-Path": vault_path}

        payload = {
            "title": "Dup Test",
            "properties": {}
        }

        # First creation
        response1 = client.post("/api/vault/databases/test_db", json=payload, headers=headers)
        assert response1.status_code == 200
        assert response1.json()["id"] == "Dup Test"

        # Second creation
        response2 = client.post("/api/vault/databases/test_db", json=payload, headers=headers)
        assert response2.status_code == 200
        assert response2.json()["id"] == "Dup Test (1)"

        # Third creation
        response3 = client.post("/api/vault/databases/test_db", json=payload, headers=headers)
        assert response3.status_code == 200
        assert response3.json()["id"] == "Dup Test (2)"

        db_path = Path(vault_path) / "database" / "test_db"
        assert (db_path / "Dup Test.md").exists()
        assert (db_path / "Dup Test (1).md").exists()
        assert (db_path / "Dup Test (2).md").exists()

from src.domains.obsidian.router import CreateRowRequest, UpdateRowRequest, CreateOptionRequest, CreateDatabaseRequest

def test_create_row_request_model():
    req = CreateRowRequest(title="My Row", properties={"status": "Active"})
    assert req.title == "My Row"
    assert req.properties["status"] == "Active"

def test_update_row_request_model():
    req = UpdateRowRequest(properties={"status": "Inactive"})
    assert req.properties["status"] == "Inactive"

def test_create_option_request_model():
    req = CreateOptionRequest(source="Status", name="Active")
    assert req.source == "Status"
    assert req.name == "Active"

def test_create_database_request_model():
    req = CreateDatabaseRequest(name="My DB")
    assert req.name == "My DB"
    assert req.area is None

    req_with_area = CreateDatabaseRequest(name="My DB", area="Core")
    assert req_with_area.name == "My DB"
    assert req_with_area.area == "Core"
