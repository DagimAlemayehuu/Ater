"""
Life OS - FastAPI Sidecar Entry Point

This process is spawned by Tauri on desktop launch and communicates
exclusively via localhost HTTP. All secret keys are passed per-request
via HTTP headers (X-Notion-Key, X-Gemini-Key, X-Vault-Path).
"""

import signal
import sys
import os
import asyncio
import traceback
import shutil
import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("LifeOS")

import uvicorn
from fastapi import FastAPI, Depends, Header, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.ai.strategist import Strategist
from src.domains.oka.service import OkaService
from src.domains.oka.watcher import OkaWatcher

from src.domains.academics.router import router as academics_router

# Global watcher instance
oka_watcher: Optional[OkaWatcher] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    print("[Life OS Sidecar] Starting up...")
    yield
    print("[Life OS Sidecar] Shutting down...")
    if oka_watcher:
        logger.info("[OKA] Stopping watcher during shutdown")
        oka_watcher.stop()


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

# Mount routers
app.include_router(academics_router, prefix="/api")


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

@app.get("/api/obsidian/files/{path:path}")
async def read_obsidian_file(path: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Reads a file from the Obsidian vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    try:
        client = ObsidianClient(secrets.vault_path)
        content = client.read_note(path)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found")
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/obsidian/files/{path:path}")
async def write_obsidian_file(
    path: str, 
    payload: Dict[str, str] = Body(...), 
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Writes content to a file in the Obsidian vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    content = payload.get("content")
    if content is None:
        raise HTTPException(status_code=400, detail="Content missing")
    try:
        full_path = Path(secrets.vault_path) / path
        os.makedirs(full_path.parent, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/personae/save")
async def save_persona_prompt(payload: Dict[str, str] = Body(...)):
    """Saves a customized persona prompt to the system prompts/custom prompts directory."""
    name = payload.get("name")
    content = payload.get("content")
    if not name or not content:
        raise HTTPException(status_code=400, detail="Missing name or content")
    try:
        # Resolve the root project path (LifeOs directory)
        # apps/api/src/api/main.py -> LifeOs
        root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        custom_prompts_dir = root_dir / "resources" / "prompts" / "custom prompts"
        custom_prompts_dir.mkdir(parents=True, exist_ok=True)
        
        # Make a safe filename
        safe_name = "".join([c for c in name if c.isalnum() or c in (' ', '-', '_')]).strip()
        file_path = custom_prompts_dir / f"{safe_name}.md"
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"success": True, "path": str(file_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/upload")
async def ai_upload(file: UploadFile = File(...), secrets: AppSecrets = Depends(get_app_secrets)):
    """Uploads a file to Gemini Files API for reasoning context."""
    if not secrets.gemini_key:
        raise HTTPException(status_code=400, detail="Gemini API Key missing")
    
    # Save temporary file
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        from google import genai
        client = genai.Client(api_key=secrets.gemini_key)
        uploaded_file = client.files.upload(file=temp_path)
        
        # Wait for file to process
        import time
        max_retries = 60
        for _ in range(max_retries):
            file_info = client.files.get(name=uploaded_file.name)
            if file_info.state.name == "ACTIVE":
                break
            if file_info.state.name == "FAILED":
                raise HTTPException(status_code=500, detail="File processing failed in Gemini")
            time.sleep(2)
        else:
            raise HTTPException(status_code=500, detail="File processing timed out")

        return {"file_uri": uploaded_file.uri, "name": file.filename}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/ai/brainstorm")
async def brainstorm_with_ai(
    query_data: Dict[str, Any],
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
        agent = Strategist(secrets.gemini_key, notion_key=secrets.notion_key, vault_path=secrets.vault_path)
        response = await agent.brainstorm(
            query,
            context=query_data.get("context"),
            system_prompt=query_data.get("system_prompt"),
            model=secrets.gemini_model or 'gemini-2.5-flash',
            history=query_data.get("history", []),
            file_uri=query_data.get("file_uri")
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- OKA (Autonomous Ingestion) Endpoints ---

@app.post("/api/oka/process")
async def oka_process_manual(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Manually process a text block or file path through OKA."""
    if not secrets.gemini_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Gemini Key and Vault Path are required")
    
    # Robust discovery of OKA_System_Instruction.md
    # Search upwards from this file's location for the project root
    current = Path(__file__).resolve().parent
    si_path = None
    for _ in range(6):
        test_path = current / "OKA_System_Instruction.md"
        if test_path.exists():
            si_path = test_path
            break
        current = current.parent
    
    if not si_path:
        # Final fallback to current directory
        si_path = Path("OKA_System_Instruction.md")
        if not si_path.exists():
            raise HTTPException(status_code=500, detail="System Instruction file not found. Check root directory.")
    
    service = OkaService(secrets.gemini_key, secrets.vault_path)
    
    text = payload.get("text")
    file_path = payload.get("file_path")
    
    try:
        if file_path:
            print(f"[Life OS Sidecar] Initializing OKA plan for file: {file_path}")
            results = await service.process_file(file_path, str(si_path))
        elif text:
            print(f"[Life OS Sidecar] Initializing OKA plan for raw text")
            results = await service.process_text(text, str(si_path))
        else:
            raise HTTPException(status_code=400, detail="Either 'text' or 'file_path' must be provided")
            
        return results
    except Exception as e:
        print(f"[Life OS Sidecar] OKA Initialization failed: {e}")
        error_details = traceback.format_exc()
        print(error_details)
        raise HTTPException(status_code=500, detail=f"OKA Initialization failed: {str(e)}\n\nTraceback:\n{error_details}")

@app.post("/api/oka/confirm")
async def oka_confirm_plan(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Confirms an existing OKA plan and trigger deployment."""
    session_id = payload.get("session_id")
    command = payload.get("command", "Confirm Final Plan & Proceed Batch 1")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    service = OkaService(secrets.gemini_key, secrets.vault_path)
    try:
        results = await service.confirm_plan(session_id, command=command)
        
        # Move file to .processed only when all batches are done
        if not results.get("has_more") and not session_id.startswith("text_"):
            path = Path(session_id)
            if path.exists():
                processed_dir = path.parent / ".processed"
                processed_dir.mkdir(exist_ok=True)
                new_path = processed_dir / path.name
                if new_path.exists():
                    new_path = processed_dir / f"{int(time.time())}_{path.name}"
                path.rename(new_path)
                print(f"[Life OS Sidecar] Moved {path.name} to .processed after all batches complete")

        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[Life OS Sidecar] OKA Confirmation failed: {e}")
        error_details = traceback.format_exc()
        print(error_details)
        raise HTTPException(status_code=500, detail=f"OKA Confirmation failed: {str(e)}\n\nTraceback:\n{error_details}")

@app.post("/api/oka/watcher/toggle")
async def oka_watcher_toggle(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Starts or stops the Inbox watcher."""
    global oka_watcher
    
    if not secrets.gemini_key or not secrets.vault_path or not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Gemini Key, Vault Path, and Inbox Path are required")
    
    if secrets.auto_deploy:
        # If already running, stop it first to apply new settings (path, etc.)
        if oka_watcher:
            print("[Life OS Sidecar] Restarting OKA Watcher with new settings...")
            oka_watcher.stop()
            oka_watcher = None
        
        root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        si_path = root_dir / "OKA_System_Instruction.md"
        
        service = OkaService(secrets.gemini_key, secrets.vault_path)
        oka_watcher = OkaWatcher(service, secrets.inbox_path, str(si_path))
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        oka_watcher.start(loop)
        logger.info(f"[OKA] Watcher started for inbox: {secrets.inbox_path}")
        return {"status": "watcher_started", "inbox": secrets.inbox_path}
    else:
        if oka_watcher:
            oka_watcher.stop()
            oka_watcher = None
            return {"status": "watcher_stopped"}
        else:
            return {"status": "already_stopped"}

@app.get("/api/oka/watcher/status")
async def oka_watcher_status(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns the current status of the OKA watcher."""
    return {
        "is_running": oka_watcher is not None,
        "inbox": str(oka_watcher.inbox_path) if oka_watcher else secrets.inbox_path
    }

@app.get("/api/oka/inbox")
async def oka_list_inbox(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists files currently in the Inbox folder."""
    print(f"[Life OS Sidecar] Listing inbox. Path from header: '{secrets.inbox_path}'")
    if not secrets.inbox_path or secrets.inbox_path.strip() == "":
        print("[Life OS Sidecar] Inbox path is effectively empty")
        return {"files": []}
    
    inbox = Path(secrets.inbox_path)
    print(f"[Life OS Sidecar] Resolved inbox path: {inbox.absolute()}")
    if not inbox.exists():
        print(f"[Life OS Sidecar] Inbox path DOES NOT EXIST on disk: {inbox.absolute()}")
        return {"files": []}
    
    if not inbox.is_dir():
        print(f"[Life OS Sidecar] Inbox path is NOT a directory: {inbox.absolute()}")
        return {"files": []}
    
    files = []
    supported_extensions = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
    try:
        for f in inbox.iterdir():
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in supported_extensions:
                files.append({
                    "name": f.name,
                    "path": str(f.absolute()),
                    "size": f.stat().st_size,
                    "suffix": f.suffix.lower()
                })
        print(f"[Life OS Sidecar] Found {len(files)} files in inbox")
    except Exception as e:
        print(f"[Life OS Sidecar] Error scanning inbox: {e}")
    
    return {"files": files}

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
            
        # 2. Convert markdown into Notion blocks
        lines = markdown.split("\n")
        new_blocks = []
        for line in lines:
            line = line.strip()
            if not line:
                # Add empty paragraph for spacing
                new_blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {"rich_text": []}
                })
                continue
            
            # Simple Heading detection
            if line.startswith("# "):
                block_type = "heading_1"
                text = line[2:]
            elif line.startswith("## "):
                block_type = "heading_2"
                text = line[3:]
            elif line.startswith("### "):
                block_type = "heading_3"
                text = line[4:]
            # Simple Bullet List detection
            elif line.startswith("- ") or line.startswith("* "):
                block_type = "bulleted_list_item"
                text = line[2:]
            # Default to paragraph
            else:
                block_type = "paragraph"
                text = line

            new_blocks.append({
                "object": "block",
                "type": block_type,
                block_type: {
                    "rich_text": [{"type": "text", "text": {"content": text}}]
                }
            })
            
        if new_blocks:
            # Batch blocks into groups of 100 to avoid Notion API limits
            for i in range(0, len(new_blocks), 100):
                await client.append_block_children(page_id, new_blocks[i:i+100])
            
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
