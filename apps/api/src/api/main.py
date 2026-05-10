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
import re
import json
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

# Add project root to sys.path
root_dir = Path(__file__).parent.parent.parent.absolute()
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("LifeOS")

from urllib.parse import unquote
import uvicorn
import uuid
from datetime import datetime
import sqlite3
from fastapi import FastAPI, Depends, HTTPException, Body, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.obsidian.client import ObsidianClient
from src.domains.oka.service import OkaService
from src.domains.oka.watcher import OkaQueueManager
from src.domains.rag.watcher import RAGWatcherService
from src.domains.rag.indexer import VaultIndexer
from src.domains.rag.vector_store import ChromaManager
from src.domains.ai.tracker import tracker
from src.domains.ai.factory import ModelFactory

from src.domains.obsidian.router import router as obsidian_router
from src.domains.academics.router import router as academics_router

# Global watcher instances

# Global watcher instances
oka_watcher: Optional[OkaQueueManager] = None
rag_watcher: Optional[RAGWatcherService] = None

# Cache the last-seen vault_path so vault endpoints can fall back to it
_cached_vault_path: Optional[str] = None

def _update_rag_status(state: Dict[str, Any]):
    global rag_sync_status
    rag_sync_status.update(state)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    yield
    if oka_watcher:
        logger.info("[OKA] Stopping watcher during shutdown")
        oka_watcher.stop()
    if rag_watcher:
        logger.info("[RAG] Stopping Vault Watcher during shutdown")
        rag_watcher.stop()


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
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
# ── Vault Path Cache Middleware (pure ASGI — does NOT touch request body) ────
from starlette.types import ASGIApp as _ASGIApp, Receive as _Receive, Send as _Send, Scope as _Scope

class _VaultPathCacheMiddleware:
    def __init__(self, app: _ASGIApp):
        self.app = app

    async def __call__(self, scope: _Scope, receive: _Receive, send: _Send):
        if scope["type"] == "http":
            global _cached_vault_path
            for k, v in scope.get("headers", []):
                if k.lower() == b"x-vault-path":
                    vp = v.decode("utf-8", errors="ignore").strip()
                    if vp:
                        _cached_vault_path = vp
                    break
        await self.app(scope, receive, send)

app.add_middleware(_VaultPathCacheMiddleware)


# --- Vault Path Auto-Sync Logic ---

async def _ensure_watcher_path(vault_path: str):
    """Internal helper to ensure watcher is on the right path."""
    global rag_watcher
    if rag_watcher and str(rag_watcher.vault_path) != str(Path(vault_path)):
        logger.info(f"[RAG] Vault path changed from {rag_watcher.vault_path} to {vault_path}. Restarting watcher...")
        rag_watcher.stop()
        rag_watcher = None
        
        # Auto-restart on new path
        chroma = ChromaManager()
        indexer = VaultIndexer(chroma)
        rag_watcher = RAGWatcherService(indexer, vault_path)
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
        rag_watcher.start(loop, status_callback=_update_rag_status)

async def validate_vault_path(vault_path: Optional[str] = None, secrets: AppSecrets = Depends(get_app_secrets)):
    """Dependency to ensure vault path is valid and watcher is synced."""
    effective_vault_path = secrets.vault_path or vault_path
    
    if not effective_vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    # Auto-sync the background watcher to the header path
    await _ensure_watcher_path(effective_vault_path)
    return effective_vault_path

# Mount routers
app.include_router(obsidian_router, prefix="/api", dependencies=[Depends(validate_vault_path)])
app.include_router(academics_router, prefix="/api", dependencies=[Depends(validate_vault_path)])


@app.get("/api/health")
async def health_check():
    """
    Standard health check for the sidecar.
    """
    return {"status": "ok", "version": "0.1.0"}

