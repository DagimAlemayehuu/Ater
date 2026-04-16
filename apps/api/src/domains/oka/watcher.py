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

file_handler = logging.FileHandler("/tmp/oka_watcher.log")
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
        self.last_action: str = "Ready"
        self.processed_notes: List[Dict[str, str]] = [] # [{"title": "Note", "path": "path"}]
        self.planned_batches: List[Dict[str, Any]] = [] # [{"id": 1, "notes": ["Title"]}]
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
        self.observer.schedule(event_handler, str(self.inbox_path), recursive=True)
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
                
                # Clear state for new file
                self.current_batch = 0
                self.total_batches = 0
                self.planned_batches = []
                self.processed_notes = []
                self.last_action = "Inbound Detection..."
                self.status = "detecting"
                
            try:
                path = Path(file_to_process)
                watcher_logger.info(f"Starting autonomous planning for: {path.name}")
                
                # 1. Detection Phase (With AI-assisted fallback)
                self.status = "detecting"
                self.last_action = "Analyzing Document Context..."
                detect_res = await self.service.detect_curriculum(str(path.absolute()))

                # Auto-resolve curriculum from anchored hub or AI detection
                anchored_hub = detect_res.get("anchored_hub")
                detected = detect_res.get("detected_curriculum") or {}
                
                curriculum = {
                    "course": (anchored_hub.get("course") if anchored_hub else detected.get("course")) or "",
                    "unit": (anchored_hub.get("unit") if anchored_hub else detected.get("unit")) or "",
                    "semester": (anchored_hub.get("semester") if anchored_hub else detected.get("semester")) or "",
                    "hub_title": (anchored_hub.get("title") if anchored_hub else detected.get("hub_title") or path.stem) or path.stem
                }

                # FOLDER FALLBACK: If Course still blank, check if file is in a Course-named directory
                if not curriculum["course"]:
                    parts = path.parts
                    for i, p in enumerate(parts):
                        if p == "2-Academic" and i + 1 < len(parts):
                            potential_course = parts[i+1]
                            if potential_course != path.name and potential_course != "PDF Inbox":
                                curriculum["course"] = potential_course
                                watcher_logger.info(f"Course Fallback: Inferred '{potential_course}' from path.")
                                break

                # Robust cleaning of "Unknown" placeholders from AI or templates
                for key in ["course", "unit", "semester"]:
                    if "unknown" in str(curriculum[key]).lower():
                        curriculum[key] = ""

                # 2. Planning Phase (AI)
                self.status = "planning"
                self.last_action = "Architecting Knowledge Plan..."
                res = await self.service.generate_plan(
                    str(path.absolute()), 
                    self.si_path,
                    curriculum=curriculum,
                    target_hub_id=anchored_hub.get("id") if anchored_hub else None
                )

                session_id = res["session_id"]
                structured_plan = res["plan_structured"]
                self.planned_batches = structured_plan.get("batches", [])
                
                # CRITICAL: Re-calculate total batches from structured plan to ensure UI parity
                self.total_batches = len(self.planned_batches)
                self.status = "deploying"
                self.last_action = f"Architecting {self.total_batches} Batches"

                watcher_logger.info(f"Plan generated for {path.name}. Total batches: {self.total_batches}")

                # 3. Deployment Loop - AUTONOMOUS (Mirroring Manual Mode)
                has_more = True
                temp_batch = 0
                
                while has_more and self.auto_process:
                    if temp_batch == 0:
                        command = "Confirm Final Plan & Proceed Batch 1"
                    else:
                        command = f"Proceed Batch {temp_batch + 1}"
                        
                    watcher_logger.info(f"Auto-confirming {command} for {path.name}")
                    
                    # Batch retry logic for stability
                    batch_retry = 0
                    success = False
                    while batch_retry < 10 and not success:
                        try:
                            confirm_res = await self.service.confirm_plan(
                                session_id, 
                                command=command,
                                curriculum_override=curriculum if temp_batch == 0 else None,
                                anchored_hub_id=anchored_hub.get("id") if (anchored_hub and temp_batch == 0) else None
                            )
                            
                            if confirm_res.get("status") == "success":
                                temp_batch = confirm_res.get("current_batch", temp_batch + 1)
                                self.current_batch = temp_batch
                                has_more = confirm_res.get("has_more", False)
                                
                                new_notes = confirm_res.get("results", [])
                                self.processed_notes.extend(new_notes)
                                
                                if new_notes:
                                    self.last_action = f"Deployed {temp_batch}/{self.total_batches}: {new_notes[-1]['title']}"
                                else:
                                    self.last_action = f"Batch {temp_batch}/{self.total_batches} complete"
                                    
                                success = True
                                
                                # Inter-batch rate limit delay: EXACT 10s wait
                                if has_more:
                                    watcher_logger.info(f"Batch {temp_batch} complete. Pausing 10s...")
                                    self.status = "cooling"
                                    old_action = self.last_action
                                    for i in range(10, 0, -1):
                                        self.last_action = f"{old_action} (Next batch in {i}s)"
                                        await asyncio.sleep(1)
                                    self.status = "deploying"
                                    self.last_action = old_action
                            else:
                                raise ValueError(confirm_res.get("error", "Unknown service error"))
                        except Exception as e:
                            batch_retry += 1
                            err_str = str(e).lower()
                            
                            # Detect TPD (Daily) vs TPM (Minute)
                            is_daily = "tpd" in err_str or "daily" in err_str or "day" in err_str
                            is_limit = "429" in err_str or "rate" in err_str
                            
                            if is_daily:
                                watcher_logger.error(f"CRITICAL: Daily Token Limit (TPD) Reached. Pausing Pipeline.")
                                self.status = "error"
                                self.last_action = "Daily Limit Reached. Resuming tomorrow."
                                self.auto_process = False # Stop the engine
                                break
                            
                            watcher_logger.error(f"Batch {temp_batch + 1} retry {batch_retry}/10: {e}")
                            self.last_action = f"Retry {batch_retry} (Rate Limit...)"
                            await asyncio.sleep(20 * batch_retry) # Incremental backoff
                    
                    if not self.auto_process or not success:
                        break
                
                # 3. Final Move (Safety check for race with service)
                if path.exists():
                    generated_dir = self.inbox_path / "note generated"
                    generated_dir.mkdir(parents=True, exist_ok=True)
                    new_path = generated_dir / path.name
                    if new_path.exists():
                        new_path = generated_dir / f"{int(time.time())}_{path.name}"
                    path.rename(new_path)
                    watcher_logger.info(f"Auto-Move complete: {new_path.name}")
                
                # Save metadata for UI reference
                try:
                    meta_path = new_path.with_suffix(".oka.json")
                    with open(meta_path, "w") as f:
                        json.dump({
                            "hub_path": hub_path, 
                            "processed_at": time.time(),
                            "batches": temp_batch
                        }, f)
                except: pass
                
                watcher_logger.info(f"Completed and moved to note generated: {path.name}")
                
                # Cool down between files to avoid model over-pressure
                self.last_action = "Cooling down (10s)..."
                await asyncio.sleep(10)
                
            except Exception as e:
                watcher_logger.error(f"Error processing {self.current_file}: {traceback.format_exc()}")
                print(f"[OKA Queue] Error: {e}")
            finally:
                async with self._lock:
                    self.status = "idle"
                    # We keep batches and processed_notes readable for a few seconds so the user sees the final state
                    self.last_action = f"Complete: {Path(self.current_file).name}"
                    await asyncio.sleep(10)
                    
                    self.current_batch = 0
                    self.total_batches = 0
                    self.planned_batches = []
                    self.processed_notes = []
                    self.current_file = None
                    self.last_action = "Ready" if not self.pending_files else "Next file in queue..."

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "auto_process": self.auto_process,
            "current_file": Path(self.current_file).name if self.current_file else None,
            "current_batch": self.current_batch,
            "total_batches": self.total_batches,
            "planned_batches": self.planned_batches,
            "plan_raw": getattr(self, "current_plan_raw", None),
            "last_action": self.last_action,
            "processed_notes": self.processed_notes,
            "pending_count": len(self.pending_files),
            "pending_files": [Path(p).name for p in self.pending_files]
        }

    def stop(self):
        if self.observer:
            self.observer.stop()
            # No join() here to avoid blocking the event loop during shutdown/reload
        if self.worker_task:
            self.worker_task.cancel()
        print("[OKA Queue] Stopped.")
