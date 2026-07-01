import tempfile
import pytest
import yaml
from pathlib import Path
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.deps import AppSecrets, get_app_secrets
from src.domains.obsidian.router import (
    DB_DIR_PREFIX,
    CreateRowRequest,
    UpdateRowRequest,
    CreateOptionRequest,
    CreateDatabaseRequest,
    ObsidianDumper
)

# Setup local client for app-wide routes
client = TestClient(app)

# Helper for dependency overrides in DB tests
def override_get_app_secrets(vault_path: str):
    def _override():
        return AppSecrets(vault_path=vault_path)
    return _override


# =====================================================================
# PR 45: Row Creation & Request Model Tests
# =====================================================================

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


# =====================================================================
# PR 32: Database Scaffolding/Creation Tests
# =====================================================================

@pytest.fixture
def test_vault_dir():
    with tempfile.TemporaryDirectory() as td:
        yield td

def test_create_vault_database(test_vault_dir):
    app.dependency_overrides[get_app_secrets] = override_get_app_secrets(test_vault_dir)
    try:
        response = client.post(
            "/api/vault/databases",
            json={"name": "test_db", "area": "test_area"}
        )
        assert response.status_code == 200
        assert response.json() == {"success": True, "id": "test_db"}

        db_path = Path(test_vault_dir) / DB_DIR_PREFIX / "test_db"
        assert db_path.exists()
        assert db_path.is_dir()
    finally:
        app.dependency_overrides.clear()

def test_create_vault_database_missing_vault_path():
    app.dependency_overrides[get_app_secrets] = lambda: AppSecrets(vault_path=None)
    try:
        response = client.post(
            "/api/vault/databases",
            json={"name": "test_db"}
        )
        assert response.status_code == 401
        assert "X-Vault-Path header missing" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

def test_create_vault_database_exception(test_vault_dir):
    app.dependency_overrides[get_app_secrets] = override_get_app_secrets(test_vault_dir)
    try:
        from unittest.mock import patch
        with patch("pathlib.Path.mkdir", side_effect=PermissionError("Permission denied")):
            response = client.post(
                "/api/vault/databases",
                json={"name": "test_db"}
            )
        assert response.status_code == 500
    finally:
        app.dependency_overrides.clear()


# =====================================================================
# PR 31: Options CRUD Tests
# =====================================================================

