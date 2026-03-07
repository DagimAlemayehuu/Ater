"""
Life OS - FastAPI Sidecar Entry Point

This process is spawned by Tauri on desktop launch and communicates
exclusively via localhost HTTP. All secret keys are passed per-request
via HTTP headers (X-Notion-Key, X-Gemini-Key, X-Vault-Path).
"""

import signal
import sys
import os
import traceback
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, Depends, Header, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.ai.strategist import Strategist


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    print("[Life OS Sidecar] Starting up...")
    yield
    print("[Life OS Sidecar] Shutting down...")


app = FastAPI(
    title="Life OS Python Sidecar",
    description="FastAPI backend sidecar for Life OS. Handles AI, Notion, and Obsidian logic.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS: Only allow the Tauri webview origin (tauri://localhost) and local dev (localhost:1420)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "tauri://localhost",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """
    Standard health check for the sidecar.
    """
    return {"status": "ok", "version": "0.1.0"}

@app.get("/api/notion/pages")
async def list_notion_pages(secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Lists pages from the connected Notion workspace.
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        client = NotionClient(secrets.notion_key)
        pages = await client.list_pages()
        return {"pages": pages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notion/databases")
async def list_notion_databases(secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Lists databases from the connected Notion workspace.
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        client = NotionClient(secrets.notion_key)
        databases = await client.list_databases()
        return {"databases": databases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notion/databases/{database_id}/query")
async def query_notion_database(
    database_id: str,
    limit: int = 50,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Queries a specific Notion database.
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        client = NotionClient(secrets.notion_key)
        results = await client.query_database(database_id, limit=limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/obsidian/files")
async def list_obsidian_files(secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Lists files from the connected Obsidian vault.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        client = ObsidianClient(secrets.vault_path)
        if not client.is_valid_vault():
            raise HTTPException(status_code=400, detail="Invalid Obsidian vault path")
        
        files = client.list_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/brainstorm")
async def brainstorm_with_ai(
    query_data: Dict[str, str],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Strategizes and brainstorms based on the query using Gemini.
    """
    if not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key header missing")
    
    query = query_data.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing in request body")
    
    try:
        agent = Strategist(secrets.gemini_key, notion_key=secrets.notion_key)
        response = await agent.brainstorm(
            query, 
            context=query_data.get("context"),
            system_prompt=query_data.get("system_prompt"),
            model=secrets.gemini_model or 'gemini-2.5-flash'
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.patch("/api/notion/pages/{page_id}")
async def update_notion_page(
    page_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Updates properties for a specific Notion page.
    Expects JSON body like: {"properties": {...}} OR just the property map if we match the client's internal wrapping.
    Since NotionClient currently wraps it: json={"properties": properties}
    we should expect 'payload' to be the property map itself.
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        # Extract properties from payload. If it has a 'properties' key, use it, else use payload as is.
        properties = payload.get("properties", payload)
        
        client = NotionClient(secrets.notion_key)
        updated_page = await client.update_page_properties(page_id, properties)
        return {"page": updated_page}
    except Exception as e:
        print(f"[Life OS Sidecar] Notion update failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notion/databases/{database_id}/pages")
async def create_notion_page(
    database_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Creates a new page in a Notion database.
    Expects JSON body with 'properties' key.
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        properties = payload.get("properties", payload)
        client = NotionClient(secrets.notion_key)
        new_page = await client.create_page_in_database(database_id, properties)
        return {"page": new_page}
    except Exception as e:
        print(f"[Life OS Sidecar] Notion create failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notion/pages/{page_id}")
async def delete_notion_page(
    page_id: str,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Archives (deletes) a Notion page."""
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    try:
        client = NotionClient(secrets.notion_key)
        result = await client.archive_page(page_id)
        return {"success": True, "page": result}
    except Exception as e:
        print(f"[Life OS Sidecar] Notion delete failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notion/pages/{page_id}/content")
async def get_notion_page_content(
    page_id: str,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Fetches children blocks of a page.
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        client = NotionClient(secrets.notion_key)
        blocks = await client.get_page_content(page_id)
        return {"blocks": blocks}
    except Exception as e:
        print(f"[Life OS Sidecar] Notion list blocks failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/notion/pages/{page_id}/content")
async def update_notion_page_content(
    page_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Updates page content. 
    Simplification: Clears all current blocks and replaces them with the new markdown/text.
    Expects payload: {"markdown": "..."}
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    markdown = payload.get("markdown", "")
    
    try:
        client = NotionClient(secrets.notion_key)
        
        # 1. Fetch current blocks to delete them
        current_blocks = await client.get_page_content(page_id)
        for block in current_blocks:
            await client.delete_block(block["id"])
            
        # 2. Convert markdown into Notion paragraphs/bullets (very simple conversion)
        # Actually for now we'll just treat the whole thing as paragraphs per newline
        lines = markdown.split("\n")
        new_blocks = []
        for line in lines:
            if not line.strip(): 
                continue
            new_blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": line}}]
                }
            })
            
        if new_blocks:
            # Note: Notion append_block_children has a limit on amount of blocks per call.
            # We assume small to medium content here for simplicity.
            await client.append_block_children(page_id, new_blocks)
            
        return {"success": True}
    except Exception as e:
        print(f"[Life OS Sidecar] Notion update blocks failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

def handle_shutdown(signum, frame):
    """Clean shutdown handler for when Tauri terminates the process."""
    print(f"[Life OS Sidecar] Received signal {signum}. Exiting cleanly.")
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    host = os.environ.get("API_HOST", "127.0.0.1")
    port = int(os.environ.get("API_PORT", "8765"))

    print(f"[Life OS Sidecar] Listening on {host}:{port}")

    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info",
    )
