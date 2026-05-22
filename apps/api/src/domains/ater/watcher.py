import sqlite3
import shutil
import os
import sys
import asyncio
import logging
import traceback
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver
from watchdog.events import FileSystemEventHandler
from .service import AterService
from .governor import governor

# Platform-safe log directory
log_dir = Path.home() / ".ater" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
watcher_log = log_dir / "ater_watcher.log"

watcher_logger = logging.getLogger("AterQueueManager")
watcher_logger.setLevel(logging.INFO)

# Avoid adding multiple handlers if the watcher is re-initialized
if not watcher_logger.handlers:
    file_handler = logging.FileHandler(watcher_log, encoding="utf-8")
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    watcher_logger.addHandler(file_handler)
    watcher_logger.addHandler(logging.StreamHandler(sys.stdout))

class InboxHandler(FileSystemEventHandler):
    def __init__(self, manager: 'AterQueueManager'):
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
        # Standardized to Inbox/Generated per user request
        try:
            vault_root = Path(self.manager.service.secrets.vault_path).resolve()
            generated_dir = (vault_root / "Inbox" / "Generated").resolve()
            abs_src = src_path.resolve()
            
            # Platform-agnostic check if the file is inside the Generated folder
            try:
                if abs_src.is_relative_to(generated_dir):
                    return
            except AttributeError:
                # Fallback to normalized absolute path string check
                abs_src_str = str(abs_src).replace("\\", "/").lower()
                generated_dir_str = str(generated_dir).replace("\\", "/").lower()
                if abs_src_str.startswith(generated_dir_str):
                    return
        except Exception as e:
            self.logger.warning(f"Error checking path generation exclude for {src_path}: {e}")

        if src_path.suffix.lower() in supported and not src_path.name.startswith('.'):
            self.logger.info(f"New file detected: {src_path.name}")
            self.manager.add_to_queue(src_path)

