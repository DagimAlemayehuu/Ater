import logging
import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from src.domains.rag.indexer import VaultIndexer
import time

logger = logging.getLogger(__name__)

class VaultSyncHandler(FileSystemEventHandler):
    """
    Listens for file changes in the Obsidian Vault and triggers the indexer.
    Includes basic debounce logic to prevent re-indexing on every single keystroke.
    """
    def __init__(self, indexer: VaultIndexer, loop: asyncio.AbstractEventLoop):
        self.indexer = indexer
        self.loop = loop
        self._last_processed = {}
        self.debounce_seconds = 2.0  # Wait 2 seconds after the last save before indexing

    def _should_process(self, file_path: str) -> bool:
        """Simple debounce to prevent spamming the indexer on rapid saves."""
        now = time.time()
        last_time = self._last_processed.get(file_path, 0)
        if now - last_time > self.debounce_seconds:
            self._last_processed[file_path] = now
            return True
        return False

    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        if self._should_process(event.src_path):
            logger.debug(f"[VaultWatcher] Modified detected: {event.src_path}")
            # We use call_soon_threadsafe because watchdog runs in a separate thread
            self.loop.call_soon_threadsafe(self.indexer.index_file, event.src_path)

    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        if self._should_process(event.src_path):
            logger.debug(f"[VaultWatcher] Created detected: {event.src_path}")
            self.loop.call_soon_threadsafe(self.indexer.index_file, event.src_path)

    def on_deleted(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        logger.debug(f"[VaultWatcher] Deleted detected: {event.src_path}")
        self.loop.call_soon_threadsafe(self.indexer.remove_file, event.src_path)
        if event.src_path in self._last_processed:
            del self._last_processed[event.src_path]


class RAGWatcherService:
    """
    Manages the watchdog observer for the RAG system.
    """
    def __init__(self, indexer: VaultIndexer, vault_path: str):
        self.indexer = indexer
        self.vault_path = Path(vault_path)
        self.observer = None

    def start(self, loop: asyncio.AbstractEventLoop):
        if not self.vault_path.exists():
            logger.error(f"Cannot start RAG Watcher. Vault path does not exist: {self.vault_path}")
            return

        event_handler = VaultSyncHandler(self.indexer, loop)
        self.observer = Observer()
        self.observer.schedule(event_handler, str(self.vault_path), recursive=True)
        self.observer.start()
        logger.info(f"🚀 Global RAG Watcher started for vault: {self.vault_path}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("🛑 Global RAG Watcher stopped.")

    def initial_sync(self, status_callback=None):
        """
        Crawls the entire vault and indexes everything.
        Usually called once on startup or manually.
        """
        if not self.vault_path.exists():
            if status_callback:
                status_callback({"status": "error", "message": "Vault path does not exist."})
            return
            
        logger.info("Starting initial Vault RAG Sync... This may take a moment.")
        if status_callback:
            status_callback({"status": "syncing", "progress": 0, "total": 0, "message": "Scanning for files..."})
            
        md_files = list(self.vault_path.rglob("*.md"))
        
        # Filter out hidden folders or specific folders we might want to ignore later
        files_to_index = [str(f) for f in md_files if not f.name.startswith('.') and ".obsidian" not in str(f)]
        total = len(files_to_index)
        
        if status_callback:
            status_callback({"status": "syncing", "progress": 0, "total": total, "message": f"Found {total} files. Starting indexing..."})
        
        for i, file_path in enumerate(files_to_index):
            if i % 50 == 0:
                logger.info(f"Indexing progress: {i}/{total} files...")
            
            if status_callback and i % 5 == 0:
                p = Path(file_path)
                status_callback({"status": "syncing", "progress": i, "total": total, "message": f"Indexing {p.name}..."})
                
            self.indexer.index_file(file_path)
            
        logger.info(f"✅ Initial Vault RAG Sync complete. Indexed {total} files.")
        if status_callback:
            status_callback({"status": "completed", "progress": total, "total": total, "message": "Vault RAG sync complete."})