from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Dict, Any, Optional
from loguru import logger

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.vault.client import VaultManager
from src.domains.vault.ingestor import VaultIngestor
from src.domains.obsidian.client import ObsidianClient

router = APIRouter(prefix="/vault", tags=["vault"])

@router.post("/sync")
async def sync_vault(
    force: bool = False,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Manually syncs the Obsidian vault with the vector store.
    """
    if not secrets.vault_path or not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Vault-Path and X-Gemini-Key headers missing")
    
    try:
        vault_manager = VaultManager(secrets.vault_path, secrets.gemini_key)
        obsidian_client = ObsidianClient(secrets.vault_path)
        ingestor = VaultIngestor(vault_manager, obsidian_client)
        
        result = await ingestor.sync_vault(force=force)
        return {"status": "success", "result": result}
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_vault(
    q: str = Query(..., description="The search query"),
    limit: int = 5,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Performs a vector search across the Obsidian vault.
    """
    if not secrets.vault_path or not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Vault-Path and X-Gemini-Key headers missing")
    
    try:
        vault_manager = VaultManager(secrets.vault_path, secrets.gemini_key)
        results = await vault_manager.search(q, limit=limit)
        
        # Format results for the frontend
        formatted = []
        for r in results:
            formatted.append({
                "path": r["path"],
                "content": r["content"],
                "score": float(r["_distance"]) if "_distance" in r else 0,
                "modified": r["modified"]
            })
            
        return {"results": formatted}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/index")
async def clear_vault_index(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Clears the entire vector store for the current vault.
    """
    if not secrets.vault_path or not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Vault-Path and X-Gemini-Key headers missing")
    
    try:
        vault_manager = VaultManager(secrets.vault_path, secrets.gemini_key)
        vault_manager.clear_index()
        return {"status": "success", "message": "Index cleared"}
    except Exception as e:
        logger.error(f"Clear index failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
