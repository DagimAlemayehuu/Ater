#!/usr/bin/env python3
import time
import os
import asyncio
import logging
from pathlib import Path
from typing import Optional, Set
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from .service import OkaService

# Create a file logger for debugging
file_handler = logging.FileHandler("/tmp/oka_watcher.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
watcher_logger = logging.getLogger("OkaWatcher")
watcher_logger.setLevel(logging.INFO)
watcher_logger.addHandler(file_handler)

class InboxHandler(FileSystemEventHandler):
    """
    Handles file creation events in the Inbox folder.
    """
    def __init__(self, service: OkaService, system_instruction_path: str, loop: asyncio.AbstractEventLoop):
        self.service = service
        self.si_path = system_instruction_path
        self.loop = loop
        self.loop = loop
        self.logger = watcher_logger

    def on_created(self, event):
        self._handle_event(event)

    def on_moved(self, event):
        self._handle_event(event, is_move=True)

    def _handle_event(self, event, is_move=False):
        if event.is_directory:
            return
        
        src_path = Path(event.dest_path) if is_move else Path(event.src_path)
        
        # Supported extensions
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        
        if src_path.suffix.lower() in supported:
            self.logger.info(f"File detected in Inbox: {src_path.name} (Move: {is_move})")
            
            # Use the existing asyncio loop to process the file
            asyncio.run_coroutine_threadsafe(
                self.process_with_retry(src_path), self.loop
            )

    async def process_with_retry(self, path: Path):
        """Initializes planning for a file and waits for manual confirmation."""
        try:
            # Wait a moment to ensure file is fully written
            await asyncio.sleep(2)
            
            self.logger.info(f"Starting autonomous OKA planning for: {path.name}")
            # This triggers the initial chat session and plan generation
            # The session will be stored in OkaService._sessions for later confirmation
            results = await self.service.process_file(str(path.absolute()), self.si_path)
            
            self.logger.info(f"Plan generated for {path.name}. Awaiting manual confirmation.")
            print(f"[OKA Watcher] Plan ready for {path.name} (Session: {results['session_id']})")
            
        except Exception as e:
            self.logger.error(f"Failed to process {path.name}: {str(e)}")

class OkaWatcher:
    """
    The background service that monitors the Inbox folder.
    """
    def __init__(self, service: OkaService, inbox_path: str, system_instruction_path: str):
        self.service = service
        self.inbox_path = Path(inbox_path)
        self.si_path = system_instruction_path
        self.observer: Optional[Observer] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    def start(self, loop: asyncio.AbstractEventLoop):
        if not self.inbox_path.exists():
            self.inbox_path.mkdir(parents=True, exist_ok=True)
            
        self.loop = loop
        event_handler = InboxHandler(self.service, self.si_path, loop)
        self.observer = Observer()
        self.observer.schedule(event_handler, str(self.inbox_path), recursive=False)
        self.observer.start()
        
        print(f"[OKA Watcher] Monitoring Inbox: {self.inbox_path}")
        
        # Process existing files
        asyncio.run_coroutine_threadsafe(self.process_existing_files(), loop)

    async def process_existing_files(self):
        """Scans the inbox and processes any files already there."""
        if not self.loop:
            return
            
        loop = self.loop
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        
        try:
            # Create a single handler for efficiency
            handler = InboxHandler(self.service, self.si_path, loop)
            for item in self.inbox_path.iterdir():
                if item.is_file() and not item.name.startswith('.') and item.suffix.lower() in supported:
                    print(f"[OKA Watcher] Processing existing file: {item.name}")
                    # We are in the loop, so use create_task
                    asyncio.create_task(handler.process_with_retry(item))
        except Exception as e:
            print(f"[OKA Watcher] Error processing existing files: {e}")
            watcher_logger.error(f"Error processing existing files: {e}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
            print("[OKA Watcher] Stopped.")
