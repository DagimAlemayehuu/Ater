import pytest
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.deps import get_app_secrets, AppSecrets

@pytest.fixture
def test_vault(tmp_path):
    vault_dir = tmp_path / "vault"
    vault_dir.mkdir()
    return vault_dir

@pytest.fixture
def client(test_vault):
    def override_get_app_secrets():
        return AppSecrets(vault_path=str(test_vault))

    app.dependency_overrides[get_app_secrets] = override_get_app_secrets
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_app_secrets, None)

def test_write_obsidian_file_success(client, test_vault):
    response = client.post(
        "/api/obsidian/file",
        params={"path": "test.md"},
        json="hello world"
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    file_path = test_vault / "test.md"
    assert file_path.exists()
    assert file_path.read_text(encoding="utf-8") == "hello world"

def test_write_obsidian_file_nested(client, test_vault):
    response = client.post(
        "/api/obsidian/file",
        params={"path": "nested/dir/test.md"},
        json="nested content"
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    file_path = test_vault / "nested/dir/test.md"
    assert file_path.exists()
    assert file_path.read_text(encoding="utf-8") == "nested content"

def test_write_obsidian_file_missing_vault():
    def override_get_app_secrets():
        return AppSecrets(vault_path=None)

    app.dependency_overrides[get_app_secrets] = override_get_app_secrets
    try:
        with TestClient(app) as local_client:
            response = local_client.post(
                "/api/obsidian/file",
                params={"path": "test.md"},
                json="content"
            )
            assert response.status_code == 400
            assert response.json() == {"detail": "Vault Path missing"}
    finally:
        app.dependency_overrides.pop(get_app_secrets, None)

def test_write_obsidian_file_exception(client, test_vault):
    with patch("pathlib.Path.write_text", side_effect=PermissionError("Permission denied")):
        response = client.post(
            "/api/obsidian/file",
            params={"path": "test.md"},
            json="content"
        )
        assert response.status_code == 500
        assert "Permission denied" in response.json()["detail"]
