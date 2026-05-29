from typing import Optional, Any, Dict

# Global watcher and sync status singletons
ater_watcher: Optional[Any] = None
rag_watcher: Optional[Any] = None
rag_sync_status: Dict[str, Any] = {"status": "idle", "progress": 0, "total": 0, "message": ""}
_cached_vault_path: Optional[str] = None