class AterQueueManager:
    """
    Watches the Inbox, maintains a queue, and processes files autonomously if enabled.
    Supports parallel file processing via asynchronous tasks.
    """
    def __init__(self, service: AterService, inbox_path: str, system_instruction_path: str):
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
            
        self.db_path = str(self.inbox_path.absolute() / "ater_queue.db")
        self._init_db()
        self._lock = asyncio.Lock()
        # Limit to 4 concurrent heavy I/O / Embedding tasks to protect the user's OS
        self.worker_semaphore = asyncio.Semaphore(4)
        
        # Register status callback for real-time persistence
        self.service.register_status_callback(self.update_status_message)

    def update_status_message(self, session_id: str, message: str):
        """Updates the database with a real-time status message."""
        try:
            conn = self._get_conn()
            conn.execute("UPDATE queue SET status_message = ? WHERE file_path = ?", (message, session_id))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Watcher] Failed to update status message: {e}")

    def _init_db(self):
        """Initializes the database schema and handles migrations."""
        conn = sqlite3.connect(self.db_path)
        
        # Core Queue Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS queue (
                file_path TEXT PRIMARY KEY,
                status TEXT,
                added_at TEXT,
                session_id TEXT,
                current_batch INTEGER DEFAULT 0,
                total_batches INTEGER DEFAULT 0,
                curriculum TEXT,
                status_message TEXT DEFAULT 'Ready'
            )
        """)
        
        # Meta table for version tracking
        conn.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
        
        # Telemetry tables
        conn.execute("CREATE TABLE IF NOT EXISTS practice_log (id TEXT PRIMARY KEY, note_id TEXT, question_type TEXT, is_correct BOOLEAN, time_taken_seconds INTEGER, timestamp TEXT)")
        conn.execute("CREATE TABLE IF NOT EXISTS note_srs (note_id TEXT PRIMARY KEY, review_count INTEGER DEFAULT 0, consecutive_correct INTEGER DEFAULT 0, easiness_factor REAL DEFAULT 2.5, interval_days INTEGER DEFAULT 0, next_review_date TEXT)")
        conn.execute("CREATE TABLE IF NOT EXISTS study_telemetry (id TEXT PRIMARY KEY, note_path TEXT, duration_seconds INTEGER, timestamp TEXT)")
        conn.execute("CREATE TABLE IF NOT EXISTS study_sessions (id TEXT PRIMARY KEY, hub_id TEXT, duration_seconds INTEGER, timestamp TEXT, mode TEXT)")

        # Handle Migrations
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM meta WHERE key = 'schema_version'")
        row = cursor.fetchone()
        version = int(row[0]) if row else 0

        if version < 1:
            watcher_logger.info("[Migration] Upgrading schema to v1...")
            # We already have the v1 tables created above (CREATE TABLE IF NOT EXISTS)
            cursor.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '1')")
            conn.commit()

        conn.close()

    def _get_conn(self):
        """Returns a simple connection to the initialized database, ensuring schema exists."""
        if not Path(self.db_path).exists() or Path(self.db_path).stat().st_size == 0:
            self._init_db()
            
        conn = sqlite3.connect(self.db_path)
        # Verify table exists to be completely bulletproof
        try:
            conn.execute("SELECT 1 FROM queue LIMIT 1")
        except sqlite3.OperationalError:
            conn.close()
            self._init_db()
            conn = sqlite3.connect(self.db_path)
            
        return conn

    def start(self, loop: asyncio.AbstractEventLoop, auto_process: bool = False):
        if not self.inbox_path.exists():
            self.inbox_path.mkdir(parents=True, exist_ok=True)
            
        vault_root = self.service.secrets.vault_path
        generated_dir = Path(vault_root) / "Inbox" / "Generated"
        generated_dir.mkdir(parents=True, exist_ok=True)
            
        self.loop = loop
        self.auto_process = auto_process
        
        event_handler = InboxHandler(self)
        
        # Windows/Network Drive Reliability: Use Polling as fallback
        try:
            self.observer = Observer()
            self.observer.schedule(event_handler, str(self.inbox_path), recursive=False)
            self.observer.start()
        except Exception as e:
            watcher_logger.warning(f"Native Observer failed ({e}). Falling back to PollingObserver.")
            self.observer = PollingObserver()
            self.observer.schedule(event_handler, str(self.inbox_path), recursive=False)
            self.observer.start()
        
        print(f"[Ater Queue] Monitoring: {self.inbox_path} | Auto Process: {self.auto_process}")
        
        self.scan_existing_files()
        
        if self.worker_task is None or self.worker_task.done():
            self.worker_task = self.loop.create_task(self._worker_loop())

    def update_settings(self, auto_process: bool):
        self.auto_process = auto_process
        print(f"[Ater Queue] Auto process updated to: {self.auto_process}")
        if self.loop and (self.worker_task is None or self.worker_task.done()):
            self.worker_task = self.loop.create_task(self._worker_loop())

    def scan_existing_files(self):
        """Scans the inbox for existing files, adds them to the database, and resets errors."""
        supported = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
        conn = None
        try:
            conn = self._get_conn()
            conn.execute("UPDATE queue SET status = 'pending' WHERE status = 'error'")
            conn.commit()
            
            # Resolve Generated folder path for robust exclusion comparison
            try:
                vault_root = Path(self.service.secrets.vault_path).resolve()
                generated_dir = (vault_root / "Inbox" / "Generated").resolve()
            except Exception:
                generated_dir = None

            for item in self.inbox_path.iterdir():
                if item.is_file() and not item.name.startswith('.') and item.suffix.lower() in supported:
                    abs_item = item.resolve()
                    # Skip if it is within Generated directory
                    if generated_dir:
                        try:
                            if abs_item.is_relative_to(generated_dir):
                                continue
                        except AttributeError:
                            abs_item_str = str(abs_item).replace("\\", "/").lower()
                            gen_dir_str = str(generated_dir).replace("\\", "/").lower()
                            if abs_item_str.startswith(gen_dir_str):
                                continue
                    else:
                        # Fallback simple string check if vault_path could not be resolved
                        if "Generated" in str(abs_item):
                            continue
                            
                    path_str = str(item.absolute())
                    conn.execute("INSERT OR IGNORE INTO queue (file_path, status, added_at) VALUES (?, ?, ?)", 
                                 (path_str, "pending", datetime.now().isoformat()))
            conn.commit()
            watcher_logger.info(f"[Ater Queue] Scan complete. Inbox: {self.inbox_path}")
        except Exception as e:
            watcher_logger.error(f"[Ater Queue] Error scanning files: {e}")
        finally:
            if conn:
                conn.close()

    def add_to_queue(self, file_path: Path):
        path_str = str(file_path.absolute())
        
        # Absolute check to prevent re-processing generated files
        try:
            vault_root = Path(self.service.secrets.vault_path).resolve()
            generated_dir = (vault_root / "Inbox" / "Generated").resolve()
            abs_file = file_path.resolve()
            
            try:
                if abs_file.is_relative_to(generated_dir):
                    return
            except AttributeError:
                abs_file_str = str(abs_file).replace("\\", "/").lower()
                generated_dir_str = str(generated_dir).replace("\\", "/").lower()
                if abs_file_str.startswith(generated_dir_str):
                    return
        except Exception:
            if "Generated" in path_str:
                return
            
        conn = None
        try:
            conn = self._get_conn()
            conn.execute("INSERT OR IGNORE INTO queue (file_path, status, added_at) VALUES (?, ?, ?)", 
                         (path_str, "pending", datetime.now().isoformat()))
            conn.commit()
        finally:
            if conn:
                conn.close()

    def _mark_done(self, file_path: str):
        conn = self._get_conn()
        try:
            conn.execute("DELETE FROM queue WHERE file_path = ?", (file_path,))
            conn.commit()
        finally:
            conn.close()

    def _mark_error(self, file_path: str):
        conn = self._get_conn()
        try:
            conn.execute("UPDATE queue SET status = 'error' WHERE file_path = ?", (file_path,))
            conn.commit()
        finally:
            conn.close()

    def _save_checkpoint(self, file_path: str, session_id: str, batch: int, total: int, curriculum: dict):
        import json as _json
        conn = self._get_conn()
        try:
            conn.execute(
                "UPDATE queue SET status='deploying', session_id=?, current_batch=?, "
                "total_batches=?, curriculum=? WHERE file_path=?",
                (session_id, batch, total, _json.dumps(curriculum), file_path)
            )
            conn.commit()
        finally:
            conn.close()

    def _get_checkpoint(self, file_path: str):
        import json as _json
        conn = self._get_conn()
        try:
            row = conn.execute(
                "SELECT session_id, current_batch, total_batches, curriculum FROM queue WHERE file_path=?",
                (file_path,)
            ).fetchone()
            if row and row[0]:
                return row[0], row[1] or 0, row[2] or 0, _json.loads(row[3] or "{}")
            return None, 0, 0, {}
        finally:
            conn.close()

    async def _worker_loop(self):
        """Monitor the queue and spawn parallel workers for pending files."""
        watcher_logger.info("Ater Parallel Worker Loop Started.")
        
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
                try:
                    cursor = conn.cursor()
                    cursor.execute("SELECT file_path FROM queue WHERE status IN ('pending', 'deploying') ORDER BY added_at ASC")
                    pending = cursor.fetchall()
                finally:
                    conn.close()

                for (file_path_str,) in pending:
                    if file_path_str not in self.active_tasks:
                        task = asyncio.create_task(self.process_file(file_path_str))
                        self.active_tasks[file_path_str] = task
                        watcher_logger.info(f"Spawned parallel worker for {Path(file_path_str).name}")

                self.status = "processing" if self.active_tasks else "idle"
                await asyncio.sleep(5)

            except Exception as e:
                watcher_logger.error(f"Error in Ater worker loop: {e}")
                await asyncio.sleep(10)

    async def process_file(self, file_path_str: str):
        """Worker task for a single file."""
        # The worker will block here if 4 files are already processing.
        # Keep the semaphore for the full generation/deployment lifecycle.
        await self.worker_semaphore.acquire()
        path = Path(file_path_str)
        try:
            # Wait for file to copy/stabilize (especially for larger PDFs/text files)
            # Check size every 0.5s up to 10s. If size remains constant, it's ready.
            if path.exists():
                last_size = -1
                stable_count = 0
                for _ in range(20): # max 10s wait
                    try:
                        current_size = path.stat().st_size
                        if current_size == last_size and current_size > 0:
                            stable_count += 1
                            if stable_count >= 2: # Stable for 1 full second
                                break
                        else:
                            stable_count = 0
                        last_size = current_size
                    except Exception:
                        pass
                    await asyncio.sleep(0.5)

            # Mark as active
            conn = self._get_conn()
            try:
                conn.execute("UPDATE queue SET status = 'deploying' WHERE file_path = ?", (file_path_str,))
                conn.commit()
            finally:
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
                self.last_action = f"Planning {path.name}: Generating Batches..."
                plan_res = await self.service.generate_plan(str(path.absolute()), self.si_path, curriculum=curriculum)
                session_id = plan_res["session_id"]
                plan_structured = plan_res.get("plan_structured", {})
                total = len(plan_structured.get("batches", []))
                
                # Update manager state for UI (Primary focus)
                self.planned_batches = plan_structured.get("batches", [])
                self.total_batches = total
                self.current_batch = 0
                self.processed_notes = []
                
                # Immediate Checkpoint to prevent re-planning on restart
                self._save_checkpoint(file_path_str, session_id, 0, total, curriculum)
            else:
                # v32.0: Restore metadata for UI consistency
                session = await self.service._get_or_restore_session(session_id)
                if session:
                    plan_metadata = session.get("metadata", {})
                    self.planned_batches = plan_metadata.get("batches", [])
                    self.total_batches = total
                    self.current_batch = temp_batch
                    # Processed notes will be synced by get_status via Connections tree
                else:
                    # Session missing from disk? Re-plan.
                    watcher_logger.warning(f"Session {session_id} not found on disk. Re-planning {path.name}...")
                    self._mark_done(file_path_str) # Reset state
                    return await self.process_file(file_path_str)
            
            # 3. Deployment Loop (Hyperdrive)
            has_more = True
            deployment_failed = False
            curriculum_override_applied = (temp_batch > 0)
            self.last_action = f"Deployment Started: {path.name} ({total} batches)..."
            
            while has_more:
                command = "Confirm Final Plan & Proceed Batch 1" if temp_batch == 0 else f"Proceed Batch {temp_batch + 1}"
                self.last_action = f"Deploying {path.name}: Batch {temp_batch + 1}/{total}..."
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
                            
                            # Update DB & Manager State
                            self._save_checkpoint(file_path_str, session_id, temp_batch, total, curriculum)
                            self.current_batch = temp_batch
                            
                            # Append to processed notes for UI
                            new_notes = confirm_res.get("results", [])
                            for n in new_notes:
                                title_str = n.get("title") if isinstance(n, dict) else str(n)
                                if title_str not in self.processed_notes:
                                    self.processed_notes.append(title_str)
                            
                            success = True
                            curriculum_override_applied = True
                        elif confirm_res.get("status") == "rate_limited":
                            self.last_action = f"Throttled: {governor.last_throttle_event or 'Cooling down'}"
                            watcher_logger.warning(f"Rate limit hit for {path.name}. Governor cooling down...")
                            await asyncio.sleep(5) # Let the governor wait loop take over
                            continue # Retry same batch without incrementing batch_retry
                        else:
                            raise ValueError(confirm_res.get("message", "Unknown service error"))
                    except Exception as e:
                        err_msg = str(e).lower()
                        if "429" in err_msg or "rate limit" in err_msg:
                            self.last_action = f"Rate Limit Detected: Waiting for Governor..."
                            watcher_logger.warning(f"Rate limit hit for {path.name}. Sleeping 10s...")
                            await asyncio.sleep(10)
                        else:
                            batch_retry += 1
                            self.last_action = f"Error in Batch {temp_batch + 1} (Retry {batch_retry}/5)..."
                            watcher_logger.error(f"Worker for {path.name} failed batch (Attempt {batch_retry}/5): {e}")
                            await asyncio.sleep(15)
                
                if not success:
                    deployment_failed = True
                    break

            # 4. Finalize
            if not deployment_failed and not has_more:
                self.last_action = f"Finalizing {path.name}..."
                if path.exists():
                    meta = curriculum
                    _sem = (meta.get("semester") or "General").strip()
                    _crs = self.service.vm.get_canonical_title(meta.get("course") or "General_Knowledge")
                    vault_root = Path(self.service.secrets.vault_path)
                    target_dir = vault_root / "Inbox" / "Generated" / _sem / _crs
                    target_dir.mkdir(parents=True, exist_ok=True)
                    clean_name = path.name.replace(" ", "_")
                    shutil.move(str(path.absolute()), str(target_dir / clean_name))
                
                self._mark_done(file_path_str)
                self.last_action = f"Finished {path.name}."
                watcher_logger.info(f"Successfully processed {path.name}")
            else:
                self._mark_error(file_path_str)
                self.last_action = f"Failed to process {path.name}."

        except Exception as e:
            watcher_logger.error(f"Critical worker failure for {path.name}: {e}")
            # Workspace-relative debug logging
            try:
                debug_log = self.inbox_path / ".ater_debug.log"
                with open(debug_log, "a", encoding="utf-8") as _f:
                    _f.write(json.dumps({
                        "sessionId": session_id,
                        "location": "watcher.py:process_file",
                        "message": "Worker hit critical failure",
                        "data": {"file": path.name, "errorType": type(e).__name__, "error": str(e)[:240], "lastAction": self.last_action},
                        "timestamp": int(time.time()*1000)
                    }) + "\n")
            except:
                pass
            self._mark_error(file_path_str)
            self.last_action = f"Error: {str(e)}"
        finally:
            self.worker_semaphore.release()

    def get_status(self) -> Dict[str, Any]:
        conn = self._get_conn()
        try:
            pending_count = conn.execute("SELECT COUNT(*) FROM queue WHERE status = 'pending'").fetchone()[0]
            
            current_file = None
            db_status_msg = "Ready"
            primary_path_str = None
            
            if self.active_tasks:
                primary_path_str = list(self.active_tasks.keys())[0]
                current_file = Path(primary_path_str).name
                
                row = conn.execute("SELECT current_batch, total_batches, status_message FROM queue WHERE file_path=?", (primary_path_str,)).fetchone()
                if row:
                    self.current_batch = row[0] or self.current_batch
                    self.total_batches = row[1] or self.total_batches
                    db_status_msg = row[2] or "Processing"
        finally:
            conn.close()
        active_files = [Path(f).name for f in self.active_tasks.keys()]
        
        # Pull live status from service if available (fallback to DB)
        display_action = db_status_msg
        session_id = primary_path_str
        
        if session_id:
            # Check session for real-time processed notes
            session = AterService._sessions.get(session_id)
            if session:
                svc_processed = session.get("processed_notes", [])
                # Combine local (completed batches) with session (in-progress parallel notes)
                combined_notes = list(set(self.processed_notes + svc_processed))
                self.processed_notes = combined_notes

        if governor.last_throttle_event:
            display_action = f"Throttled: {governor.last_throttle_event}"

        # Calculate total notes count across all planned batches
        total_notes_count = 0
        for batch in self.planned_batches:
            total_notes_count += len(batch.get("notes", []))

        # In Hyperdrive mode, current_batch stays 0 until all notes complete.
        # Derive a live "notes done" count from processed_notes for the progress bar.
        displayed_batch = self.current_batch
        if self.planned_batches and len(self.processed_notes) > displayed_batch:
            displayed_batch = len(self.processed_notes)

        return {
            "status": self.status,
            "auto_process": self.auto_process,
            "active_files": active_files,
            "current_file": current_file,
            "current_batch": displayed_batch,
            "total_batches": self.total_batches,
            "planned_batches": self.planned_batches,
            "total_notes_count": total_notes_count,
            "last_action": display_action,
            "queue_size": pending_count,
            "processed_notes": self.processed_notes,
            "governor_pressure": governor.current_pressure
        }

    def reset_queue(self):
        """Cancels all active tasks and clears local state."""
        for task in self.active_tasks.values():
            task.cancel()
        self.active_tasks = {}
        self.processed_notes = []
        self.planned_batches = []
        self.current_batch = 0
        self.total_batches = 0
        self.status = "idle"
        self.last_action = "Ready"

    def stop(self):
        if self.observer:
            self.observer.stop()
        if self.worker_task:
            self.worker_task.cancel()
        
        # v32.0: Cancel all parallel workers
        for path, task in self.active_tasks.items():
            if not task.done():
                print(f"[Ater Queue] Canceling active task for: {Path(path).name}")
                task.cancel()
                
        print("[Ater Queue] Stopped.")
