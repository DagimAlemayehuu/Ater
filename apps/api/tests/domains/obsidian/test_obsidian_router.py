import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import json

from src.api.main import app
from src.api.deps import AppSecrets, get_app_secrets

# Mock dependencies
def override_get_app_secrets():
    return AppSecrets(vault_path="/tmp/test_vault")

app.dependency_overrides[get_app_secrets] = override_get_app_secrets

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_vault(tmp_path):
    # Set the mock vault path to the pytest temporary directory
    vault_dir = tmp_path / "test_vault"
    vault_dir.mkdir()
    
    def override_get_app_secrets_tmp():
        return AppSecrets(vault_path=str(vault_dir))
    
    app.dependency_overrides[get_app_secrets] = override_get_app_secrets_tmp
    
    # Create the db dir
    db_dir = vault_dir / "database"
    db_dir.mkdir()
    
    yield vault_dir

def test_list_vault_databases(setup_vault):
    # Create a dummy database dir
    (setup_vault / "database" / "TestDB").mkdir()
    response = client.get("/api/vault/databases")
    assert response.status_code == 200
    # Before the fix, this would crash with NameError for ruamel.
    
def test_safe_name_used_in_create_option(setup_vault):
    # Create an option with a path traversal attempt in the name
    response = client.post(
        "/api/vault/options", 
        json={"source": "options_dir", "name": "bad/name"}
    )
    assert response.status_code == 200
    
    # Verify the file created was sanitized to badname.md
    expected_file = setup_vault / "options_dir" / "badname.md"
    assert expected_file.exists()
    
def test_path_traversal_create_file(setup_vault):
    response = client.post(
        "/api/vault/files",
        json={"path": "../escape.md", "content": "test"}
    )
    assert response.status_code in (400, 404)

def test_path_traversal_serve_pdf(setup_vault):
    # Pass an absolute path outside the vault
    response = client.get("/api/obsidian/serve//etc/passwd")
    assert response.status_code in (400, 404)
    
    # Pass a path traversal string
    response = client.get("/api/obsidian/serve/..%2F..%2Fescape.pdf")
    assert response.status_code in (400, 404)

def test_path_traversal_create_option(setup_vault):
    response = client.post(
        "/api/vault/options",
        json={"source": "../escaped_dir", "name": "test"}
    )
    assert response.status_code in (400, 404)
    
def test_archive_path_case(setup_vault):
    # Create a DB folder to be deleted
    db_name = "TestDB"
    db_path = setup_vault / "database" / db_name
    db_path.mkdir(parents=True)
    
    response = client.delete(f"/api/vault/databases/{db_name}")
    assert response.status_code == 200
    
    # Ensure it moved to lower case database
    archive_dir = setup_vault / "database" / "12 - Archive"
    assert archive_dir.exists()
    archives = list(archive_dir.iterdir())
    assert len(archives) == 1
    assert archives[0].name.startswith("TestDB_")
