import sqlite3
import shutil
import time
import asyncio
import logging
import traceback
from pathlib import Path
from datetime import datetime
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
        
        # Absolute check to prevent re-processing generated files
        generated_dir = self.manager.inbox_path.absolute() / "note generated"
        if str(src_path.absolute()).startswith(str(generated_dir)):
            return

        if src_path.suffix.lower() in supported and not src_path.name.startswith('.'):
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
        self.status = "idle" # 'idle', 'planning', 'deploying', 'cooling', 'error'
        self.current_file: Optional[str] = None
        self.current_batch = 0
        self.total_batches = 0
        self.last_action: str = "Ready"
        self.processed_notes: List[Dict[str, str]] = [] 
        self.planned_batches: List[Dict[str, Any]] = [] 
        self.worker_task: Optional[asyncio.Task] = None
        
        # v13.6 Persistence & Rate Limiting
        self.db_path = str(self.inbox_path.absolute() / "oka_queue.db")
        self.governor_cooldown = 30.0
        self._init_db()
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
        """Scans the inbox for existing files and adds them to the database queue."""
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        try:
            for item in self.inbox_path.iterdir():
                if item.is_file() and not item.name.startswith('.') and item.suffix.lower() in supported:
                    self.add_to_queue(item)
        except Exception as e:
            print(f"[OKA Queue] Error scanning files: {e}")

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("CREATE TABLE IF NOT EXISTS queue (file_path TEXT PRIMARY KEY, status TEXT, added_at TEXT)")
        conn.commit()
        conn.close()

    def add_to_queue(self, file_path: Path):
        path_str = str(file_path.absolute())
        # Don't queue files that are already in the "note generated" folder
        if "note generated" in path_str:
            return
            
        conn = sqlite3.connect(self.db_path)
        conn.execute("INSERT OR IGNORE INTO queue (file_path, status, added_at) VALUES (?, ?, ?)", 
                     (path_str, "pending", datetime.now().isoformat()))
        conn.commit()
        conn.close()

    def _get_next_task(self):
        conn = sqlite3.connect(self.db_path)
        row = conn.execute("SELECT file_path FROM queue WHERE status = 'pending' ORDER BY added_at ASC LIMIT 1").fetchone()
        conn.close()
        return row[0] if row else None

    def _mark_done(self, file_path: str):
        conn = sqlite3.connect(self.db_path)
        conn.execute("DELETE FROM queue WHERE file_path = ?", (file_path,))
        conn.commit()
        conn.close()

    def _mark_error(self, file_path: str):
        conn = sqlite3.connect(self.db_path)
        conn.execute("UPDATE queue SET status = 'error' WHERE file_path = ?", (file_path,))
        conn.commit()
        conn.close()

    async def _worker_loop(self):
        """Continuous background loop for autonomous processing."""
        while True:
            try:
                if not self.auto_process:
                    await asyncio.sleep(5)
                    continue

                file_path_str = self._get_next_task()
                if not file_path_str:
                    await asyncio.sleep(5)
                    continue

                path = Path(file_path_str)
                # Check if file still exists
                if not path.exists():
                    self._mark_done(file_path_str)
                    continue

                self.current_file = file_path_str
                
                # Clear state for new file
                self.current_batch = 0
                self.total_batches = 0
                self.planned_batches = []
                self.processed_notes = []
                self.last_action = "Inbound Detection..."
                self.status = "detecting"
                
                watcher_logger.info(f"Starting autonomous planning for: {path.name}")
                
                # 1. Detection Phase
                try:
                    detect_res = await self.service.detect_curriculum(str(path.absolute()))
                except Exception as e:
                    watcher_logger.error(f"Detection failed for {path.name}: {e}")
                    self._mark_error(file_path_str)
                    continue

                anchored_hub = detect_res.get("anchored_hub")
                detected = detect_res.get("detected_curriculum") or {}
                
                curriculum = {
                    "course": (anchored_hub.get("course") if anchored_hub else detected.get("course")) or "",
                    "unit": (anchored_hub.get("unit") if anchored_hub else detected.get("unit")) or "",
                    "semester": (anchored_hub.get("semester") if anchored_hub else detected.get("semester")) or "",
                    "hub_title": (anchored_hub.get("title") if anchored_hub else detected.get("hub_title") or path.stem) or path.stem,
                    "primary_language": detected.get("primary_language", "General")
                }

                if not curriculum["course"]:
                    parts = path.parts
                    for i, p in enumerate(parts):
                        if p == "2-Academic" and i + 1 < len(parts):
                            potential_course = parts[i+1]
                            if potential_course != path.name and potential_course != "PDF Inbox":
                                curriculum["course"] = potential_course
                                break

                # 2. Planning Phase
                self.status = "planning"
                self.last_action = "Architecting Knowledge Plan..."
                
                plan_retry = 0
                res = None
                while plan_retry < 3:
                    try:
                        res = await self.service.generate_plan(
                            str(path.absolute()), 
                            self.si_path,
                            curriculum=curriculum,
                            target_hub_id=anchored_hub.get("id") if anchored_hub else None
                        )
                        if res: break
                    except Exception as e:
                        plan_retry += 1
                        watcher_logger.warning(f"Planning failed (Attempt {plan_retry}/3): {e}")
                        if plan_retry >= 3: raise e
                        await asyncio.sleep(5)

                if not res:
                    self._mark_error(file_path_str)
                    continue

                session_id = res["session_id"]
                structured_plan = res["plan_structured"]
                self.planned_batches = structured_plan.get("batches", [])
                self.total_batches = len(self.planned_batches)
                self.status = "deploying"
                self.last_action = f"Architecting {self.total_batches} Batches"

                watcher_logger.info(f"Plan generated for {path.name}. Total batches: {self.total_batches}")

                # 3. Deployment Phase (Strict Continuous Loop)
                watcher_logger.info(f"Starting strict continuous deployment for {path.name}")
                self.last_action = "Continuous Deployment Active..."
                
                has_more = True
                temp_batch = 0
                
                while has_more and self.auto_process:
                    command = "Confirm Final Plan & Proceed Batch 1" if temp_batch == 0 else f"Proceed Batch {temp_batch + 1}"
                    watcher_logger.info(f"Auto-confirming {command} for {path.name}")
                    
                    batch_retry = 0
                    success = False
                    while batch_retry < 5 and not success:
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
                                self.last_action = f"Deployed {temp_batch}/{self.total_batches}"
                                success = True
                            else:
                                raise ValueError(confirm_res.get("message", "Unknown service error"))
                        except Exception as e:
                            batch_retry += 1
                            watcher_logger.error(f"Batch execution failed (Attempt {batch_retry}): {e}")
                            if "tpd" in str(e).lower() or "daily" in str(e).lower():
                                self.status = "error"
                                self.last_action = "Daily Limit Reached."
                                self.auto_process = False
                                break
                            await asyncio.sleep(20)
                    
                    if not success:
                        break
                    
                # 4. Finalize
                if path.exists():
                    generated_dir = self.inbox_path.absolute() / "note generated"
                    generated_dir.mkdir(parents=True, exist_ok=True)
                    new_path = generated_dir / path.name
                    if new_path.exists():
                        new_path = generated_dir / f"{int(time.time())}_{path.name}"
                    shutil.move(str(path.absolute()), str(new_path.absolute()))
                
                self._mark_done(file_path_str)
                
                # Governor Cooldown (10s)
                self.status = "cooling"
                for i in range(10, 0, -1):
                    self.last_action = f"Cooling Down ({i}s)"
                    await asyncio.sleep(1)
                
                self.status = "idle"
                self.last_action = f"Finished {path.name}"
                self.current_file = None
                
            except Exception:
                watcher_logger.error(f"Error processing {self.current_file}: {traceback.format_exc()}")
                if self.current_file:
                    self._mark_error(self.current_file)
                self.status = "idle"
                await asyncio.sleep(10)

    def get_status(self) -> Dict[str, Any]:
        conn = sqlite3.connect(self.db_path)
        pending_count = conn.execute("SELECT COUNT(*) FROM queue WHERE status = 'pending'").fetchone()[0]
        conn.close()
        
        return {
            "status": self.status,
            "auto_process": self.auto_process,
            "current_file": Path(self.current_file).name if self.current_file else None,
            "current_batch": self.current_batch,
            "total_batches": self.total_batches,
            "planned_batches": self.planned_batches,
            "last_action": self.last_action,
            "queue_size": pending_count,
            "processed_notes": self.processed_notes
        }

    def stop(self):
        if self.observer:
            self.observer.stop()
            # No join() here to avoid blocking the event loop during shutdown/reload
        if self.worker_task:
            self.worker_task.cancel()
        print("[OKA Queue] Stopped.")
