import os
import sys
import time
import signal
import psutil
import logging
import asyncio
import threading
from typing import Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI

logger = logging.getLogger("Ater")

class ServerLifespanManager:
    @staticmethod
    def parent_watchdog():
        """
        Monitors the parent process (Tauri). If Tauri dies, this kills the Python sidecar instantly,
        preventing zombie processes and port blocking on the next boot.
        """
        try:
            parent_pid = int(os.getenv("ATER_PARENT_PID", os.getppid()))
            parent_process = psutil.Process(parent_pid)
            parent_create_time = parent_process.create_time()
            logger.info(f"[Watchdog] Assigned to monitor Parent PID: {parent_pid} (Created: {parent_create_time})")
            
            while True:
                time.sleep(5)
                try:
                    current_process = psutil.Process(parent_pid)
                    if current_process.create_time() != parent_create_time:
                        raise psutil.NoSuchProcess(parent_pid)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    logger.critical(f"[Watchdog] FATAL: Parent Tauri process {parent_pid} vanished or was recycled. Committing sepuku.")
                    os._exit(1)
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"[Watchdog] Failed to start monitor: {e}")

    @staticmethod
    def start_watchdog():
        watchdog_thread = threading.Thread(target=ServerLifespanManager.parent_watchdog, daemon=True)
        watchdog_thread.start()

    @staticmethod
    def register_signal_handlers():
        def _signal_handler(sig, frame):
            logger.info(f"[Ater] Signal {sig} received. Purging background services...")
            import src.api.state as state
            if state.ater_watcher:
                state.ater_watcher.stop()
            if state.rag_watcher:
                state.rag_watcher.stop()
            sys.exit(0)

        signal.signal(signal.SIGINT, _signal_handler)
        signal.signal(signal.SIGTERM, _signal_handler)

    @staticmethod
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Manage application lifespan events."""
        logger.info("FastAPI sidecar startup event: non-blocking initialization verified.")
        yield
        import src.api.state as state
        if state.ater_watcher:
            logger.info("[Ater] Stopping watcher during shutdown")
            state.ater_watcher.stop()
        if state.rag_watcher:
            logger.info("[RAG] Stopping Vault Watcher during shutdown")
            state.rag_watcher.stop()
