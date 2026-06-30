import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import tempfile

from src.api.main import app
from src.domains.obsidian.router import UpdateRowRequest, DB_DIR_PREFIX

client = TestClient(app)

@pytest.fixture
def temp_vault():
    with tempfile.TemporaryDirectory() as d:
        yield Path(d)

def test_update_row_request_model():
    req = UpdateRowRequest(properties={"status": "In Progress", "priority": 1})
    assert req.properties["status"] == "In Progress"
    assert req.properties["priority"] == 1

    # Empty properties
    req = UpdateRowRequest(properties={})
    assert req.properties == {}

def test_update_vault_row_no_vault_path():
    response = client.patch(
        "/api/vault/databases/test_db/test_file.md",
        json={"properties": {"test": "value"}}
    )
    assert response.status_code == 401
    assert "X-Vault-Path header missing" in response.json()["detail"]

def test_update_vault_row_file_not_found(temp_vault):
    response = client.patch(
        "/api/vault/databases/test_db/non_existent.md",
        json={"properties": {"test": "value"}},
        headers={"X-Vault-Path": str(temp_vault)}
    )
    assert response.status_code == 404
    assert "File not found" in response.json()["detail"]

def test_update_vault_row_success(temp_vault):
    db_name = "test_db"
    file_name = "test_file.md"

    db_dir = temp_vault / DB_DIR_PREFIX / db_name
    db_dir.mkdir(parents=True)

    file_path = db_dir / file_name

    original_content = "---\ntitle: Original\ntags: [a, b]\n---\n# Body\nHello world!"
    file_path.write_text(original_content, encoding="utf-8")

    response = client.patch(
        f"/api/vault/databases/{db_name}/{file_name}",
        json={"properties": {"title": "Updated", "new_prop": 123, "last_synced": "delete_me"}},
        headers={"X-Vault-Path": str(temp_vault)}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["id"] == file_name
    assert data["properties"]["title"] == "Updated"
    assert data["properties"]["new_prop"] == 123
    assert "last_synced" not in data["properties"]
    assert data["properties"]["tags"] == ["a", "b"]

    updated_content = file_path.read_text(encoding="utf-8")
    assert "---\n" in updated_content
    assert "title: Updated\n" in updated_content
    assert "new_prop: 123\n" in updated_content
    assert "tags:\n- a\n- b\n" in updated_content
    assert "last_synced" not in updated_content
    assert "# Body\nHello world!" in updated_content

def test_update_vault_row_no_frontmatter(temp_vault):
    db_name = "test_db"
    file_name = "no_frontmatter.md"

    db_dir = temp_vault / DB_DIR_PREFIX / db_name
    db_dir.mkdir(parents=True)

    file_path = db_dir / file_name
    file_path.write_text("# Just a heading\nNo frontmatter here.", encoding="utf-8")

    response = client.patch(
        f"/api/vault/databases/{db_name}/{file_name}",
        json={"properties": {"title": "Updated"}},
        headers={"X-Vault-Path": str(temp_vault)}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "No frontmatter found"

def test_update_vault_row_without_md_extension(temp_vault):
    db_name = "test_db"
    file_name = "test_file"

    db_dir = temp_vault / DB_DIR_PREFIX / db_name
    db_dir.mkdir(parents=True)

    file_path = db_dir / f"{file_name}.md"

    original_content = "---\ntitle: Original\n---\n# Body\nHello world!"
    file_path.write_text(original_content, encoding="utf-8")

    response = client.patch(
        f"/api/vault/databases/{db_name}/{file_name}",
        json={"properties": {"title": "Updated"}},
        headers={"X-Vault-Path": str(temp_vault)}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["properties"]["title"] == "Updated"
