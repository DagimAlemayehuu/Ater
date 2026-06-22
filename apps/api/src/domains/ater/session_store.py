import json
import asyncio
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from langchain_core.messages import SystemMessage

logger = logging.getLogger("Ater")

class SessionStore:
    _sessions: Dict[str, Dict[str, Any]] = {}
    _status: Dict[str, str] = {}
    _rate_limited: Dict[str, float] = {}
    _session_file = Path.home() / ".ater" / "ater" / "sessions.json"
    _status_callback: Optional[Any] = None

    @classmethod
    def clear_sessions(cls):
        """Wipes all active and persisted sessions."""
        cls._sessions = {}
        cls._status = {}
        cls._rate_limited = {}
        if cls._session_file.exists():
            try:
                cls._session_file.unlink()
            except Exception as e:
                logger.error(f"[SessionStore] Failed to delete session file: {e}")

    @classmethod
    def set_status(cls, session_id: str, message: str):
        """Sets the status for a session and triggers callback if registered."""
        cls._status[session_id] = message
        if cls._status_callback:
            try:
                cls._status_callback(session_id, message)
            except Exception as e:
                print(f"[SessionStore] Status callback failed: {e}")

    @classmethod
    def register_status_callback(cls, callback):
        cls._status_callback = callback

    @classmethod
    def ensure_session_dir(cls):
        cls._session_file.parent.mkdir(parents=True, exist_ok=True)

    @classmethod
    def persist_session(cls, session_id: str, data: Dict[str, Any]):
        """Saves session state to disk for recovery."""
        try:
            persist_data = {
                "path": data.get("path"),
                "metadata": data.get("metadata"),
                "current_batch": data.get("current_batch"),
                "total_batches": data.get("total_batches"),
                "target_hub": data.get("target_hub")
            }
            
            existing = {}
            if cls._session_file.exists():
                with open(cls._session_file, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            
            existing[session_id] = persist_data
            with open(cls._session_file, "w", encoding="utf-8") as f:
                json.dump(existing, f)
        except Exception as e:
            print(f"[SessionStore] Session persistence failed: {e}")

    @classmethod
    async def get_or_restore_session(cls, session_id: str, resolve_si_path_fn, get_si_fn) -> Optional[Dict[str, Any]]:
        if session_id in cls._sessions:
            return cls._sessions[session_id]
        
        if await asyncio.to_thread(cls._session_file.exists):
            try:
                def _read_session():
                    with open(cls._session_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                
                existing = await asyncio.to_thread(_read_session)
                if session_id in existing:
                    data = existing[session_id]
                    si_path = resolve_si_path_fn()
                    si = await get_si_fn(str(si_path))
                    data["messages"] = [SystemMessage(content=si)]
                    cls._sessions[session_id] = data
                    return data
            except Exception:
                pass
        return None

    @classmethod
    def get_paused_sessions(cls) -> List[Dict[str, Any]]:
        """Returns all sessions that were paused due to a rate limit."""
        paused = []
        for sid, ts in cls._rate_limited.items():
            session = cls._sessions.get(sid, {})
            paused.append({
                "session_id": sid,
                "paused_at": ts,
                "current_batch": session.get("current_batch", 0),
                "total_batches": session.get("total_batches", 0),
                "status": cls._status.get(sid, "rate_limited"),
            })
        return paused
