import pytest
from unittest.mock import MagicMock
from pathlib import Path
from src.domains.ater.chat_runtime.attachments import AttachmentManager
import tempfile
import os

@pytest.fixture
def manager():
    storage = MagicMock()
    vault_path = tempfile.mkdtemp()
    inbox_path = tempfile.mkdtemp()
    return AttachmentManager(storage, vault_path=vault_path, inbox_path=inbox_path)

def test_attach_file_outside_vault_raises_error(manager):
    with tempfile.NamedTemporaryFile(delete=False) as f:
        outside_path = f.name
    
    with pytest.raises((ValueError, Exception)):
        manager.attach_file("conv1", outside_path, "markdown")
    os.unlink(outside_path)

def test_attach_file_with_content_outside_vault_raises_error(manager):
    with tempfile.NamedTemporaryFile(delete=False) as f:
        outside_path = f.name

    with pytest.raises((ValueError, Exception)):
        manager.attach_file("conv1", outside_path, "markdown", content="fake content")
    os.unlink(outside_path)

def test_promote_outside_vault_raises_error(manager):
    with tempfile.NamedTemporaryFile(delete=False) as f:
        outside_path = f.name
        
    manager.storage._get_connection.return_value.execute.return_value.fetchone.return_value = {
        "id": "att1",
        "file_path": outside_path,
        "file_type": "markdown",
        "filename": "test.md",
        "conversation_id": "conv1"
    }

    with pytest.raises((ValueError, Exception)):
        manager.promote_to_source_grounded_curriculum("att1")
    os.unlink(outside_path)

def test_normal_attachment_works(manager):
    # Setup inside inbox
    inside_path = Path(manager.inbox_path) / "test.md"
    inside_path.write_text("hello")
    
    manager.attach_file("conv1", str(inside_path), "markdown")
    manager.storage.create_attachment.assert_called_once()
