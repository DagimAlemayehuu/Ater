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
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Depends, Header, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.vault.router import router as vault_router
from src.domains.vault.client import VaultManager

# AI Agents
from src.domains.ai.strategist import Strategist
from src.domains.ai.coach import Coach
from src.domains.ai.financer import Financer
from src.domains.ai.scout import Scout
from src.domains.ai.scribe import Scribe
from src.domains.ai.architect import Architect
from src.domains.ai.auditor import Auditor

# Automations
from src.domains.automations.briefing import DailyBriefing
from src.domains.automations.categorizer import ExpenseCategorizer
from src.domains.automations.cleanup import NotionCleanup
from src.domains.automations.habits import HabitStreak
from src.domains.automations.academics import AcademicFetcher

# OKA Integration
from src.domains.oka.router import router as oka_router
from src.domains.academics.router import router as academics_router
from src.domains.oka.database import engine as oka_engine, Base as OkaBase, AsyncSessionLocal as OkaSessionLocal, ensure_schema as oka_ensure_schema
from src.domains.oka.gemini_service import background_queue_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    print("[Life OS Sidecar] Starting up...")

    # Initialize OKA database tables
    async with oka_engine.begin() as conn:
        await conn.run_sync(OkaBase.metadata.create_all)
    await oka_ensure_schema()
    print("[Life OS Sidecar] OKA database initialized.")

    # Start OKA background worker
    def get_session_factory():
        async def factory():
            async with OkaSessionLocal() as session:
                yield session
        return factory

    worker_task = asyncio.create_task(background_queue_worker(get_session_factory()))
    print("[Life OS Sidecar] OKA background worker started.")

    yield

    worker_task.cancel()
    print("[Life OS Sidecar] Shutting down...")


