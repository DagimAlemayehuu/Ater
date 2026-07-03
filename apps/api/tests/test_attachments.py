import os
import tempfile
import pytest
from pathlib import Path
from src.domains.ater.chat_runtime import ChatStorage
from src.domains.ater.chat_runtime.attachments import AttachmentManager

@pytest.fixture
def temp_db_and_files():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_path = Path(path)
    
    # Create a temp text file
    txt_fd, txt_path = tempfile.mkstemp(suffix=".txt")
    with os.fdopen(txt_fd, "w") as f:
        f.write("Line 1 of test content.\n\nLine 2 of test content.")
        
    # Create a temp note file (simulating obsidian)
    note_fd, note_path = tempfile.mkstemp(suffix=".md")
    with os.fdopen(note_fd, "w") as f:
        f.write("# Obs Note\nHello world from obsidian.")
        
    yield db_path, Path(txt_path), Path(note_path)
    
    if db_path.exists():
        db_path.unlink()
    if os.path.exists(txt_path):
        os.unlink(txt_path)
    if os.path.exists(note_path):
        os.unlink(note_path)

def test_attachment_creation_and_extraction(temp_db_and_files):
    db_path, txt_path, note_path = temp_db_and_files
    storage = ChatStorage(db_path)
    # Pass approved roots:
    am = AttachmentManager(storage, vault_path=str(note_path.parent), inbox_path=str(txt_path.parent))
    
    conv_id = storage.create_conversation("Attachments")["id"]
    
    # 1. Attach text file
    att1 = am.attach_file(conv_id, str(txt_path), "text")
    assert att1["filename"] == txt_path.name
    assert "Line 1 of test content." in att1["extracted_text"]
    assert len(att1["chunk_metadata"]) == 2
    
    # 2. Attach obsidian note
    att2 = am.attach_file(conv_id, str(note_path), "note")
    assert att2["filename"] == note_path.name
    assert "# Obs Note" in att2["extracted_text"]
    
    # 3. Retrieve
    retrieved = am.storage.get_attachments(conv_id)
    assert len(retrieved) == 2
    assert retrieved[0]["filename"] == txt_path.name
    assert retrieved[1]["filename"] == note_path.name

def test_promotion_to_source_grounded(temp_db_and_files):
    db_path, txt_path, _ = temp_db_and_files
    storage = ChatStorage(db_path)
    am = AttachmentManager(storage, inbox_path=str(txt_path.parent))
    conv_id = storage.create_conversation("Promotion")["id"]
    
    att = am.attach_file(conv_id, str(txt_path), "text")
    
    promoted = am.promote_to_source_grounded_curriculum(att["id"])
    assert promoted["file_name"] == txt_path.name
    assert len(promoted["pages"]) == 1
    assert "Line 1 of test content." in promoted["pages"][0]["content"]

def test_attachment_safety_rejection(temp_db_and_files):
    db_path, txt_path, note_path = temp_db_and_files
    storage = ChatStorage(db_path)
    
    # Set approved roots to folders different from where the files reside
    am = AttachmentManager(storage, vault_path="/some/other/vault", inbox_path="/some/other/inbox")
    conv_id = storage.create_conversation("Rejection")["id"]
    
    # PDF/text outside roots should raise ValueError
    with pytest.raises(ValueError, match="Access Denied"):
        am.attach_file(conv_id, str(txt_path), "text")
        
    # Note outside roots should raise ValueError
    with pytest.raises(ValueError, match="Access Denied"):
        am.attach_file(conv_id, str(note_path), "note")

    # Content parameter bypasses filesystem check
    att = am.attach_file(conv_id, "/arbitrary/path/to/artifact.html", "artifact", content="<html>Active Artifact</html>")
    assert att["filename"] == "artifact.html"
    assert att["extracted_text"] == "<html>Active Artifact</html>"
