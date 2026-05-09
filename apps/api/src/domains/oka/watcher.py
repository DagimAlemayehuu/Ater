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
        # Standardized to 5-Pdf Store/note generated per user request
        vault_root = Path(self.manager.service.secrets.vault_path).resolve()
        generated_dir = (vault_root / "5-Pdf Store" / "note generated").resolve()
        abs_src = src_path.resolve()

        if str(abs_src).startswith(str(generated_dir)):
            return

        if src_path.suffix.lower() in supported and not src_path.name.startswith('.'):
            self.logger.info(f"New file detected: {src_path.name}")
            self.manager.add_to_queue(src_path)

class OkaQueueManager:
    """
    Watches the Inbox, maintains a queue, and processes files autonomously if enabled.
    Supports parallel file processing via asynchronous tasks.
    """
    def __init__(self, service: OkaService, inbox_path: str, system_instruction_path: str):
        self.service = service
        self.inbox_path = Path(inbox_path)
        self.si_path = system_instruction_path
        self.observer: Optional[Observer] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Queue State
        self.auto_process = False
        self.status = "idle" 
        self.active_tasks: Dict[str, asyncio.Task] = {} # Map file_path -> Task
        self.current_batch = 0
        self.total_batches = 0
        self.last_action: str = "Ready"
        self.processed_notes: List[Dict[str, str]] = [] 
        self.planned_batches: List[Dict[str, Any]] = [] 
        self.worker_task: Optional[asyncio.Task] = None
        
        if not self.inbox_path.exists():
            self.inbox_path.mkdir(parents=True, exist_ok=True)
            
        self.db_path = str(self.inbox_path.absolute() / "oka_queue.db")
        self._init_db()
        self._lock = asyncio.Lock()

    def _init_db(self):
        """Initializes the database schema."""
        conn = self._get_conn()
        conn.close()

    def start(self, loop: asyncio.AbstractEventLoop, auto_process: bool = False):
        if not self.inbox_path.exists():
            self.inbox_path.mkdir(parents=True, exist_ok=True)
            
        vault_root = self.service.secrets.vault_path
        generated_dir = Path(vault_root) / "5-Pdf Store" / "note generated"
        generated_dir.mkdir(parents=True, exist_ok=True)
            
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
        """Scans the inbox for existing files, adds them to the database, and resets errors."""
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute("UPDATE queue SET status = 'pending' WHERE status = 'error'")
            conn.commit()
            conn.close()
            
            for item in self.inbox_path.iterdir():
                if item.is_file() and not item.name.startswith('.') and item.suffix.lower() in supported:
                    self.add_to_queue(item)
        except Exception as e:
            print(f"[OKA Queue] Error scanning files: {e}")

    def _get_conn(self):
        """Returns a connection and ensures the schema exists."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS queue (
                file_path TEXT PRIMARY KEY,
                status TEXT,
                added_at TEXT,
                session_id TEXT,
                current_batch INTEGER DEFAULT 0,
                total_batches INTEGER DEFAULT 0,
                curriculum TEXT
            )
        """)
        # Migrations
        for col, defval in [("session_id", "NULL"), ("current_batch", "0"),
                            ("total_batches", "0"), ("curriculum", "NULL")]:
            try:
                conn.execute(f"ALTER TABLE queue ADD COLUMN {col} {'TEXT' if col in ('session_id','curriculum') else 'INTEGER'} DEFAULT {defval}")
            except Exception:
                pass
        conn.commit()
        return conn

    def add_to_queue(self, file_path: Path):
        path_str = str(file_path.absolute())
        if "_Generated" in path_str:
            return
            
        conn = self._get_conn()
        conn.execute("INSERT OR IGNORE INTO queue (file_path, status, added_at) VALUES (?, ?, ?)", 
                     (path_str, "pending", datetime.now().isoformat()))
        conn.commit()
        conn.close()

    def _mark_done(self, file_path: str):
        conn = self._get_conn()
        conn.execute("DELETE FROM queue WHERE file_path = ?", (file_path,))
        conn.commit()
        conn.close()

    def _mark_error(self, file_path: str):
        conn = self._get_conn()
        conn.execute("UPDATE queue SET status = 'error' WHERE file_path = ?", (file_path,))
        conn.commit()
        conn.close()

    def _save_checkpoint(self, file_path: str, session_id: str, batch: int, total: int, curriculum: dict):
        import json as _json
        conn = self._get_conn()
        conn.execute(
            "UPDATE queue SET status='deploying', session_id=?, current_batch=?, "
            "total_batches=?, curriculum=? WHERE file_path=?",
            (session_id, batch, total, _json.dumps(curriculum), file_path)
        )
        conn.commit()
        conn.close()

    def _get_checkpoint(self, file_path: str):
        import json as _json
        conn = self._get_conn()
        row = conn.execute(
            "SELECT session_id, current_batch, total_batches, curriculum FROM queue WHERE file_path=?",
            (file_path,)
        ).fetchone()
        conn.close()
        if row and row[0]:
            return row[0], row[1] or 0, row[2] or 0, _json.loads(row[3] or "{}")
        return None, 0, 0, {}

    async def _worker_loop(self):
        """Monitor the queue and spawn parallel workers for pending files."""
        watcher_logger.info("OKA Parallel Worker Loop Started.")
        
        while True:
            try:
                # Cleanup finished tasks
                finished = [f for f, t in self.active_tasks.items() if t.done()]
                for f in finished:
                    try:
                        await self.active_tasks[f] # Catch errors
                    except Exception as e:
                        watcher_logger.error(f"Task for {f} failed: {e}")
                    del self.active_tasks[f]

                if not self.auto_process:
                    await asyncio.sleep(5)
                    continue

                conn = self._get_conn()
                cursor = conn.cursor()
                cursor.execute("SELECT file_path FROM queue WHERE status IN ('pending', 'deploying') ORDER BY added_at ASC")
                pending = cursor.fetchall()
                conn.close()

                for (file_path_str,) in pending:
                    if file_path_str not in self.active_tasks:
                        task = asyncio.create_task(self.process_file(file_path_str))
                        self.active_tasks[file_path_str] = task
                        watcher_logger.info(f"Spawned parallel worker for {Path(file_path_str).name}")

                self.status = "processing" if self.active_tasks else "idle"
                await asyncio.sleep(5)

            except Exception as e:
                watcher_logger.error(f"Error in OKA worker loop: {e}")
                await asyncio.sleep(10)

    async def process_file(self, file_path_str: str):
        """Worker task for a single file."""
        path = Path(file_path_str)
        try:
            # Mark as active
            conn = self._get_conn()
            conn.execute("UPDATE queue SET status = 'deploying' WHERE file_path = ?", (file_path_str,))
            conn.commit()
            conn.close()
            
            watcher_logger.info(f"Worker started for {path.name}")
            
            # Check for checkpoint
            session_id, temp_batch, total, curriculum = self._get_checkpoint(file_path_str)
            
            if not session_id:
                # 1. Detection
                self.last_action = f"Detecting {path.name}..."
                detect_res = await self.service.detect_curriculum(str(path.absolute()))
                curriculum = detect_res.get("detected_curriculum") or {}
                
                # 2. Planning
                self.last_action = f"Planning {path.name}..."
                plan_res = await self.service.generate_plan(str(path.absolute()), self.si_path, curriculum=curriculum)
                session_id = plan_res["session_id"]
                total = len(plan_res["plan_structured"].get("batches", []))
            
            # 3. Deployment Loop (Hyperdrive)
            has_more = True
            deployment_failed = False
            curriculum_override_applied = (temp_batch > 0)
            
            while has_more:
                command = "Confirm Final Plan & Proceed Batch 1" if temp_batch == 0 else f"Proceed Batch {temp_batch + 1}"
                watcher_logger.info(f"Worker for {path.name} executing {command}")
                
                batch_retry = 0
                success = False
                while batch_retry < 5 and not success:
                    try:
                        confirm_res = await self.service.confirm_plan(
                            session_id, 
                            command=command,
                            curriculum_override=curriculum if (temp_batch == 0 and not curriculum_override_applied) else None
                        )
                        
                        if confirm_res.get("status") == "success":
                            temp_batch = confirm_res.get("current_batch", temp_batch + 1)
                            has_more = confirm_res.get("has_more", False)
                            self._save_checkpoint(file_path_str, session_id, temp_batch, total, curriculum)
                            success = True
                            curriculum_override_applied = True
                        else:
                            raise ValueError(confirm_res.get("message", "Unknown service error"))
                    except Exception as e:
                        err_msg = str(e).lower()
                        if "429" in err_msg or "rate limit" in err_msg:
                            watcher_logger.warning(f"Rate limit hit for {path.name}. Sleeping 60s...")
                            await asyncio.sleep(60)
                        else:
                            batch_retry += 1
                            watcher_logger.error(f"Worker for {path.name} failed batch (Attempt {batch_retry}/5): {e}")
                            await asyncio.sleep(15)
                
                if not success:
                    deployment_failed = True
                    break

            # 4. Finalize
            if not deployment_failed and not has_more:
                if path.exists():
                    meta = curriculum
                    _sem = (meta.get("semester") or "General").strip()
                    _crs = self.service.vm.get_canonical_title(meta.get("course") or "General_Knowledge")
                    vault_root = Path(self.service.secrets.vault_path)
                    target_dir = vault_root / "5-Pdf Store" / "note generated" / _sem / _crs
                    target_dir.mkdir(parents=True, exist_ok=True)
                    clean_name = path.name.replace(" ", "_")
                    shutil.move(str(path.absolute()), str(target_dir / clean_name))
                
                self._mark_done(file_path_str)
                watcher_logger.info(f"Successfully processed {path.name}")
            else:
                self._mark_error(file_path_str)

        except Exception as e:
            watcher_logger.error(f"Critical worker failure for {path.name}: {e}")
            self._mark_error(file_path_str)

    def get_status(self) -> Dict[str, Any]:
        conn = self._get_conn()
        pending_count = conn.execute("SELECT COUNT(*) FROM queue WHERE status = 'pending'").fetchone()[0]
        conn.close()
        
        active_files = [Path(f).name for f in self.active_tasks.keys()]
        
        return {
            "status": self.status,
            "auto_process": self.auto_process,
            "active_files": active_files,
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
        if self.worker_task:
            self.worker_task.cancel()
        print("[OKA Queue] Stopped.")
