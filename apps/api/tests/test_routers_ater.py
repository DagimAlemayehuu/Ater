import pytest
from fastapi.testclient import TestClient
from pathlib import Path

from src.api.main import app
from src.api.deps import get_app_secrets, AppSecrets

client = TestClient(app)

@pytest.fixture
def temp_vault(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()

    # Create a simple file
    simple_file = vault / "simple.md"
    simple_file.write_text("Hello world", encoding="utf-8")

    # Create a file with yaml frontmatter
    yaml_file = vault / "with_yaml.md"
    yaml_file.write_text("---\ntitle: test\ntags: [a, b]\n---\nContent here.", encoding="utf-8")

    # Create a file with invalid yaml frontmatter
    bad_yaml_file = vault / "bad_yaml.md"
    bad_yaml_file.write_text("---\n[invalid yaml\n---\nContent here.", encoding="utf-8")

    return vault


@pytest.fixture
def mock_app_secrets(temp_vault):
    def override_get_app_secrets():
        return AppSecrets(vault_path=str(temp_vault))

    app.dependency_overrides[get_app_secrets] = override_get_app_secrets
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def mock_app_secrets_missing_vault():
    def override_get_app_secrets():
        return AppSecrets(vault_path=None)

    app.dependency_overrides[get_app_secrets] = override_get_app_secrets
    yield
    app.dependency_overrides.clear()


def test_read_obsidian_file_missing_vault(mock_app_secrets_missing_vault):
    """Test 400 error when vault_path is missing."""
    response = client.get("/api/obsidian/file", params={"path": "any.md"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Vault Path missing"


def test_read_obsidian_file_not_found(mock_app_secrets):
    """Test 404 error when file does not exist."""
    response = client.get("/api/obsidian/file", params={"path": "does_not_exist.md"})
    assert response.status_code == 404
    assert response.json()["detail"] == "File not found"


def test_read_obsidian_file_success(mock_app_secrets):
    """Test reading a file without metadata."""
    response = client.get("/api/obsidian/file", params={"path": "simple.md"})
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Hello world"
    assert data["metadata"] == {}


def test_read_obsidian_file_with_metadata(mock_app_secrets):
    """Test reading a file with YAML metadata."""
    response = client.get("/api/obsidian/file", params={"path": "with_yaml.md"})
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "---\ntitle: test\ntags: [a, b]\n---\nContent here."
    assert data["metadata"] == {"title": "test", "tags": ["a", "b"]}


def test_read_obsidian_file_bad_metadata(mock_app_secrets):
    """Test reading a file with invalid YAML metadata."""
    response = client.get("/api/obsidian/file", params={"path": "bad_yaml.md"})
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "---\n[invalid yaml\n---\nContent here."
    # With bad yaml, metadata should fallback to {} based on the codebase logic
    assert data["metadata"] == {}