def test_create_property_option(test_vault_dir):
    headers = {"X-Vault-Path": test_vault_dir, "X-AI-Provider": "google"}
    source_folder = "test_source"
    option_name = "test_option"

    response = client.post(
        "/api/vault/options",
        json={"source": source_folder, "name": option_name},
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["name"] == option_name

    expected_path = Path(test_vault_dir) / source_folder / f"{option_name}.md"
    assert expected_path.exists()
    content = expected_path.read_text(encoding="utf-8")
    assert f"---\ntitle: {option_name}\n---" in content

def test_update_property_option(test_vault_dir):
    headers = {"X-Vault-Path": test_vault_dir, "X-AI-Provider": "google"}
    source_folder = "test_source"
    old_option_name = "old_option"
    new_option_name = "new_option"

    source_path = Path(test_vault_dir) / source_folder
    source_path.mkdir(parents=True, exist_ok=True)
    with open(source_path / f"{old_option_name}.md", "w") as f:
        f.write(f"---\ntitle: {old_option_name}\n---")

    response = client.patch(
        f"/api/vault/options?old_name={old_option_name}",
        json={"source": source_folder, "name": new_option_name},
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["name"] == new_option_name

    assert not (source_path / f"{old_option_name}.md").exists()
    assert (source_path / f"{new_option_name}.md").exists()

def test_update_property_option_not_found(test_vault_dir):
    headers = {"X-Vault-Path": test_vault_dir, "X-AI-Provider": "google"}
    response = client.patch(
        f"/api/vault/options?old_name=missing_option",
        json={"source": "test_source", "name": "new_option"},
        headers=headers
    )
    assert response.status_code == 404

def test_get_property_options(test_vault_dir):
    source_folder = "test_source"
    source_path = Path(test_vault_dir) / source_folder
    source_path.mkdir(parents=True, exist_ok=True)

    with open(source_path / "option1.md", "w") as f:
        f.write("---\ntitle: option1\n---")
    with open(source_path / "option2.md", "w") as f:
        f.write("---\ntitle: option2\n---")

    headers = {"X-Vault-Path": test_vault_dir, "X-AI-Provider": "google"}
    response = client.get(
        f"/api/vault/options?source={source_folder}",
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert "options" in data
    assert len(data["options"]) == 2
    assert "option1" in data["options"]
    assert "option2" in data["options"]

def test_delete_property_option(test_vault_dir):
    source_folder = "test_source"
    option_name = "to_delete"
    source_path = Path(test_vault_dir) / source_folder
    source_path.mkdir(parents=True, exist_ok=True)

    file_to_delete = source_path / f"{option_name}.md"
    with open(file_to_delete, "w") as f:
        f.write(f"---\ntitle: {option_name}\n---")

    assert file_to_delete.exists()

    headers = {"X-Vault-Path": test_vault_dir, "X-AI-Provider": "google"}
    response = client.delete(
        f"/api/vault/options?source={source_folder}&name={option_name}",
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert not file_to_delete.exists()

def test_delete_property_option_not_found(test_vault_dir):
    headers = {"X-Vault-Path": test_vault_dir, "X-AI-Provider": "google"}
    response = client.delete(
        f"/api/vault/options?source=test_source&name=missing",
        headers=headers
    )
    assert response.status_code == 404


# =====================================================================
# PR 27: Row Update Tests
# =====================================================================

@pytest.fixture
def temp_vault_path():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)

def test_update_vault_row_success(temp_vault_path):
    db_name = "test_db"
    file_name = "test_file.md"

    db_dir = temp_vault_path / DB_DIR_PREFIX / db_name
    db_dir.mkdir(parents=True)

    file_path = db_dir / file_name
    original_content = "---\ntitle: Original\ntags:\n- a\n- b\nlast_synced: '2026-06-30'\n---\n# Body\nHello world!"
    file_path.write_text(original_content, encoding="utf-8")

    response = client.patch(
        f"/api/vault/databases/{db_name}/{file_name}",
        json={"properties": {"title": "Updated", "new_prop": 123, "last_synced": "delete_me"}},
        headers={"X-Vault-Path": str(temp_vault_path)}
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

def test_update_vault_row_no_frontmatter(temp_vault_path):
    db_name = "test_db"
    file_name = "no_frontmatter.md"

    db_dir = temp_vault_path / DB_DIR_PREFIX / db_name
    db_dir.mkdir(parents=True)

    file_path = db_dir / file_name
    file_path.write_text("# Just a heading\nNo frontmatter here.", encoding="utf-8")

    response = client.patch(
        f"/api/vault/databases/{db_name}/{file_name}",
        json={"properties": {"title": "Updated"}},
        headers={"X-Vault-Path": str(temp_vault_path)}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "No frontmatter found"

def test_update_vault_row_without_md_extension(temp_vault_path):
    db_name = "test_db"
    file_name = "test_file"

    db_dir = temp_vault_path / DB_DIR_PREFIX / db_name
    db_dir.mkdir(parents=True)

    file_path = db_dir / f"{file_name}.md"
    original_content = "---\ntitle: Original\n---\n# Body\nHello world!"
    file_path.write_text(original_content, encoding="utf-8")

    response = client.patch(
        f"/api/vault/databases/{db_name}/{file_name}",
        json={"properties": {"title": "Updated"}},
        headers={"X-Vault-Path": str(temp_vault_path)}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["properties"]["title"] == "Updated"


# =====================================================================
# PR 18: ObsidianDumper Tests
# =====================================================================

def test_obsidian_dumper_exact_wikilink():
    """Test that exact wikilinks are wrapped in double quotes."""
    data = {"link": "[[My Note]]"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'link: "[[My Note]]"' in result

def test_obsidian_dumper_normal_string():
    """Test that normal strings are dumped without quotes."""
    data = {"text": "Just a normal string"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: Just a normal string' in result

def test_obsidian_dumper_partial_wikilink():
    """Test that strings containing a wikilink but not exclusively are handled normally."""
    data = {"text": "Go to [[My Note]] for more info"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: Go to [[My Note]] for more info' in result

def test_obsidian_dumper_starts_with_brackets():
    """Test string that starts with [[ but does not end with ]]"""
    data = {"text": "[[Incomplete"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: \'[[Incomplete\'' in result or 'text: "[[Incomplete"' in result or 'text: [[Incomplete' in result

def test_obsidian_dumper_ends_with_brackets():
    """Test string that ends with ]] but does not start with [["""
    data = {"text": "Incomplete]]"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: Incomplete]]' in result or 'text: \'Incomplete]]\'' in result or 'text: "Incomplete]]"' in result

def test_obsidian_dumper_empty_string():
    """Test that empty string is handled correctly."""
    data = {"text": ""}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: \'\'' in result or 'text: ""' in result or 'text:' in result

def test_obsidian_dumper_nested_dict():
    """Test within a nested dictionary."""
    data = {
        "properties": {
            "tags": ["tag1", "tag2"],
            "related": "[[Related Note]]"
        }
    }
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'related: "[[Related Note]]"' in result
    assert 'tags:\n' in result
