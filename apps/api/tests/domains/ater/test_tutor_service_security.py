import pytest
from pathlib import Path
from fastapi import HTTPException
from src.domains.ater.tutor_service import TutorSessionManager
from src.utils.vault_path import resolve_vault_path

def test_resolve_vault_path_relative(tmp_path):
    db_path = tmp_path / "tutor.db"
    vault_path = tmp_path / "vault"
    vault_path.mkdir()
    note_path = vault_path / "note.md"
    note_path.write_text("content")
    
    manager = TutorSessionManager(db_path=db_path, vault_path=vault_path)
    
    resolved = manager._resolve_vault_path("note.md")
    assert resolved == note_path

def test_resolve_vault_path_escape(tmp_path):
    db_path = tmp_path / "tutor.db"
    vault_path = tmp_path / "vault"
    vault_path.mkdir()
    
    manager = TutorSessionManager(db_path=db_path, vault_path=vault_path)
    
    with pytest.raises(HTTPException) as excinfo:
        manager._resolve_vault_path("../escape.md")
    assert excinfo.value.status_code == 400

def test_resolve_vault_path_absolute_escape(tmp_path):
    db_path = tmp_path / "tutor.db"
    vault_path = tmp_path / "vault"
    vault_path.mkdir()
    
    manager = TutorSessionManager(db_path=db_path, vault_path=vault_path)
    
    with pytest.raises(HTTPException) as excinfo:
        manager._resolve_vault_path("/etc/passwd")
    assert excinfo.value.status_code == 400

def test_start_tutor_session_valid_path(tmp_path):
    db_path = tmp_path / "tutor.db"
    vault_path = tmp_path / "vault"
    vault_path.mkdir()
    hub_path = vault_path / "hub.md"
    hub_path.write_text("[[chapter1]]")
    chapter1_path = vault_path / "chapter1.md"
    chapter1_path.write_text("[[note1]]")
    note1_path = vault_path / "note1.md"
    note1_path.write_text("content")
    
    manager = TutorSessionManager(db_path=db_path, vault_path=vault_path)
    
    # Starting a session needs a valid hub
    session = manager.start_session("sess1", "hub.md")
    assert session["hub_path"] == "hub.md"
    assert session["current_note_path"] == "note1.md"