@app.get("/api/ai/rate-limits")
async def get_rate_limits():
    """Returns the current captured rate limit state for all providers."""
    return tracker.get_all()

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
        decoded_path = unquote(path)
        result = client.read_note(decoded_path)
        if result is None:
            raise HTTPException(status_code=404, detail="File not found")
        return result
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
        decoded_path = unquote(path)
        full_path = Path(secrets.vault_path) / decoded_path
        os.makedirs(full_path.parent, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/obsidian/files/{path:path}")
async def delete_obsidian_item(path: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Deletes a file or directory from the Obsidian vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    try:
        client = ObsidianClient(secrets.vault_path)
        decoded_path = unquote(path)
        success = client.delete_item(decoded_path)
        if not success:
            # Check if it was a security error (client prints it) or just not found
            raise HTTPException(status_code=404, detail="Item not found or deletion failed (Security/Lock)")
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
    """Uploads a file for reasoning context. Currently multi-provider support is limited."""
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI API Key missing")
    
    # Save temporary file
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        if secrets.ai_provider == "google":
            import google.generativeai as genai
            genai.configure(api_key=secrets.ai_key)
            uploaded_file = await asyncio.to_thread(genai.upload_file, temp_path)
            
            # Wait for file to process
            max_retries = 30
            for _ in range(max_retries):
                file_info = await asyncio.to_thread(genai.get_file, uploaded_file.name)
                if file_info.state.name == "ACTIVE":
                    break
                if file_info.state.name == "FAILED":
                    raise HTTPException(status_code=500, detail="File processing failed in Gemini")
                await asyncio.sleep(2)
            else:
                raise HTTPException(status_code=500, detail="File processing timed out")

            return {"file_uri": uploaded_file.uri, "name": file.filename}
        else:
            return {"file_uri": str(Path(temp_path).absolute()), "name": file.filename, "note": "Provider does not support direct file upload yet."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path) and secrets.ai_provider == "google":
            os.remove(temp_path)

@app.post("/api/ai/test-connection")
async def test_ai_connection(
    payload: Dict[str, str] = Body({"target": "primary"}),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Tests if the specified AI tier configuration is valid."""
    target = payload.get("target", "primary")
    
    if target == "primary":
        provider, model, key = secrets.ai_provider, secrets.ai_model, secrets.ai_key
    elif target == "planner":
        provider, model, key = secrets.planner_provider, secrets.planner_model, secrets.planner_key
    else: # utility
        provider, model, key = secrets.utility_provider, secrets.utility_model, secrets.utility_key

    if not key:
        return {"success": False, "error": f"API Key for {target} is missing"}
    
    try:
        from src.domains.ai.factory import ModelFactory
        from langchain_core.messages import HumanMessage
        
        llm = ModelFactory.get_model(
            provider=provider,
            model_name=model,
            api_key=key,
            temperature=0.1
        )
        
        response = await llm.ainvoke([HumanMessage(content="Hello. Respond with exactly one word: 'Connected'.")])
        content = response.content.strip() if hasattr(response, 'content') else str(response)
        
        return {"success": True, "message": f"{target.capitalize()} Tier: {content}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- OKA (Autonomous Ingestion) Endpoints ---

@app.post("/api/oka/process")
async def oka_process_manual(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Phase 1: Pure Detection. No AI usage."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
    
    file_path = payload.get("file_path")
    
    try:
        service = OkaService(secrets)
        return await service.detect_curriculum(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/plan")
async def oka_generate_plan(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Phase 2: AI Planning with locked curriculum."""
    if not secrets.ai_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="AI Key and Vault Path are required")
    
    try:
        si_path = OkaService.resolve_si_path()
        service = OkaService(secrets)
        file_path = payload.get("file_path")
        curriculum = payload.get("curriculum", {})
        target_hub_id = payload.get("target_hub_id")
        return await service.generate_plan(file_path, str(si_path), curriculum, target_hub_id=target_hub_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/confirm")
async def oka_confirm_plan(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Confirms an existing OKA plan and trigger deployment."""
    session_id = payload.get("session_id")
    command = payload.get("command", "Confirm Final Plan & Proceed Batch 1")
    curriculum_override = payload.get("curriculum_override")
    anchored_hub_id = payload.get("anchored_hub_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        service = OkaService(secrets)
        results = await service.confirm_plan(
            session_id, 
            command=command, 
            curriculum_override=curriculum_override, 
            anchored_hub_id=anchored_hub_id
        )
        
        # Move file to _Generated only when all batches are done
        if not results.get("has_more") and not session_id.startswith("text_"):
            path = Path(session_id)
            if path.exists():
                processed_dir = path.parent / "_Generated"
                processed_dir.mkdir(exist_ok=True)
                new_path = processed_dir / path.name
                if new_path.exists():
                    new_path = processed_dir / f"{int(time.time())}_{path.name}"
                path.rename(new_path)

        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        error_details = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"OKA Confirmation failed: {str(e)}\n\nTraceback:\n{error_details}")

@app.get("/api/oka/paused-sessions")
async def oka_get_paused_sessions(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns all sessions that were paused due to a rate limit and have saved progress."""
    service = OkaService(secrets)
    return {"paused_sessions": service.get_paused_sessions()}

@app.post("/api/oka/resume")
async def oka_resume_paused_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Resumes a session that was paused due to a rate limit.
    Picks up from the exact batch where generation stopped.
    """
    session_id = payload.get("session_id")
    curriculum_override = payload.get("curriculum_override")

    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        service = OkaService(secrets)
        result = await service.resume_paused_session(
            session_id=session_id,
            curriculum_override=curriculum_override,
        )
        # Move file to archive only when fully done
        if not result.get("has_more") and result.get("status") != "rate_limited" and not session_id.startswith("text_"):
            path = Path(session_id)
            if path.exists():
                processed_dir = path.parent / "_Generated"
                processed_dir.mkdir(exist_ok=True)
                new_path = processed_dir / path.name
                if new_path.exists():
                    new_path = processed_dir / f"{int(time.time())}_{path.name}"
                path.rename(new_path)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OKA Resume failed: {str(e)}")

@app.post("/api/oka/swap-key")
async def oka_swap_api_key(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Hot-swaps the AI API key on the live OkaService instance.
    Use this after a rate limit to switch to a backup key without restarting.
    The new key is used immediately for all subsequent LLM calls.
    """
    new_key = payload.get("api_key")
    if not new_key:
        raise HTTPException(status_code=400, detail="api_key is required")
    try:
        service = OkaService(secrets)
        service.swap_api_key(new_key)
        return {"status": "ok", "message": "API key swapped. Resume generation now."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/watcher/toggle")
async def oka_watcher_toggle(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Starts or updates the OKA Queue Manager."""
    global oka_watcher
    
    if not secrets.ai_key or not secrets.vault_path or not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="AI Key, Vault Path, and Inbox Path are required")
    
    # If the watcher exists but the path changed, kill it.
    if oka_watcher and str(oka_watcher.inbox_path.absolute()) != str(Path(secrets.inbox_path).absolute()):
        oka_watcher.stop()
        oka_watcher = None

    # Always keep the watcher alive if we have settings, just toggle its auto_process state
    if not oka_watcher:
        try:
            si_path = OkaService.resolve_si_path()
        except FileNotFoundError as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        service = OkaService(secrets)
        oka_watcher = OkaQueueManager(service, secrets.inbox_path, str(si_path))
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        oka_watcher.start(loop, auto_process=secrets.auto_deploy)
        logger.info(f"[OKA] QueueManager started for inbox: {secrets.inbox_path} | Auto: {secrets.auto_deploy}")
    else:
        oka_watcher.update_settings(auto_process=secrets.auto_deploy)
        
    return {"status": "watcher_active", "auto_deploy": secrets.auto_deploy, "inbox": secrets.inbox_path}

@app.get("/api/oka/queue/status")
async def oka_queue_status(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns the current detailed queue status."""
    global oka_watcher
    
    if oka_watcher and secrets.inbox_path and str(oka_watcher.inbox_path.absolute()) != str(Path(secrets.inbox_path).absolute()):
        oka_watcher.stop()
        oka_watcher = None

    if not oka_watcher and secrets.ai_key and secrets.vault_path and secrets.inbox_path:
        try:
            si_path = OkaService.resolve_si_path()
        except FileNotFoundError:
            return {"status": "offline", "pending_files": [], "manual_status": dict(OkaService._status), "error": "OKA.md not found"}
        
        service = OkaService(secrets)
        oka_watcher = OkaQueueManager(service, secrets.inbox_path, str(si_path))
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        oka_watcher.start(loop, auto_process=secrets.auto_deploy)
        logger.info(f"[OKA] Watcher Auto-started for inbox: {secrets.inbox_path} | Auto: {secrets.auto_deploy}")
        
    if not oka_watcher:
        return {"status": "offline", "pending_files": [], "manual_status": dict(OkaService._status)}
        
    # Sync settings only when the value actually changed (avoids log spam)
    if oka_watcher.auto_process != secrets.auto_deploy:
        oka_watcher.update_settings(auto_process=secrets.auto_deploy)
    
    status_dict = oka_watcher.get_status()
    status_dict["manual_status"] = dict(OkaService._status)
    return status_dict

@app.get("/api/oka/generated")
async def oka_list_generated(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists files that have been successfully generated."""
    if not secrets.inbox_path:
        return {"files": []}
    
    generated_dir = Path(secrets.inbox_path) / "_Generated"
    if not generated_dir.exists() or not generated_dir.is_dir():
        return {"files": []}
        
    files = []
    supported_extensions = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
    try:
        import json
        for f in generated_dir.iterdir():
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in supported_extensions:
                hub_path = None
                meta_file = f.with_suffix(".oka.json")
                if meta_file.exists():
                    try:
                        with open(meta_file, "r") as mf:
                            meta = json.load(mf)
                            hub_path = meta.get("hub_path")
                    except Exception: pass
                
                files.append({
                    "name": f.name,
                    "path": str(f.absolute()),
                    "size": f.stat().st_size,
                    "suffix": f.suffix.lower(),
                    "mtime": f.stat().st_mtime,
                    "hub_path": hub_path
                })
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x["mtime"], reverse=True)
    except Exception as e:
        logger.error(f"Error: {e}")
    
    return {"files": files}

@app.get("/api/oka/inbox")
async def oka_list_inbox(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists files currently in the Inbox folder."""
    if not secrets.inbox_path or secrets.inbox_path.strip() == "":
        return {"files": []}
    
    inbox = Path(secrets.inbox_path)
    if not inbox.exists():
        return {"files": []}
    
    if not inbox.is_dir():
        return {"files": []}
    
    files = []
    supported_extensions = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
    try:
        generated_dir = inbox / "_Generated"
        for f in inbox.rglob("*"):
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in supported_extensions:
                # Ignore files in the _Generated archive
                if generated_dir in f.parents or str(f.absolute()).startswith(str(generated_dir.absolute())):
                    continue
                    
                files.append({
                    "name": f.name,
                    "path": str(f.absolute()),
                    "size": f.stat().st_size,
                    "suffix": f.suffix.lower()
                })
    except Exception as e:
        logger.error(f"Error: {e}")
    
    return {"files": files}

@app.get("/api/oka/hubs")
async def oka_list_hubs(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists available study hubs."""
    service = OkaService(secrets)
    return {"hubs": service.list_planner_hubs()}

@app.get("/api/oka/hubs/{hub_id}/notes")
async def oka_list_hub_notes(
    hub_id: str,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists atomic notes for a specific hub."""
    service = OkaService(secrets)
    return {"notes": service.list_atomic_notes(hub_id)}

@app.post("/api/practice/explain")
async def explain_question(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates a detailed mini-lesson for a given quiz question using the configured AI."""
    from src.domains.ai.factory import ModelFactory
    ai_key = secrets.planner_key or secrets.ai_key
    if not ai_key:
        raise HTTPException(status_code=400, detail="AI Key required")

    question = payload.get("question", "")
    q_type = payload.get("type", "")
    answer = payload.get("answer", "")
    explanation = payload.get("explanation", "")
    context = payload.get("context", "")

    provider = secrets.planner_provider or secrets.ai_provider or "google"
    model = secrets.planner_model or secrets.ai_model or "gemini-2.0-flash"

    try:
        llm = ModelFactory.get_model(provider=provider, model_name=model, api_key=ai_key, temperature=0.7, max_tokens=2000)

        sys_prompt = """You are a world-class tutor. A student just answered a quiz question and wants a deep, crystal-clear explanation of the underlying concept.

Your mini-lesson must:
1. EXPLAIN the core concept tested — assume the student struggles with it
2. USE clear analogies and real-world examples to make it intuitive
3. BREAK DOWN the reasoning step by step
4. HIGHLIGHT common mistakes and misconceptions
5. END with a 1-sentence memory hook (bold it)

Format your response in clean markdown. Use headers, bullet points, and bold text effectively. Be thorough but engaging — no fluff."""

        human_prompt = f"""Quiz Question: {question}

Question Type: {q_type}
Correct Answer: {answer}
{f'Existing Explanation: {explanation}' if explanation else ''}
{f'Additional Context: {context}' if context else ''}

Generate the mini-lesson now."""

        res = await llm.ainvoke([("system", sys_prompt), ("human", human_prompt)])
        return {"lesson": res.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/practice/generate")
async def generate_practice_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates a practice session (quiz) based on a Hub."""
    planner_key = secrets.planner_key or secrets.ai_key
    if not planner_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Planner/AI Key and Vault Path are required")

    hub_id = payload.get("hub_id")
    config = payload.get("config", {})

    if not hub_id:
        raise HTTPException(status_code=400, detail="hub_id is required")

    service = OkaService(secrets)
    try:        return await service.generate_practice(hub_id, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/practice/status")
async def get_practice_status():
    """Returns the current generation status for all active sessions."""
    return {"status": dict(OkaService._status)}

@app.get("/api/practice/list")
async def list_practice_sessions(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists all stored practice sessions by scanning the vault directly."""
    if not secrets.vault_path:
        return {"practices": [], "_debug": {"error": "vault_path missing"}}
    
    service = OkaService(secrets)
    try:
        practices = service.list_practices()
        return {"practices": practices}
    except Exception as e:
        return {"practices": [], "error": str(e)}


@app.post("/api/practice/get")
async def get_practice_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Gets the raw JSON payload of a practice session by its path."""
    path = payload.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="path is required")
        
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice not found")
        
    try:
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
        import re
        import json
        json_match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
        if json_match:
            questions = json.loads(json_match.group(1))
            return {"questions": questions}
        else:
            raise HTTPException(status_code=500, detail="No valid JSON data found in practice file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/practice/score")
async def update_practice_score(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Updates the score of a completed practice."""
    path = payload.get("path")
    score = payload.get("score")
    if not path or score is None:
        raise HTTPException(status_code=400, detail="path and score are required")
        
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")
        
    try:
        import yaml as _yaml
        content = p.read_text(encoding="utf-8")
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL | re.MULTILINE)
        if yaml_match:
            data = _yaml.safe_load(yaml_match.group(1)) or {}
            data["score"] = f"{score}%"
            data["completed"] = True
            new_yaml = _yaml.dump(data, sort_keys=False)
            # Find the end of the YAML block more reliably
            # The regex matched the whole --- ... --- block including the final ---
            new_content = f"---\n{new_yaml}---\n" + content[yaml_match.end():]
            p.write_text(new_content, encoding="utf-8")
            return {"status": "success"}
        else:
            raise HTTPException(status_code=500, detail="No frontmatter found in practice file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/practice/delete")
async def delete_practice_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Deletes a practice session file from the vault."""
    path = payload.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="path is required")
        
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")
        
    try:
        # Security check: ensure the path is within the vault
        if not str(p).startswith(str(secrets.vault_path)):
             raise HTTPException(status_code=403, detail="Cannot delete files outside the vault")
             
        p.unlink()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/practice/log")
async def log_practice(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs individual question practice attempts."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
        return {"status": "ignored", "reason": "db not initialized"}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.execute(
            "INSERT INTO practice_log (id, note_id, question_type, is_correct, time_taken_seconds, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (
                str(uuid.uuid4()),
                payload.get("note_id", "unknown"),
                payload.get("question_type", "unknown"),
                bool(payload.get("is_correct", False)),
                payload.get("time_taken_seconds", 0),
                datetime.now().isoformat()
            )
        )
        
        # Also handle SRS logic here if requested
        note_id = payload.get("note_id")
        is_correct = bool(payload.get("is_correct", False))
        if note_id:
            from datetime import timedelta
            srs_row = conn.execute("SELECT review_count, consecutive_correct, easiness_factor, interval_days FROM note_srs WHERE note_id = ?", (note_id,)).fetchone()
            if not srs_row:
                review_count, consec_correct, ef, interval = 0, 0, 2.5, 0
            else:
                review_count, consec_correct, ef, interval = srs_row
                
            q = 4 if is_correct else 1
            
            if q >= 3:
                if review_count == 0:
                    interval = 1
                elif review_count == 1:
                    interval = 6
                else:
                    interval = int(round(interval * ef))
                review_count += 1
                consec_correct += 1
            else:
                review_count = 0
                interval = 1
                consec_correct = 0
                
            ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            if ef < 1.3:
                ef = 1.3
                
            next_date = (datetime.now() + timedelta(days=interval)).isoformat()
            
            conn.execute("""
                INSERT INTO note_srs (note_id, review_count, consecutive_correct, easiness_factor, interval_days, next_review_date)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(note_id) DO UPDATE SET
                    review_count=excluded.review_count,
                    consecutive_correct=excluded.consecutive_correct,
                    easiness_factor=excluded.easiness_factor,
                    interval_days=excluded.interval_days,
                    next_review_date=excluded.next_review_date
            """, (note_id, review_count, consec_correct, ef, interval, next_date))
            
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/obsidian/log-visit")
async def log_note_visit(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs the time spent on an atomic note."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
        return {"status": "ignored", "reason": "db not initialized"}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.execute(
            "INSERT INTO study_telemetry (id, note_path, duration_seconds, timestamp) VALUES (?, ?, ?, ?)",
            (
                str(uuid.uuid4()),
                payload.get("note_path", "unknown"),
                payload.get("duration_seconds", 0),
                datetime.now().isoformat()
            )
        )
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/study/log-session")
async def log_study_session(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs a completed study/focus session."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
        return {"status": "ignored", "reason": "db not initialized"}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.execute(
            "INSERT INTO study_sessions (id, hub_id, duration_seconds, timestamp, mode) VALUES (?, ?, ?, ?, ?)",
            (
                str(uuid.uuid4()),
                payload.get("hub_id", "unknown"),
                payload.get("duration_seconds", 0),
                datetime.now().isoformat(),
                payload.get("mode", "focus")
            )
        )
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/study/log-practice")
async def log_practice_result(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs a practice summary performance."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
        return {"status": "ignored", "reason": "db not initialized"}
    
    try:
        conn = sqlite3.connect(str(db_path))
        # Simple summary log for now
        conn.execute(
            "INSERT INTO practice_log (id, hub_id, note_path, question_type, is_correct, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (
                str(uuid.uuid4()),
                payload.get("hub_id", "unknown"),
                payload.get("note_path", "unknown"),
                "summary",
                1 if payload.get("score", 0) == payload.get("total_questions", 1) else 0,
                datetime.now().isoformat()
            )
        )
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/practice/analytics")
async def get_practice_analytics(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Retrieves analytics for the dashboard based on real practice logs."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
         return {"modalities": {}, "weakest_concepts": []}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        
        # Weakest Modalities
        modality_rows = conn.execute("""
            SELECT question_type, COUNT(*) as attempts, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
            FROM practice_log
            GROUP BY question_type
        """).fetchall()
        
        modalities = {}
        for row in modality_rows:
            q_type = row["question_type"]
            accuracy = row["correct"] / row["attempts"] if row["attempts"] > 0 else 0
            modalities[q_type] = accuracy
            
        # Weakest Concepts
        concept_rows = conn.execute("""
            SELECT note_id, COUNT(*) as attempts, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
            FROM practice_log
            GROUP BY note_id
            HAVING attempts > 0
            ORDER BY correct * 1.0 / attempts ASC
            LIMIT 5
        """).fetchall()
        
        weakest_concepts = []
        for row in concept_rows:
            weakest_concepts.append({
                "note_id": row["note_id"],
                "accuracy": row["correct"] / row["attempts"]
            })
            
        conn.close()
        return {
            "modalities": modalities,
            "weakest_concepts": weakest_concepts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/study/history")
async def get_study_history(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Retrieves all study sessions and telemetry for the calendar/dashboard."""
    if not secrets.inbox_path:
        return {"sessions": [], "telemetry": []}
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
        return {"sessions": [], "telemetry": [], "practice": []}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        
        sessions = [dict(r) for r in conn.execute("SELECT * FROM study_sessions ORDER BY timestamp DESC").fetchall()]
        telemetry = [dict(r) for r in conn.execute("SELECT * FROM study_telemetry ORDER BY timestamp DESC LIMIT 100").fetchall()]
        practice = [dict(r) for r in conn.execute("SELECT * FROM practice_log ORDER BY timestamp DESC LIMIT 100").fetchall()]
        
        conn.close()
        return {
            "sessions": sessions,
            "telemetry": telemetry,
            "practice": practice
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/practice/srs")
async def get_srs_data(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Retrieves SRS review dates for notes."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "oka_queue.db"
    if not db_path.exists():
         return {"srs": {}}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT note_id, next_review_date FROM note_srs").fetchall()
        srs = {r["note_id"]: r["next_review_date"] for r in rows}
        conn.close()
        return {"srs": srs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/explain")
async def oka_explain_concept(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Explains a specific concept from a PDF or Note using AI."""
    relative_path = payload.get("path", "")
    selection = payload.get("selection", "")
    page_num = payload.get("page", 1)
    user_question = payload.get("question", "")
    is_pdf = relative_path.lower().endswith(".pdf")
    
    logger.info(f"[AI Explain] Request for {relative_path} (is_pdf={is_pdf})")
    
    if not secrets.ai_key:
        raise HTTPException(status_code=401, detail="AI API Key missing in Settings")
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Obsidian Vault Path not configured")

    # Handle path resolution
    decoded_path = unquote(relative_path)
    full_path = Path(secrets.vault_path) / decoded_path
    
    if not full_path.exists():
        # Case-insensitive fallback
        parent = full_path.parent
        if parent.exists():
            for f in parent.iterdir():
                if f.name.lower() == full_path.name.lower():
                    full_path = f
                    break
    
    if not full_path.exists() and relative_path:
        raise HTTPException(status_code=404, detail=f"File not found in vault: {decoded_path}")

    try:
        from src.domains.ai.factory import ModelFactory
        from langchain_core.messages import HumanMessage
        
        context_content = ""
        if is_pdf and full_path.exists():
            from langchain_community.document_loaders import PyPDFLoader
            loader = PyPDFLoader(str(full_path))
            pages = loader.load_and_split()
            if page_num > len(pages):
                context_content = pages[-1].page_content if pages else ""
            else:
                context_content = pages[page_num - 1].page_content
        elif full_path.exists() and full_path.suffix == ".md":
            context_content = full_path.read_text(encoding="utf-8")
        
        # Build model
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider or "google",
            model_name=secrets.ai_model or "gemini-1.5-pro",
            api_key=secrets.ai_key,
            temperature=0.2
        )
        
        # Load SI
        si_path = root_dir / ".system" / "prompts" / "pedagogical_assistant.md"
        si_content = si_path.read_text(encoding="utf-8") if si_path.exists() else "You are a helpful academic assistant."
        
        # Build messages
        user_prompt = f"""
        # CONTEXT
        Document: {relative_path}
        Location: {"Page " + str(page_num) if is_pdf else "Line Selection"}
        
        # SOURCE MATERIAL Snippet
        {context_content[:15000]}
        
        # USER REQUEST
        Selection: "{selection}"
        Goal: {user_question if user_question else "Explain this concept perfectly."}
        """
        
        messages = [
            SystemMessage(content=si_content),
            HumanMessage(content=user_prompt)
        ]
        res = await llm.ainvoke(messages)
        return {"answer": res.content}
    except Exception as e:
        logger.error(f"[AI Explain] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/quick-questions")
async def oka_quick_questions(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates 3 quick retrieval practice questions based on a selection."""
    relative_path = payload.get("path", "")
    selection = payload.get("selection", "")
    page_num = payload.get("page", 1)
    is_pdf = relative_path.lower().endswith(".pdf")
    
    if not selection:
        raise HTTPException(status_code=400, detail="Selection is required")

    try:
        from src.domains.ai.factory import ModelFactory
        from langchain_core.messages import HumanMessage
        
        # Build model
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider or "google",
            model_name=secrets.ai_model or "gemini-1.5-pro",
            api_key=secrets.ai_key,
            temperature=0.7 # Higher temperature for creative questions
        )
        
        # Load SI
        si_path = root_dir / ".system" / "prompts" / "pedagogical_assistant.md"
        si_content = si_path.read_text(encoding="utf-8") if si_path.exists() else "You are a helpful academic assistant."
        
        # Refine SI for questions
        si_content += "\n\nCRITICAL: For this request, you must output exactly 3 retrieval practice questions (L1, L2, L3) based on the selection. Do not provide answers."

        user_prompt = f"Selection for Questions: \"{selection}\""
        
        messages = [
            SystemMessage(content=si_content),
            HumanMessage(content=user_prompt)
        ]
        res = await llm.ainvoke(messages)
        return {"answer": res.content}
    except Exception as e:
        logger.error(f"[Quick Questions] Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/chat")
async def oka_chat(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Context-aware chat related to a selection."""
    path = payload.get("path", "")
    selection = payload.get("selection", "")
    page_num = payload.get("page", 1)
    messages_input = payload.get("messages", []) # List of {role, content}
    
    try:
        # Resolve Context
        is_pdf = path.lower().endswith('.pdf')
        context_content = ""
        relative_path = os.path.relpath(path, secrets.vault_path) if secrets.vault_path else path
        
        if is_pdf:
            pdf_service = PdfService(secrets.vault_path)
            context_content = pdf_service.get_page_text(path, page_num)
        else:
            abs_path = os.path.join(secrets.vault_path, path) if secrets.vault_path else path
            if os.path.exists(abs_path):
                with open(abs_path, 'r', encoding='utf-8') as f:
                    context_content = f.read()

        llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.4
        )
        
        # Load SI
        si_path = root_dir / ".system" / "prompts" / "pedagogical_assistant.md"
        si_content = si_path.read_text(encoding="utf-8") if si_path.exists() else "You are a helpful academic assistant."
        
        # Build Chat Messages
        chat_messages = [SystemMessage(content=si_content)]
        
        # Inject Context in the first user message if not already there or as a system reminder
        context_reminder = f"""
[SYSTEM CONTEXT]
Document: {relative_path}
Selection: "{selection}"
Source Content: {context_content[:10000]}
"""
        chat_messages.append(SystemMessage(content=context_reminder))
        
        for msg in messages_input:
            if msg['role'] == 'user':
                chat_messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                chat_messages.append(AIMessage(content=msg['content']))
        
        res = await llm.ainvoke(chat_messages)
        return {"answer": res.content}
    except Exception as e:
        logger.error(f"Error in oka_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/oka/interactive-quiz")
async def oka_interactive_quiz(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Generates a structured JSON quiz for the interactive sidebar."""
    selection = payload.get("selection", "")
    
    try:
        llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.2
        )

        
        prompt = f"""
        You are an academic examiner. Generate a structured JSON quiz based on the following selection.
        
        SELECTION: "{selection}"
        
        REQUIREMENTS:
        1. Output exactly 3 questions.
        2. Questions must be a mix of Multiple Choice and True/False.
        3. Format MUST be a JSON array of objects with:
           - "question": string
           - "type": "multiple-choice" | "true-false"
           - "options": string[] (empty for true-false)
           - "answer": string (the exact correct option or "True"/"False")
           - "explanation": string (why this is correct)
        
        Return ONLY valid JSON.
        """
        
        res = await llm.ainvoke([HumanMessage(content=prompt)])
        # Clean potential markdown block
        clean_res = res.content.replace('```json', '').replace('```', '').strip()
        quiz = json.loads(clean_res)
        return {"questions": quiz}
    except Exception as e:
        logger.error(f"Error in interactive quiz: {str(e)}")
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
        raise HTTPException(status_code=500, detail=str(e))

# --- RAG Endpoints ---

rag_sync_status = {"status": "idle", "progress": 0, "total": 0, "message": ""}

@app.post("/api/rag/watcher/toggle")
async def rag_watcher_toggle(secrets: AppSecrets = Depends(get_app_secrets)):
    """Starts or stops the Global Obsidian Watcher for RAG."""
    global rag_watcher
    
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
        
    if not rag_watcher:
        chroma = ChromaManager()
        indexer = VaultIndexer(chroma)
        rag_watcher = RAGWatcherService(indexer, secrets.vault_path)
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        # The service will now run periodic syncs and can be given the global status callback
        # We need to make sure initial_sync (called by periodic sync) uses this callback.
        # I will update the start method to accept the callback.
        rag_watcher.start(loop, status_callback=_update_rag_status)
        return {"status": "started", "vault": secrets.vault_path}
    else:
        rag_watcher.stop()
        rag_watcher = None
        return {"status": "stopped"}

@app.get("/api/rag/sync-status")
async def get_rag_sync_status():
    """Returns the current status of the vault sync."""
    return rag_sync_status

@app.post("/api/rag/sync")
async def rag_sync_vault(secrets: AppSecrets = Depends(get_app_secrets)):
    """Forces a full re-index of the Obsidian Vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
        
    global rag_sync_status, rag_watcher
    if rag_sync_status.get("status") == "syncing":
        return {"status": "sync_started", "message": "A sync is already in progress."}
    
    # Optimistically set status so immediate UI polls see it
    rag_sync_status.update({"status": "syncing", "message": "Preparing to scan vault..."})
    
    # If a watcher is already active, use its indexer/service to perform the sync
    if rag_watcher:
        logger.info("[RAG] Triggering force sync via active watcher")
        asyncio.create_task(asyncio.to_thread(rag_watcher.initial_sync, _update_rag_status, True))
        return {"status": "sync_started", "message": "Vault force sync started using active watcher."}
        
    def _status_callback(state: Dict[str, Any]):
        global rag_sync_status
        rag_sync_status.update(state)

    def run_sync(path: str):
        chroma = ChromaManager()
        indexer = VaultIndexer(chroma)
        service = RAGWatcherService(indexer, path)
        service.initial_sync(status_callback=_status_callback, force=True)
        
    # pyre-ignore[6]
    asyncio.create_task(asyncio.to_thread(run_sync, secrets.vault_path))
    return {"status": "sync_started", "message": "Vault force sync started in the background."}

notion_mirror_status = {"status": "idle", "progress": 0, "total": 0, "message": ""}

@app.get("/api/notion/sync-mirror/status")
async def get_sync_notion_mirror_status():
    """Returns the current status of the Notion mirror sync."""
    return notion_mirror_status

@app.post("/api/notion/sync-mirror")
async def sync_notion_mirror(secrets: AppSecrets = Depends(get_app_secrets)):
    """Triggers the background service to mirror Notion to Obsidian."""
    if not secrets.notion_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Notion Key and Vault Path are required")
        
    global notion_mirror_status
    if notion_mirror_status.get("status") == "syncing":
        return {"status": "mirror_started", "message": "A mirror sync is already in progress."}
        
    # Optimistically set status so immediate UI polls see it
    notion_mirror_status.update({"status": "syncing", "message": "Preparing to mirror Notion..."})
        
    from src.domains.notion.mirror_service import NotionMirrorService
    
    def _status_callback(state: Dict[str, Any]):
        global notion_mirror_status
        notion_mirror_status.update(state)
    
    def run_mirror(key: str, path: str):
        service = NotionMirrorService(key, path)
        # Using asyncio.run inside the thread since sync_all_databases is async
        asyncio.run(service.sync_all_databases(status_callback=_status_callback))
        
    # pyre-ignore[6]
    asyncio.create_task(asyncio.to_thread(run_mirror, secrets.notion_key, secrets.vault_path))
    return {"status": "mirror_started", "message": "Notion mirror sync started in the background."}



# ── Reference Vault Endpoints ─────────────────────────────────────────────────

# Track in-progress vault generations
_vault_status: Dict[str, str] = {}

@app.post("/api/practice/vault/upload")
async def vault_upload_source(
    hub_id: str = Body(...),
    source_name: str = Body(...),
    source_text: str = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """
    Runs the full extract→classify→solve→write pipeline on provided text.
    Returns the vault file path and question count.
    """
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI Key required (configure in Settings)")

    # Derive vault_path from header or from settings store
    vault_path = secrets.vault_path
    if not vault_path:
        vault_path = _cached_vault_path
    if not vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured. Open Settings and set your Obsidian vault path.")

    try:
        from src.domains.oka.reference_vault import ReferenceVaultPipeline
        from src.domains.oka.governor import governor
        from src.domains.ai.factory import ModelFactory

        llm = ModelFactory.get_model(
            provider=secrets.ai_provider or "google",
            model_name=secrets.ai_model or "gemini-1.5-flash",
            api_key=secrets.ai_key,
            temperature=0.1,
        )

        job_id = f"vault_{hub_id}_{int(time.time())}"
        _vault_status[job_id] = "Starting..."

        pipeline = ReferenceVaultPipeline(llm, Path(vault_path), governor)

        def _cb(msg: str):
            _vault_status[job_id] = msg

        result = await pipeline.run(hub_id, source_name, source_text, _cb)
        _vault_status.pop(job_id, None)
        return {**result, "job_id": job_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/practice/vault/upload-file")
async def vault_upload_file(
    hub_id: str = Query(..., description="Hub ID to store questions under"),
    file: UploadFile = File(...),
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """Accepts a binary file upload (PDF/image/txt), extracts text, then runs the pipeline."""
    import tempfile, os, base64
    from src.domains.ai.factory import ModelFactory
    from src.domains.oka.reference_vault import ReferenceVaultPipeline
    from src.domains.oka.governor import governor
    from langchain_core.messages import HumanMessage

    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI Key required (configure in Settings)")

    vault_path = secrets.vault_path or _cached_vault_path
    if not vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured. Open Settings and set your Obsidian vault path.")

    suffix = Path(file.filename or "upload.txt").suffix.lower()

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        source_text = ""

        if suffix == ".pdf":
            # Attempt 1: pypdf (fast, pure-python, no deps)
            try:
                import pypdf
                reader = pypdf.PdfReader(tmp_path)
                pages_text = [page.extract_text() or "" for page in reader.pages]
                source_text = "\n\n".join(t for t in pages_text if t.strip())
            except Exception:
                source_text = ""
            # Attempt 2: pdfminer
            if not source_text.strip():
                try:
                    from pdfminer.high_level import extract_text as _pdfminer
                    source_text = _pdfminer(tmp_path) or ""
                except Exception:
                    source_text = ""
            # Attempt 3: langchain PyPDFLoader
            if not source_text.strip():
                try:
                    from langchain_community.document_loaders import PyPDFLoader
                    pages = PyPDFLoader(tmp_path).load_and_split()
                    source_text = "\n\n".join(p.page_content for p in pages)
                except Exception:
                    source_text = ""
            # Attempt 4: Vision LLM for scanned PDFs
            if not source_text.strip():
                try:
                    with open(tmp_path, "rb") as _fh:
                        b64 = base64.b64encode(_fh.read()).decode()
                    _vision_llm = ModelFactory.get_model(
                        provider="google",
                        model_name="gemini-1.5-flash",
                        api_key=secrets.ai_key,
                        temperature=0.1,
                    )
                    _res = await _vision_llm.ainvoke([HumanMessage(content=[
                        {"type": "text", "text": "Extract ALL visible text from this PDF verbatim. Preserve question numbering and structure."},
                        {"type": "image_url", "image_url": {"url": f"data:application/pdf;base64,{b64}"}},
                    ])])
                    source_text = _res.content or ""
                except Exception:
                    source_text = ""
            if not source_text.strip():
                raise HTTPException(status_code=422, detail="Could not extract text from PDF. Try a text-based PDF or paste the content manually.")

        elif suffix in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
            with open(tmp_path, "rb") as f_img:
                b64 = base64.b64encode(f_img.read()).decode()
            _vision_llm = ModelFactory.get_model(
                provider=secrets.ai_provider or "google",
                model_name=secrets.ai_model or "gemini-1.5-flash",
                api_key=secrets.ai_key,
                temperature=0.1,
            )
            _res = await _vision_llm.ainvoke([HumanMessage(content=[
                {"type": "text", "text": "Extract ALL text from this image verbatim. Preserve all questions and numbering."},
                {"type": "image_url", "image_url": {"url": f"data:image/{suffix[1:]};base64,{b64}"}},
            ])])
            source_text = _res.content or ""

        else:
            source_text = open(tmp_path, encoding="utf-8", errors="ignore").read()

        try:
            os.unlink(tmp_path)
        except Exception:
            pass

        if not source_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from file.")

        llm = ModelFactory.get_model(
            provider=secrets.ai_provider or "google",
            model_name=secrets.ai_model or "gemini-1.5-flash",
            api_key=secrets.ai_key,
            temperature=0.1,
        )
        pipeline = ReferenceVaultPipeline(llm, Path(vault_path), governor)
        result = await pipeline.run(hub_id, file.filename or "upload", source_text)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/practice/vault/list")
async def vault_list(
    hub_id: str,
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """Lists all reference vault files for a hub."""
    if not secrets.vault_path:
        return {"vaults": []}
    try:
        from src.domains.oka.reference_vault import VaultWriter
        writer = VaultWriter(Path(secrets.vault_path))
        return {"vaults": writer.list_vaults(hub_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/practice/vault/questions")
async def vault_get_questions(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """
    Loads questions from a vault .md file.
    Supports filters: difficulty (list), q_type (list), limit (int).
    """
    vault_path = payload.get("vault_path")
    difficulties = payload.get("difficulties", [])
    q_types = payload.get("q_types", [])
    limit = payload.get("limit", 200)
    hard_only = payload.get("hard_only", False)  # L3+L4 only

    if not vault_path:
        raise HTTPException(status_code=400, detail="vault_path required")

    try:
        from src.domains.oka.reference_vault import VaultWriter
        writer = VaultWriter(Path(secrets.vault_path or "/"))
        questions = writer.load_questions(vault_path)

        if hard_only:
            questions = [q for q in questions if q.get("difficulty") in ("L3", "L4")]
        if difficulties:
            questions = [q for q in questions if q.get("difficulty") in difficulties]
        if q_types:
            questions = [q for q in questions if q.get("type") in q_types]
        if limit:
            questions = questions[:limit]

        return {"questions": questions, "total": len(questions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/practice/vault/generate")
async def vault_generate_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """
    Generates an advanced practice session mixing vault questions + AI-generated variants.
    Modes:
      - "vault_only"     : Only real extracted questions
      - "hard_only"      : Only L3/L4 vault questions
      - "ai_variants"    : AI generates harder variants of vault questions
      - "mixed"          : Mix of vault + hub-generated AI questions
      - "weak_spots"     : Focus on previously incorrect question types (uses analytics)
      - "exam_sim"       : Full exam simulation from vault (random sample, timed)
    """
    vault_path = secrets.vault_path or _cached_vault_path
    if not vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured. Set it in Settings.")

    hub_id = payload.get("hub_id", "")
    vault_paths = payload.get("vault_paths", [])  # list of vault .md paths
    mode = payload.get("mode", "vault_only")
    limit = payload.get("limit", 20)
    config = payload.get("config", {})

    try:
        from src.domains.oka.reference_vault import VaultWriter
        import random

        writer = VaultWriter(Path(vault_path))

        # Collect from all selected vaults
        all_questions = []
        for vp in vault_paths:
            qs = writer.load_questions(vp)
            all_questions.extend(qs)

        if not all_questions:
            raise HTTPException(status_code=404, detail="No questions found in selected vaults.")

        # Apply mode filters
        if mode == "hard_only":
            filtered = [q for q in all_questions if q.get("difficulty") in ("L3", "L4")]
        elif mode == "exam_sim":
            filtered = all_questions
            random.shuffle(filtered)
        elif mode == "weak_spots" and secrets.inbox_path:
            # Pull worst-performing types from analytics DB
            weak_types = []
            db_path = Path(secrets.inbox_path) / "oka_queue.db"
            if db_path.exists():
                import sqlite3 as _sq
                conn = _sq.connect(str(db_path))
                rows = conn.execute("""
                    SELECT question_type, COUNT(*) as a, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as c
                    FROM practice_log GROUP BY question_type ORDER BY c*1.0/a ASC LIMIT 5
                """).fetchall()
                conn.close()
                weak_types = [r[0] for r in rows]
            if weak_types:
                filtered = [q for q in all_questions if q.get("type") in weak_types]
                if not filtered:
                    filtered = all_questions
            else:
                filtered = all_questions
        else:
            filtered = all_questions

        # Shuffle and limit
        random.shuffle(filtered)
        selected = filtered[:limit]

        # Re-assign sequential IDs
        for i, q in enumerate(selected):
            q["id"] = i + 1

        # For ai_variants mode: generate harder versions via AI
        if mode == "ai_variants" and secrets.ai_key:
            try:
                from src.domains.ai.factory import ModelFactory
                from src.domains.oka.governor import governor

                llm = ModelFactory.get_model(
                    provider=secrets.ai_provider or "google",
                    model_name=secrets.ai_model or "gemini-1.5-flash",
                    api_key=secrets.ai_key,
                    temperature=0.4,
                )
                variant_qs = []
                for q in selected[:10]:  # Limit variants to control tokens
                    prompt = (
                        f"Original question ({q.get('type','writing')}, {q.get('difficulty','L1')}):\n"
                        f"{q.get('question','')}\n\n"
                        f"Generate ONE harder variant (L3 or L4) of the same concept.\n"
                        f'Return: {{"question":"...","answer":"...","explanation":"...","difficulty":"L3"}}\n'
                        f"ONLY JSON."
                    )
                    try:
                        await governor.get_permit(expected_tokens=400)
                        res = await llm.ainvoke([("human", prompt)])
                        from src.domains.oka.reference_vault import _parse_json_safe
                        data = _parse_json_safe(res.content)
                        if data and isinstance(data, dict):
                            variant = {
                                **q,
                                "id": len(selected) + len(variant_qs) + 1,
                                "question": data.get("question", q["question"]),
                                "answer": data.get("answer", q["answer"]),
                                "explanation": data.get("explanation", q["explanation"]),
                                "difficulty": data.get("difficulty", "L3"),
                                "is_variant": True,
                            }
                            variant_qs.append(variant)
                    except Exception:
                        pass
                selected = selected + variant_qs
            except Exception as e:
                logger.warning(f"[VaultGenerate] Variant generation failed: {e}")

        return {
            "questions": selected,
            "total": len(selected),
            "mode": mode,
            "hub_id": hub_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/practice/vault/status")
async def vault_generation_status():
    """Returns current vault generation job statuses."""
    return {"status": _vault_status}


def handle_shutdown(signum, frame):
    """Clean shutdown handler for when Tauri terminates the process."""
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    host = os.environ.get("API_HOST", "0.0.0.0")
    port = int(os.environ.get("API_PORT", "8765"))


    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info",
    )
