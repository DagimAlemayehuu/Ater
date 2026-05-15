import pytest
import sqlite3
import asyncio
from pathlib import Path
from src.domains.ater.watcher import AterQueueManager
from unittest.mock import MagicMock

class MockService:
    def __init__(self):
        self.secrets = MagicMock()
        self.secrets.vault_path = "/tmp/mock_vault"
    def register_status_callback(self, cb):
        pass
    def sync_secrets(self, secrets):
        pass

@pytest.fixture
def queue_manager(tmp_path):
    inbox = tmp_path / "Inbox"
    inbox.mkdir()
    db_file = tmp_path / "test_queue.db"
    si_path = str(tmp_path / "si.txt")
    
    service = MockService()
    manager = AterQueueManager(service, str(inbox), si_path)
    manager.db_path = str(db_file)
    manager._init_db()
    return manager, db_file

def test_watcher_queue_operations(queue_manager):
    """Test inserting, updating, and reading from the SQLite queue."""
    manager, db_file = queue_manager
    file_path = Path("/tmp/test_file.pdf")
    
    # 1. Add to queue
    manager.add_to_queue(file_path)
    
    # 2. Verify pending status
    status = manager.get_status()
    assert status["queue_size"] == 1
    
    # 3. Check raw DB
    conn = sqlite3.connect(str(db_file))
    row = conn.execute("SELECT status FROM queue WHERE file_path = ?", (str(file_path.absolute()),)).fetchone()
    assert row[0] == "pending"
    conn.close()

def test_watcher_mark_done(queue_manager):
    """Test marking a file as processed."""
    manager, db_file = queue_manager
    file_path = Path("/tmp/test_file.pdf")
    manager.add_to_queue(file_path)
    
    # Mark as done (this deletes from queue table in current implementation)
    manager._mark_done(str(file_path.absolute()))
    
    status = manager.get_status()
    assert status["queue_size"] == 0
