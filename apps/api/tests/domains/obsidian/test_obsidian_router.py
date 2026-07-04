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

    app.dependency_overrides.clear()

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

def test_vault_search_reports_pdf_type_for_generated_inbox_pdf(setup_vault):
    pdf_dir = setup_vault / "Inbox" / "generated" / "academic"
    pdf_dir.mkdir(parents=True)
    (pdf_dir / "Chapter 3 2024-1.pdf").write_bytes(b"%PDF-1.4\n")

    response = client.get("/api/vault/search", params={"page_name": "Chapter 3 2024-1.pdf"})

    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert data["type"] == "pdf"
    assert data["path"] == "Inbox/generated/academic/Chapter 3 2024-1.pdf"

def test_pdf_viewer_uses_vault_relative_serve_url_for_generated_pdf(setup_vault):
    pdf_dir = setup_vault / "Inbox" / "generated" / "academic"
    pdf_dir.mkdir(parents=True)
    (pdf_dir / "Chapter 3 2024-1.pdf").write_bytes(b"%PDF-1.4\n")

    response = client.get(
        "/api/obsidian/viewer/Inbox/generated/academic/Chapter%203%202024-1.pdf",
        params={"vault_path": str(setup_vault), "page": 2},
    )

    assert response.status_code == 200
    html = response.text
    assert "/api/obsidian/serve/Inbox/generated/academic/Chapter%203%202024-1.pdf" in html
    assert "/api/obsidian/serve/" + quote_like_path(str(setup_vault)) not in html


def test_pdf_serve_accepts_absolute_path_missing_leading_slash_when_inside_vault(setup_vault):
    pdf_dir = setup_vault / "Inbox" / "generated" / "academic"
    pdf_dir.mkdir(parents=True)
    pdf_path = pdf_dir / "Chapter 3 2024-1.pdf"
    pdf_path.write_bytes(b"%PDF-1.4\n")
    path_without_leading_slash = pdf_path.as_posix().lstrip("/")

    response = client.get(
        f"/api/obsidian/serve/{path_without_leading_slash}",
        params={"vault_path": str(setup_vault)},
    )

    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")


def quote_like_path(path: str) -> str:
    from urllib.parse import quote

    return quote(path.lstrip("/"))

def test_path_traversal_create_option(setup_vault):
    response = client.post(
        "/api/vault/options",
        json={"source": "../escaped_dir", "name": "test"}
    )
    assert response.status_code in (400, 404)

def test_safe_name_used_in_update_option(setup_vault):
    options_dir = setup_vault / "options_dir"
    options_dir.mkdir()
    (options_dir / "badname.md").write_text("---\ntitle: bad/name\n---")

    response = client.patch(
        "/api/vault/options",
        params={"old_name": "bad/name"},
        json={"source": "options_dir", "name": "../renamed"}
    )

    assert response.status_code == 200
    assert not (setup_vault / "renamed.md").exists()
    assert (options_dir / "renamed.md").exists()

def test_safe_name_used_in_delete_option(setup_vault):
    options_dir = setup_vault / "options_dir"
    options_dir.mkdir()
    (options_dir / "badname.md").write_text("---\ntitle: bad/name\n---")

    response = client.delete(
        "/api/vault/options",
        params={"source": "options_dir", "name": "bad/name"}
    )

    assert response.status_code == 200
    assert not (options_dir / "badname.md").exists()
    
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
