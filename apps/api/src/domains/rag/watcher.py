import logging
import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from src.domains.rag.indexer import VaultIndexer
from src.domains.obsidian.events import vault_events
from src.domains.obsidian.sanitizer import PdfSanitizer
import time
from typing import Optional, Dict, Any, Callable

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

    def _publish_event(self, event_type: str, file_path: str):
        # We also notify the frontend of the change for the database view
        path_obj = Path(file_path)
        if "3-Database" in path_obj.parts:
            db_name = path_obj.parent.name
            file_name = path_obj.name
            self.loop.call_soon_threadsafe(
                vault_events.publish, event_type, {"db_name": db_name, "file_name": file_name}
            )

    def on_modified(self, event):
        if event.is_directory:
            return
            
        # PDF Sanitization Bridge
        if event.src_path.lower().endswith('.pdf') and "5-Pdf Store" in event.src_path:
            if self._should_process(event.src_path):
                logger.info(f"[Sanitizer] New or Modified PDF detected: {Path(event.src_path).name}")
                self.loop.run_in_executor(None, PdfSanitizer.normalize, Path(event.src_path))
            return

        # Markdown Indexing Logic
        if not event.src_path.endswith('.md'):
            return
            
        if self._should_process(event.src_path):
            logger.debug(f"[VaultWatcher] Modified detected: {event.src_path}")
            self.loop.call_soon_threadsafe(self.indexer.index_file, event.src_path)
            self._publish_event("modified", event.src_path)

    def on_created(self, event):
        if event.is_directory:
            return
            
        # PDF Sanitization Bridge
        if event.src_path.lower().endswith('.pdf') and "5-Pdf Store" in event.src_path:
            if self._should_process(event.src_path):
                logger.info(f"[Sanitizer] New PDF detected: {Path(event.src_path).name}")
                self.loop.run_in_executor(None, PdfSanitizer.normalize, Path(event.src_path))
            return

        # Markdown Indexing Logic
        if not event.src_path.endswith('.md'):
            return
            
        if self._should_process(event.src_path):
            logger.debug(f"[VaultWatcher] Created detected: {event.src_path}")
            self.loop.call_soon_threadsafe(self.indexer.index_file, event.src_path)
            self._publish_event("created", event.src_path)

    def on_deleted(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        logger.debug(f"[VaultWatcher] Deleted detected: {event.src_path}")
        self.loop.call_soon_threadsafe(self.indexer.remove_file, event.src_path)
        self._publish_event("deleted", event.src_path)
        if event.src_path in self._last_processed:
            del self._last_processed[event.src_path]


class RAGWatcherService:
    """
    Manages the watchdog observer and periodic consistency checks for the RAG system.
    """
    def __init__(self, indexer: VaultIndexer, vault_path: str):
        self.indexer = indexer
        self.vault_path = Path(vault_path)
        self.observer = None
        self.loop = None
        self._sync_task: Optional[asyncio.Task] = None
        self._is_running = False
        self._status_callback: Optional[Callable[[Dict[str, Any]], None]] = None

    def start(self, loop: asyncio.AbstractEventLoop, status_callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        if not self.vault_path.exists():
            logger.error(f"Cannot start RAG Watcher. Vault path does not exist: {self.vault_path}")
            return

        self.loop = loop
        self._is_running = True
        self._status_callback = status_callback

        # 1. Start Watchdog (Real-time)
        event_handler = VaultSyncHandler(self.indexer, loop)
        self.observer = Observer()
        self.observer.schedule(event_handler, str(self.vault_path), recursive=True)
        self.observer.start()
        logger.info(f"🚀 Global RAG Watcher started for vault: {self.vault_path}")

        # 2. Start Periodic Consistency Check (Every 60s)
        self._sync_task = self.loop.create_task(self._periodic_sync())

    def stop(self):
        self._is_running = False
        if self.observer:
            self.observer.stop()
            # No join() to avoid blocking the loop
            logger.info("🛑 Global RAG Watcher stopped.")
        if self._sync_task:
            self._sync_task.cancel()

    async def _periodic_sync(self):
        """Background task that runs a full sync check every 10 minutes."""
        # Initial sync on start (not forced)
        self.initial_sync(status_callback=self._status_callback, force=False)

        while self._is_running:
            try:
                # Wait 10 minutes (600s) between checks - real-time watcher handles the rest
                await asyncio.sleep(600)
                logger.info("[RAGWatcher] Running periodic consistency check...")
                # Run sync in a thread to not block the event loop
                await asyncio.to_thread(self.initial_sync, status_callback=self._status_callback, force=False)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[RAGWatcher] Periodic sync error: {e}")

    def initial_sync(self, status_callback: Optional[Callable[[Dict[str, Any]], None]] = None, force: bool = False):
        """
        Finds all markdown files and indexes them.
        """
        if not self.vault_path.exists():
            if status_callback:
                status_callback({"status": "error", "message": "Vault path does not exist."})
            return

        logger.info(f"Starting {'Force ' if force else 'Incremental '}Vault RAG Sync...")
        
        # --- PDF SANITIZER PHASE ---
        try:
            from src.domains.obsidian.sanitizer import start_auto_sanitizer
            start_auto_sanitizer(str(self.vault_path))
        except Exception as e:
            logger.error(f"[Sanitizer] Preliminary scan failed: {e}")
            
        try:
            # Fast direct globbing, filtering out common system directories
            files_to_index = [
                str(f) for f in self.vault_path.rglob("*.md")
                if not f.name.startswith('.') 
                and ".obsidian" not in f.parts
                and "node_modules" not in f.parts
                and ".git" not in f.parts
                and ".venv" not in f.parts
                and ".trash" not in f.parts
                and "Trash" not in f.parts
            ]

            total = len(files_to_index)
            
            # --- CLEANUP PHASE: Remove deleted files from memory AND vector DB ---
            current_files_set = set(files_to_index)
            deleted_count = 0
            
            try:
                # 1. Clean up JSON memory
                indexed_files = list(self.indexer.indexed_mtimes.keys())
                for indexed_file in indexed_files:
                    if indexed_file not in current_files_set:
                        logger.info(f"File deleted from vault, removing from memory: {indexed_file}")
                        self.indexer.remove_file(indexed_file)
                        deleted_count += 1
                
                # 2. Deep Clean: Interrogate Vector DB for orphaned chunks
                db_data = self.indexer.chroma.collection.get(include=["metadatas"])
                if db_data and db_data.get("metadatas"):
                    db_sources = set()
                    for meta in db_data["metadatas"]:
                        if meta and "source" in meta:
                            db_sources.add(meta["source"])
                            
                    for source in db_sources:
                        if source not in current_files_set:
                            logger.info(f"Purging orphaned file from Vector DB: {source}")
                            self.indexer.chroma.delete_file_chunks(source)
                            deleted_count += 1
                            
            except Exception as e:
                logger.error(f"Cleanup phase encountered an error: {e}")
                
            if deleted_count > 0:
                self.indexer.save_index()
            # -------------------------------------------------------

            if total == 0:
                logger.info("No markdown files found to sync.")
                if status_callback:
                    status_callback({"status": "synced", "progress": 0, "total": 0, "message": "No files found to sync."})
                return

            # Jump straight into the syncing status
            if status_callback:
                status_callback({"status": "syncing", "progress": 0, "total": total, "message": f"Starting sync of {total} files..."})

            for i, file_path in enumerate(files_to_index):
                # Batch mtime saves: only save to disk every 100 files to reduce I/O pressure
                is_batch_end = (i % 100 == 0) or (i == total - 1)
                self.indexer.index_file(file_path, force=force, should_save=is_batch_end)

                # Update UI dynamically
                if status_callback and (i % 5 == 0 or i == total - 1):
                    p = Path(file_path)
                    status_callback({"status": "syncing", "progress": i + 1, "total": total, "message": f"Indexing {p.name}..."})
                    
                # FORCE LIGHTWEIGHT: Yield CPU significantly to prevent Mac overheating/fans spinning
                time.sleep(0.05) 
            
            # Ensure final state is saved
            self.indexer.save_index()

            logger.info(f"✅ Vault RAG Sync complete. Processed {total} files.")
            if status_callback:
                status_callback({"status": "synced", "progress": total, "total": total, "message": "Vault is synced."})
                
        except Exception as e:
            logger.error(f"Vault RAG Sync failed: {e}")
            if status_callback:
                status_callback({"status": "error", "progress": 0, "total": 0, "message": f"Sync failed: {str(e)}"})