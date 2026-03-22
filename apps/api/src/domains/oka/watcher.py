#!/usr/bin/env python3
import time
import os
import asyncio
import logging
import traceback
from pathlib import Path
from typing import Optional, List, Dict, Any
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from .service import OkaService

file_handler = logging.log = logging.FileHandler("/tmp/oka_watcher.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
watcher_logger = logging.getLogger("OkaQueueManager")
watcher_logger.setLevel(logging.INFO)
watcher_logger.addHandler(file_handler)

class InboxHandler(FileSystemEventHandler):
    def __init__(self, manager: 'OkaQueueManager'):
        self.manager = manager
        self.logger = watcher_logger

    def on_created(self, event):
        self._handle_event(event)

    def on_moved(self, event):
        self._handle_event(event, is_move=True)

    def on_modified(self, event):
        self._handle_event(event)

    def _handle_event(self, event, is_move=False):
        if event.is_directory:
            return
        
        src_path = Path(event.dest_path) if is_move else Path(event.src_path)
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        
        if src_path.suffix.lower() in supported and not src_path.name.startswith('.'):
            # Check if it's not in the note generated folder
            generated_dir = self.manager.inbox_path / "note generated"
            if not str(src_path.absolute()).startswith(str(generated_dir.absolute())):
                self.logger.info(f"New file detected: {src_path.name}")
                self.manager.add_to_queue(src_path)

class OkaQueueManager:
    """
    Watches the Inbox, maintains a queue, and processes files autonomously if enabled.
    """
    def __init__(self, service: OkaService, inbox_path: str, system_instruction_path: str):
        self.service = service
        self.inbox_path = Path(inbox_path)
        self.si_path = system_instruction_path
        self.observer: Optional[Observer] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Queue State
        self.auto_process = False
        self.status = "idle" # 'idle', 'planning', 'deploying', 'error'
        self.current_file: Optional[str] = None
        self.current_batch = 0
        self.total_batches = 0
        self.pending_files: List[str] = []
        self.worker_task: Optional[asyncio.Task] = None
        
        self._lock = asyncio.Lock()

    def start(self, loop: asyncio.AbstractEventLoop, auto_process: bool = False):
        if not self.inbox_path.exists():
            self.inbox_path.mkdir(parents=True, exist_ok=True)
            
        generated_dir = self.inbox_path / "note generated"
        generated_dir.mkdir(exist_ok=True)
            
        self.loop = loop
        self.auto_process = auto_process
        
        event_handler = InboxHandler(self)
        self.observer = Observer()
        self.observer.schedule(event_handler, str(self.inbox_path), recursive=False)
        self.observer.start()
        
        print(f"[OKA Queue] Monitoring: {self.inbox_path} | Auto Process: {self.auto_process}")
        
        self.scan_existing_files()
        
        if self.worker_task is None or self.worker_task.done():
            self.worker_task = self.loop.create_task(self._worker_loop())

    def update_settings(self, auto_process: bool):
        self.auto_process = auto_process
        print(f"[OKA Queue] Auto process updated to: {self.auto_process}")

    def scan_existing_files(self):
        """Scans the inbox for existing files and adds them to the queue if not already there."""
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        generated_dir = self.inbox_path / "note generated"
        
        try:
            for item in self.inbox_path.iterdir():
                if item.is_file() and not item.name.startswith('.') and item.suffix.lower() in supported:
                    if str(item.absolute()) not in self.pending_files and self.current_file != str(item.absolute()):
                        self.pending_files.append(str(item.absolute()))
        except Exception as e:
            print(f"[OKA Queue] Error scanning files: {e}")

    def add_to_queue(self, path: Path):
        path_str = str(path.absolute())
        if path_str not in self.pending_files and self.current_file != path_str:
            self.pending_files.append(path_str)

    async def _worker_loop(self):
        """Continuous background loop for autonomous processing."""
        while True:
            await asyncio.sleep(2)
            
            if not self.auto_process:
                continue
                
            if self.status != "idle" or len(self.pending_files) == 0:
                continue
                
            async with self._lock:
                if len(self.pending_files) == 0:
                    continue
                file_to_process = self.pending_files.pop(0)
                self.current_file = file_to_process
                self.status = "planning"
                self.current_batch = 0
                self.total_batches = 0
                
            try:
                path = Path(file_to_process)
                watcher_logger.info(f"Starting autonomous planning for: {path.name}")
                
                # 1. Planning
                res = await self.service.process_file(str(path.absolute()), self.si_path)
                session_id = res["session_id"]
                structured_plan = res["plan_structured"]
                self.total_batches = len(structured_plan.get("batches", [])) or 1
                self.status = "deploying"
                
                watcher_logger.info(f"Plan generated for {path.name}. Total batches: {self.total_batches}")
                
                # 2. Deployment Loop - AUTONOMOUS (Confirming automatically)
                has_more = True
                temp_batch = 0
                hub_path = None
                
                while has_more and self.auto_process:
                    # In autonomous mode, we send the exact protocol commands required by the SI
                    command = "Confirm Final Plan & Proceed Batch 1" if temp_batch == 0 else f"Proceed Batch {temp_batch + 1}"
                    
                    watcher_logger.info(f"Auto-confirming {command} for {path.name}")
                    self.current_batch = temp_batch + 1
                    confirm_res = await self.service.confirm_plan(session_id, command=command)
                    
                    # Capture hub note from results
                    for res_note in confirm_res.get("results", []):
                        if "_Hub" in res_note.get("title", ""):
                            hub_path = res_note.get("path")
                        elif hub_path is None: # Fallback to first note
                            hub_path = res_note.get("path")
                            
                    temp_batch = confirm_res["current_batch"]
                    has_more = confirm_res["has_more"]
                    
                    if has_more:
                        # Rate limit guard (shorter for auto)
                        await asyncio.sleep(5) 
                
                # 3. Move to note generated
                generated_dir = self.inbox_path / "note generated"
                generated_dir.mkdir(exist_ok=True)
                new_path = generated_dir / path.name
                if new_path.exists():
                    new_path = generated_dir / f"{int(time.time())}_{path.name}"
                path.rename(new_path)
                
                # Save metadata
                if hub_path:
                    import json
                    meta_path = new_path.with_suffix(".oka.json")
                    with open(meta_path, "w") as f:
                        json.dump({"hub_path": hub_path, "processed_at": time.time()}, f)
                
                watcher_logger.info(f"Completed and moved to note generated: {path.name}")
                
                # Cool down between files
                await asyncio.sleep(10)
                
            except Exception as e:
                watcher_logger.error(f"Error processing {self.current_file}: {traceback.format_exc()}")
                print(f"[OKA Queue] Error: {e}")
            finally:
                async with self._lock:
                    self.status = "idle"
                    self.current_file = None
                    self.current_batch = 0
                    self.total_batches = 0

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "auto_process": self.auto_process,
            "current_file": Path(self.current_file).name if self.current_file else None,
            "current_batch": self.current_batch,
            "total_batches": self.total_batches,
            "pending_count": len(self.pending_files),
            "pending_files": [Path(p).name for p in self.pending_files]
        }

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
        if self.worker_task:
            self.worker_task.cancel()
        print("[OKA Queue] Stopped.")