app = FastAPI(
    title="Life OS Python Sidecar",
    description="FastAPI backend sidecar for Life OS. Handles AI, Notion, and Obsidian logic.",
    version="0.1.0",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for any unhandled exceptions.
    Logs the full traceback and returns a clean 500 JSON response.
    """
    error_detail = str(exc)
    logger.error(f"UNHANDLED EXCEPTION: {error_detail}\n{traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": error_detail}
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
app.include_router(oka_router, prefix="/api")
app.include_router(academics_router, prefix="/api")
app.include_router(vault_router, prefix="/api")


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
        logger.error(f"Notion list pages failed: {e}")
        raise HTTPException(status_code=502, detail=f"Notion API Error: {str(e)}")

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
        logger.error(f"Notion list databases failed: {e}")
        raise HTTPException(status_code=502, detail=f"Notion API Error: {str(e)}")

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
        logger.error(f"Notion query failed ({database_id}): {e}")
        raise HTTPException(status_code=502, detail=f"Notion API Error: {str(e)}")

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Obsidian list files failed: {e}")
        raise HTTPException(status_code=500, detail=f"Vault Error: {str(e)}")

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Obsidian read failed ({path}): {e}")
        raise HTTPException(status_code=500, detail=f"Vault Read Error: {str(e)}")

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
            history=query_data.get("history")
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Gemini brainstorm failed: {e}")
        raise HTTPException(status_code=503, detail=f"AI Agent Error: {str(e)}")

@app.post("/api/ai/coach")
async def chat_with_coach(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Habit and motivation coaching using the Coach agent.
    """
    if not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key header missing")
    
    query = query_data.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing")
    
    try:
        agent = Coach(secrets.gemini_key, notion_key=secrets.notion_key, vault_path=secrets.vault_path)
        response = await agent.chat(
            query, 
            context=query_data.get("context"),
            model=secrets.gemini_model or 'gemini-2.5-flash',
            history=query_data.get("history")
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Coach failed: {e}")
        raise HTTPException(status_code=503, detail=f"Coach Error: {str(e)}")

@app.post("/api/ai/financer")
async def chat_with_financer(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Expense analysis and budgeting agent."""
    if not secrets.gemini_key or not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key or X-Notion-Key missing")
    try:
        agent = Financer(secrets.gemini_key, secrets.notion_key, secrets.gemini_model or 'gemini-2.5-flash')
        response = await agent.chat(query_data.get("query", ""), history=query_data.get("history"), context=query_data.get("context", ""))
        return {"response": response}
    except Exception as e:
        logger.error(f"Financer failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/ai/scout")
async def chat_with_scout(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Web-search enabled research agent."""
    if not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key missing")
    try:
        agent = Scout(secrets.gemini_key, secrets.gemini_model or 'gemini-2.5-flash')
        response = await agent.chat(query_data.get("query", ""), history=query_data.get("history"), context=query_data.get("context", ""))
        return {"response": response}
    except Exception as e:
        logger.error(f"Scout failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/ai/scribe")
async def chat_with_scribe(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Transcription and note consolidation agent."""
    if not secrets.gemini_key or not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Gemini-Key or X-Vault-Path missing")
    try:
        agent = Scribe(secrets.gemini_key, secrets.vault_path, secrets.gemini_model or 'gemini-2.5-flash')
        response = await agent.chat(query_data.get("query", ""), history=query_data.get("history"), context=query_data.get("context", ""))
        return {"response": response}
    except Exception as e:
        logger.error(f"Scribe failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/ai/architect")
async def chat_with_architect(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Technical documentation and system meta-analysis agent."""
    if not secrets.gemini_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key missing")
    try:
        agent = Architect(secrets.gemini_key, secrets.gemini_model or 'gemini-2.5-flash')
        response = await agent.chat(query_data.get("query", ""), history=query_data.get("history"), context=query_data.get("context", ""))
        return {"response": response}
    except Exception as e:
        logger.error(f"Architect failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/ai/auditor")
async def chat_with_auditor(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Productivity audit and goal compliance agent."""
    if not secrets.gemini_key or not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key or X-Notion-Key missing")
    try:
        agent = Auditor(secrets.gemini_key, secrets.notion_key, secrets.gemini_model or 'gemini-2.5-flash')
        response = await agent.chat(query_data.get("query", ""), history=query_data.get("history"), context=query_data.get("context", ""))
        return {"response": response}
    except Exception as e:
        logger.error(f"Auditor failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/automations/briefing")
async def run_daily_briefing(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Triggers the daily briefing generation."""
    if not secrets.gemini_key or not secrets.notion_key or not secrets.vault_path:
        raise HTTPException(status_code=401, detail="Required headers missing")
    try:
        automation = DailyBriefing(secrets.gemini_key, secrets.notion_key, secrets.vault_path)
        result = await automation.generate()
        return {"briefing": result}
    except Exception as e:
        logger.error(f"Briefing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/automations/categorizer")
async def run_expense_categorizer(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Auto-categorizes expenses in Notion."""
    if not secrets.gemini_key or not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Gemini-Key or X-Notion-Key missing")
    try:
        automation = ExpenseCategorizer(secrets.gemini_key, secrets.notion_key, secrets.gemini_model or 'gemini-2.5-flash')
        result = await automation.run()
        return result
    except Exception as e:
        logger.error(f"Categorizer failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/automations/cleanup")
async def run_notion_cleanup(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Archives old tasks in Notion."""
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key missing")
    try:
        automation = NotionCleanup(secrets.notion_key)
        result = await automation.run()
        return result
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/automations/habits")
async def run_habit_streak_validation(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Validates habit streaks in Notion."""
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key missing")
    try:
        automation = HabitStreak(secrets.notion_key)
        result = await automation.run()
        return result
    except Exception as e:
        logger.error(f"Habit validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/automations/academics")
async def run_academic_fetcher(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Syncs academic data into Notion."""
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key missing")
    try:
        automation = AcademicFetcher(secrets.notion_key)
        result = await automation.run()
        return result
    except Exception as e:
        logger.error(f"Academic fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/debugger/query")
async def debugger_query(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    RAG-based debugger. Searches the vault and answers based ONLY on retrieved context.
    """
    if not secrets.gemini_key or not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Gemini-Key and X-Vault-Path headers missing")
    
    query = query_data.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing")
    
    try:
        # 1. Search Vault
        vault_manager = VaultManager(secrets.vault_path, secrets.gemini_key)
        search_results = await vault_manager.search(query, limit=10)
        
        context_parts = []
        unique_sources = set()
        for r in search_results:
            context_parts.append(f"FILE: {r['path']}\nCONTENT: {r['content']}")
            unique_sources.add(r["path"])
        
        vault_context = "\n---\n".join(context_parts)
        
        # 2. Prompt Gemini
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=secrets.gemini_key)
        
        system_instruction = f"""
        You are THE DEBUGGER, a RAG-based problem solver for Life OS.
        Your goal is to answer user questions based ONLY on the provided vault context.
        
        If the answer is not in the context, state that clearly.
        Be concise, technical, and objective. No conversational filler.
        
        ### VAULT CONTEXT
        {vault_context}
        """
        
        response = await client.aio.models.generate_content(
            model=secrets.gemini_model or 'gemini-2.5-flash',
            contents=query,
            config=types.GenerateContentConfig(system_instruction=system_instruction)
        )
        
        return {
            "response": response.text,
            "sources": list(unique_sources)
        }
    except Exception as e:
        print(f"[Life OS Sidecar] Debugger Fail: {traceback.format_exc()}")
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
