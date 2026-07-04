import pytest
from pathlib import Path
from src.domains.ater.artifact_service import ArtifactService

def test_artifact_pack_path_traversal(tmp_path):
    vault_root = tmp_path / "vault"
    vault_root.mkdir()
    
    service = ArtifactService(vault_path=vault_root)
    
    with pytest.raises(ValueError, match="Path escapes vault"):
        service.get_artifact_pack_path(note_title="Test", note_path_rel="../../etc/passwd")
        
def test_artifact_pack_path_valid(tmp_path):
    vault_root = tmp_path / "vault"
    vault_root.mkdir()
    
    note_dir = vault_root / "notes"
    note_dir.mkdir()
    
    note_file = note_dir / "test.md"
    note_file.write_text("dummy")
    
    service = ArtifactService(vault_path=vault_root)
    
    # Valid relative path inside vault
    path = service.get_artifact_pack_path(note_title="Test Note", note_path_rel="notes/test.md")
    
    assert path.name == "Test_Note.artifacts.json"
    assert path.parent.name == "artifacts"
    assert path.parent.parent.name == "notes"
    
    # Path should be inside vault root
    path.relative_to(vault_root)
