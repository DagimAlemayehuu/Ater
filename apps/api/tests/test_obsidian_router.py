import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import tempfile
from unittest.mock import patch

from src.domains.obsidian.router import router, DB_DIR_PREFIX
from fastapi import FastAPI
from src.api.deps import AppSecrets, get_app_secrets

app = FastAPI()
app.include_router(router)

client = TestClient(app)

@pytest.fixture
def test_vault():
    with tempfile.TemporaryDirectory() as td:
        yield td

def override_get_app_secrets(vault_path: str):
    def _override():
        return AppSecrets(vault_path=vault_path)
    return _override

def test_create_vault_database(test_vault):
    app.dependency_overrides[get_app_secrets] = override_get_app_secrets(test_vault)

    response = client.post(
        "/vault/databases",
        json={"name": "test_db", "area": "test_area"}
    )

    assert response.status_code == 200
    assert response.json() == {"success": True, "id": "test_db"}

    db_path = Path(test_vault) / DB_DIR_PREFIX / "test_db"
    assert db_path.exists()
    assert db_path.is_dir()

def test_create_vault_database_missing_vault_path():
    app.dependency_overrides[get_app_secrets] = lambda: AppSecrets(vault_path=None)

    response = client.post(
        "/vault/databases",
        json={"name": "test_db"}
    )

    assert response.status_code == 401
    assert "X-Vault-Path header missing" in response.json()["detail"]

def test_create_vault_database_exception(test_vault):
    app.dependency_overrides[get_app_secrets] = override_get_app_secrets(test_vault)

    # Simulate an exception by mocking mkdir
    with patch("pathlib.Path.mkdir", side_effect=PermissionError("Permission denied")):
        response = client.post(
            "/vault/databases",
            json={"name": "test_db"}
        )

    assert response.status_code == 500
