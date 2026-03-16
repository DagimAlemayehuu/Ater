import os
import time
import asyncio
import datetime
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from loguru import logger
from typing import Dict, Any, Optional

from src.domains.vault.client import VaultManager
from src.domains.vault.ingestor import VaultIngestor
from src.domains.obsidian.client import ObsidianClient

class VaultWatchHandler(FileSystemEventHandler):
    """
    Handles filesystem events and triggers re-indexing for specific files.
    """
    def __init__(self, vault_manager: VaultManager, obsidian_client: ObsidianClient, ingestor: VaultIngestor, loop: asyncio.AbstractEventLoop):
        self.vault_manager = vault_manager
        self.obsidian_client = obsidian_client
        self.ingestor = ingestor
        self.loop = loop

    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith(".md"):
            return
        
        # Skip internal index directory
        if ".lifeos_index" in event.src_path:
            return

        logger.info(f"File modified: {event.src_path}")
        relative_path = str(Path(event.src_path).relative_to(self.vault_manager.vault_path))
        
        # Schedule the re-index in the event loop
        asyncio.run_coroutine_threadsafe(self._reindex_file(relative_path), self.loop)

    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith(".md"):
            return
        
        if ".lifeos_index" in event.src_path:
            return

        logger.info(f"File created: {event.src_path}")
        relative_path = str(Path(event.src_path).relative_to(self.vault_manager.vault_path))
        asyncio.run_coroutine_threadsafe(self._reindex_file(relative_path), self.loop)

    def on_deleted(self, event):
        if event.is_directory or not event.src_path.endswith(".md"):
            return
            
        if ".lifeos_index" in event.src_path:
            return

        logger.info(f"File deleted: {event.src_path}")
        relative_path = str(Path(event.src_path).relative_to(self.vault_manager.vault_path))
        self.vault_manager.delete_by_path(relative_path)

    async def _reindex_file(self, relative_path: str):
        """Re-chunks and upserts a single file."""
        try:
            content = self.obsidian_client.read_note(relative_path)
            if not content:
                return

            # Get modified time
            full_path = self.vault_manager.vault_path / relative_path
            modified = datetime.datetime.fromtimestamp(full_path.stat().st_mtime).isoformat()
            
            chunks = self.ingestor.chunk_text(content)
            chunk_data = [
                {
                    "path": relative_path,
                    "content": c,
                    "modified": modified
                } for c in chunks
            ]
            
            # First delete old chunks for this path to avoid duplicates if ID changes (though merge handles it)
            self.vault_manager.delete_by_path(relative_path)
            await self.vault_manager.upsert_chunks(chunk_data)
            logger.info(f"Re-indexed {relative_path} ({len(chunks)} chunks)")
        except Exception as e:
            logger.error(f"Failed to re-index {relative_path}: {e}")

class WatcherManager:
    """
    Manages active filesystem observers for different vaults.
    """
    _instances: Dict[str, Observer] = {}

    @classmethod
    def start_watching(cls, vault_path: str, gemini_key: str):
        if vault_path in cls._instances:
            return

        logger.info(f"Starting watcher for vault: {vault_path}")
        
        vault_manager = VaultManager(vault_path, gemini_key)
        obsidian_client = ObsidianClient(vault_path)
        ingestor = VaultIngestor(vault_manager, obsidian_client)
        
        # Get the main event loop
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()

        event_handler = VaultWatchHandler(vault_manager, obsidian_client, ingestor, loop)
        observer = Observer()
        observer.schedule(event_handler, vault_path, recursive=True)
        observer.start()
        
        cls._instances[vault_path] = observer

    @classmethod
    def stop_all(cls):
        for path, observer in cls._instances.items():
            logger.info(f"Stopping watcher for: {path}")
            observer.stop()
            observer.join()
        cls._instances.clear()
