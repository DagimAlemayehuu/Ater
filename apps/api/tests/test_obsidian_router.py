import pytest
from fastapi.testclient import TestClient
from src.api.main import app
import os
import shutil
from pathlib import Path
import tempfile
import uuid

client = TestClient(app)

@pytest.fixture
def vault_path():
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

def test_create_property_option(vault_path):
    # Testing POST /api/vault/options
    headers = {"X-Vault-Path": vault_path, "X-AI-Provider": "google"}
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

    # Verify file was created
    expected_path = Path(vault_path) / source_folder / f"{option_name}.md"
    assert expected_path.exists()

    with open(expected_path, "r") as f:
        content = f.read()
    assert f"---\ntitle: {option_name}\n---" in content


def test_update_property_option(vault_path):
    # Pre-setup file
    headers = {"X-Vault-Path": vault_path, "X-AI-Provider": "google"}
    source_folder = "test_source"
    old_option_name = "old_option"
    new_option_name = "new_option"

    source_path = Path(vault_path) / source_folder
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

def test_update_property_option_not_found(vault_path):
    headers = {"X-Vault-Path": vault_path, "X-AI-Provider": "google"}
    response = client.patch(
        f"/api/vault/options?old_name=missing_option",
        json={"source": "test_source", "name": "new_option"},
        headers=headers
    )

    assert response.status_code == 404


def test_get_property_options(vault_path):
    # Setup test options
    source_folder = "test_source"
    source_path = Path(vault_path) / source_folder
    source_path.mkdir(parents=True, exist_ok=True)

    with open(source_path / "option1.md", "w") as f:
        f.write("---\ntitle: option1\n---")
    with open(source_path / "option2.md", "w") as f:
        f.write("---\ntitle: option2\n---")

    headers = {"X-Vault-Path": vault_path, "X-AI-Provider": "google"}
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

def test_delete_property_option(vault_path):
    # Setup file to delete
    source_folder = "test_source"
    option_name = "to_delete"
    source_path = Path(vault_path) / source_folder
    source_path.mkdir(parents=True, exist_ok=True)

    file_to_delete = source_path / f"{option_name}.md"
    with open(file_to_delete, "w") as f:
        f.write(f"---\ntitle: {option_name}\n---")

    assert file_to_delete.exists()

    headers = {"X-Vault-Path": vault_path, "X-AI-Provider": "google"}
    response = client.delete(
        f"/api/vault/options?source={source_folder}&name={option_name}",
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    assert not file_to_delete.exists()

def test_delete_property_option_not_found(vault_path):
    headers = {"X-Vault-Path": vault_path, "X-AI-Provider": "google"}
    response = client.delete(
        f"/api/vault/options?source=test_source&name=missing",
        headers=headers
    )

    assert response.status_code == 404
