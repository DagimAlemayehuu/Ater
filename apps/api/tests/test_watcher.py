import pytest
import sqlite3
import asyncio
from pathlib import Path
from unittest.mock import MagicMock, patch
from src.domains.ater.watcher import AterQueueManager, InboxHandler

class MockSecrets:
    def __init__(self):
        self.vault_path = "/tmp/mock_vault"
        self.auto_deploy = False
        self.ai_key = "mock_key"

class MockService:
    def __init__(self):
        self.secrets = MockSecrets()
        self._status_cb = None
        self.vm = MagicMock()
        self.vm.get_canonical_title = lambda x: str(x).replace(" ", "_")

    def register_status_callback(self, cb):
        self._status_cb = cb

    def sync_secrets(self, secrets):
        self.secrets = secrets

    async def detect_curriculum(self, file_path):
        return {"detected_curriculum": {"semester": "Spring", "course": "CS 101"}}

    async def generate_plan(self, file_path, si_path, curriculum=None):
        return {
            "session_id": "session_123",
            "plan_structured": {
                "batches": [{"notes": ["Note_1", "Note_2"]}]
            }
        }

    async def _get_or_restore_session(self, session_id):
        return {
            "metadata": {
                "batches": [{"notes": ["Note_1", "Note_2"]}]
            }
        }

    async def confirm_plan(self, session_id, command=None, curriculum_override=None):
        return {
            "status": "success",
            "current_batch": 1,
            "has_more": False,
            "results": [{"title": "Note_1"}, {"title": "Note_2"}]
        }

class MockEvent:
    def __init__(self, src_path, dest_path=None, is_directory=False):
        self.src_path = src_path
        self.dest_path = dest_path
        self.is_directory = is_directory

@pytest.fixture
def queue_manager(tmp_path):
    inbox = tmp_path / "Inbox"
    inbox.mkdir(parents=True, exist_ok=True)
    db_file = tmp_path / "test_queue.db"
    si_path = str(tmp_path / "si.txt")
    
    service = MockService()
    service.secrets.vault_path = str(tmp_path)
    
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
    
    # Mark as done
    manager._mark_done(str(file_path.absolute()))
    
    status = manager.get_status()
    assert status["queue_size"] == 0

def test_inbox_handler_exclusion_posix(queue_manager, tmp_path):
    """Verify that files in POSIX generated directory are ignored, while others are ingested."""
    manager, db_file = queue_manager
    handler = InboxHandler(manager)
    
    # Setup directories
    generated_dir = tmp_path / "Inbox" / "Generated"
    generated_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Path to ignore (inside Generated)
    ignored_file = generated_dir / "Note.md"
    ignored_file.touch()
    
    # 2. Path to ingest (inside Inbox, but outside Generated)
    ingested_file = tmp_path / "Inbox" / "Topic.pdf"
    ingested_file.touch()
    
    # Trigger ignored event
    handler.on_created(MockEvent(src_path=str(ignored_file)))
    status = manager.get_status()
    assert status["queue_size"] == 0
    
    # Trigger ingested event
    handler.on_created(MockEvent(src_path=str(ingested_file)))
    status = manager.get_status()
    assert status["queue_size"] == 1

def test_inbox_handler_exclusion_windows_fallback(queue_manager):
    """Verify that simulated Windows paths are excluded/ingested correctly via string fallback."""
    manager, db_file = queue_manager
    handler = InboxHandler(manager)
    
    # Configure Windows-style paths
    manager.service.secrets.vault_path = "C:\\Vault"
    windows_ignored_path = "C:\\Vault\\Inbox\\Generated\\Note.md"
    windows_ingested_path = "C:\\Vault\\Inbox\\Topic.pdf"
    
    # Force is_relative_to to raise AttributeError to trigger fallback block
    with patch.object(Path, "is_relative_to", side_effect=AttributeError("Simulated older Python environment")):
        # Trigger ignored event
        handler.on_created(MockEvent(src_path=windows_ignored_path))
        status = manager.get_status()
        assert status["queue_size"] == 0
        
        # Trigger ingested event
        handler.on_created(MockEvent(src_path=windows_ingested_path))
        status = manager.get_status()
        assert status["queue_size"] == 1

def test_sqlite_cleanup_on_error(queue_manager):
    """Verify that SQLite database connections are closed properly even when an operational error is raised."""
    manager, db_file = queue_manager
    
    mock_conn = MagicMock()
    mock_conn.execute.side_effect = sqlite3.OperationalError("Simulated database write deadlock")
    
    with patch.object(manager, "_get_conn", return_value=mock_conn):
        with pytest.raises(sqlite3.OperationalError):
            manager.add_to_queue(Path("/tmp/some_file.pdf"))
        
        # Verify close was guaranteed via finally block
        mock_conn.close.assert_called_once()

@pytest.mark.asyncio
async def test_worker_loop_execution(queue_manager):
    """Test that worker loop monitors SQLite queue and spawns parallel tasks when auto_process is enabled."""
    manager, db_file = queue_manager
    manager.auto_process = True
    
    # Mock process_file to prevent heavy generation
    async def mock_process_file(file_path_str):
        pass
    manager.process_file = mock_process_file
    
    # Add pending file
    file_path = Path("/tmp/pending_file.pdf")
    manager.add_to_queue(file_path)
    
    # Mock sleep to yield event loop execution immediately
    original_sleep = asyncio.sleep
    with patch("asyncio.sleep", new_callable=MagicMock) as mock_sleep:
        async def quick_sleep(delay):
            await original_sleep(0.001)
        mock_sleep.side_effect = quick_sleep
        
        loop = asyncio.get_running_loop()
        worker_task = loop.create_task(manager._worker_loop())
        
        # Allow short execution window
        await original_sleep(0.05)
        
        # Verify task was successfully created in the queue manager active list
        assert str(file_path.absolute()) in manager.active_tasks
        
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass

@pytest.mark.asyncio
async def test_worker_semaphore_concurrency(queue_manager):
    """Verify that worker respects worker_semaphore limits to restrict parallel executions."""
    manager, db_file = queue_manager
    
    # Set semaphore to 1 for easy testing of concurrency bottleneck
    manager.worker_semaphore = asyncio.Semaphore(1)
    
    # Block the semaphore completely
    await manager.worker_semaphore.acquire()
    
    # Try spawning process_file in background
    task = asyncio.create_task(manager.process_file("/tmp/file.pdf"))
    await asyncio.sleep(0.05)
    
    # Database status should NOT be 'deploying' because task is blocked waiting for semaphore
    conn = sqlite3.connect(str(db_file))
    row = conn.execute("SELECT status FROM queue WHERE file_path = ?", ("/tmp/file.pdf",)).fetchone()
    assert row is None or row[0] != "deploying"
    conn.close()
    
    # Release the semaphore to allow task progress
    manager.worker_semaphore.release()
    try:
        await task
    except Exception:
        pass
