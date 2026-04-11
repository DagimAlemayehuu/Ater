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

import uvicorn
from fastapi import FastAPI, Depends, Header, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.ai.strategist import Strategist
from src.domains.oka.service import OkaService
from src.domains.oka.watcher import OkaQueueManager
from src.domains.rag.watcher import RAGWatcherService
from src.domains.rag.indexer import VaultIndexer
from src.domains.rag.vector_store import ChromaManager

from src.domains.academics.router import router as academics_router
from src.domains.notion.router import router as notion_router
from src.domains.obsidian.router import router as obsidian_router

# Global watcher instances
oka_watcher: Optional[OkaQueueManager] = None
rag_watcher: Optional[RAGWatcherService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    print("[Life OS Sidecar] Starting up...")
    yield
    print("[Life OS Sidecar] Shutting down...")
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
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

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

async def validate_vault_path(secrets: AppSecrets = Depends(get_app_secrets)):
    """Dependency to ensure vault path is valid and watcher is synced."""
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    # Auto-sync the background watcher to the header path
    await _ensure_watcher_path(secrets.vault_path)
    return secrets.vault_path

# Mount routers
app.include_router(academics_router, prefix="/api")
app.include_router(notion_router, prefix="/api")
app.include_router(obsidian_router, prefix="/api", dependencies=[Depends(validate_vault_path)])


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
        result = client.read_note(path)
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
        print(f"[Life OS Sidecar] File upload failed: {traceback.format_exc()}")
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
        print(f"[Life OS Sidecar] AI Connection Test ({target}) failed: {traceback.format_exc()}")
        return {"success": False, "error": str(e)}

@app.post("/api/ai/brainstorm")
async def brainstorm_with_ai(
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Strategizes and brainstorms based on the query using Gemini.
    """
    if not secrets.ai_key:
        raise HTTPException(status_code=401, detail="X-AI-Key header missing")
    
    query = query_data.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing in request body")
    
    try:
        strategist = Strategist(
            secrets=secrets,
            notion_key=secrets.notion_key,
            vault_path=secrets.vault_path
        )
        
        # Track active orchestrator for status reporting
        global active_orchestrator
        active_orchestrator = strategist._orchestrator
        
        response = await strategist.brainstorm(
            query,
            context=query_data.get("context"),
            system_prompt=query_data.get("system_prompt"),
            history=query_data.get("history", []),
            file_uri=query_data.get("file_uri")
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/execute/{agent_name}")
async def execute_specific_agent(
    agent_name: str,
    query_data: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Directly execute a specific agent (e.g., 'notion', 'obsidian', 'scholar').
    """
    if not secrets.ai_key:
        raise HTTPException(status_code=401, detail="X-AI-Key header missing")
    
    query = query_data.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing in request body")

    try:
        strategist = Strategist(secrets, secrets.notion_key, secrets.vault_path)
        orchestrator = strategist._orchestrator
        
        # Mapping to the instantiated specialist inside orchestrator
        agent_map = {
            "notion": orchestrator.notion_agent,
            "obsidian": orchestrator.obsidian_agent,
            "oka": orchestrator.oka_agent,
            "chronos": orchestrator.chronos_agent,
            "scholar": orchestrator.scholar_agent,
            "wealth": orchestrator.wealth_agent,
            "gym": orchestrator.gym_agent,
            "devops": orchestrator.devops_agent,
            "librarian": orchestrator.notion_agent,
            "scribe": orchestrator.obsidian_agent
        }

        agent = agent_map.get(agent_name.lower())
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found.")

        response = await agent.run(query)
        return {"response": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

active_orchestrator: Optional[Any] = None

@app.get("/api/ai/orchestrator/status")
async def get_orchestrator_status():
    """Returns the current status of the AI Orchestrator."""
    if active_orchestrator:
        return active_orchestrator.status
    return {
        "current_prompt": "",
        "current_plan": "",
        "active_agents": [],
        "stage": "idle",
        "next_agent": "None",
        "logs": ["Orchestrator is ready."]
    }

from src.domains.chronos.service import ChronosService

@app.get("/api/ai/specialists/chronos")
async def get_chronos_status(secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns dynamic status for Chronos (Time Management)."""
    service = ChronosService(notion_key=secrets.notion_key, google_token=secrets.google_calendar_token)
    return await service.get_status()

@app.get("/api/ai/chronos/timeline")
async def get_chronos_timeline(secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns a unified timeline from Notion and Google Calendar."""
    service = ChronosService(notion_key=secrets.notion_key, google_token=secrets.google_calendar_token)
    return await service.get_unified_timeline()

@app.get("/api/ai/specialists/scholar")
async def get_scholar_status(secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns dynamic status for Scholar dashboard by scanning the Academic vault."""
    if not secrets.vault_path:
        return {"research_feed": [], "synthesis_metrics": {"total_papers": 0, "synthesized": 0, "pending": 0}}
    
    academic_path = Path(secrets.vault_path) / "2-Academic"
    feed = []
    total = 0
    if academic_path.exists():
        try:
            all_pages_list = sorted(list(academic_path.glob("**/*.md")), key=lambda p: p.stat().st_mtime, reverse=True)
            total = len(all_pages_list)
            # Use a loop to avoid slicing issues if Pyre is being strict
            count = 0
            for p in all_pages_list:
                if count >= 5: break
                count += 1
                feed.append({
                    "name": p.name,
                    "type": "Markdown",
                    "status": "Mirrored" if "NotionMirror" in str(p) else "Ingested"
                })
        except Exception as e:
            logger.error(f"Scholar status scan failed: {e}")

    return {
        "research_feed": feed if feed else [
            {"name": "No recent academic notes", "type": "N/A", "status": "Standby"}
        ],
        "synthesis_metrics": {
            "total_papers": total,
            "synthesized": int(total * 0.85) if total > 0 else 0,
            "pending": int(total * 0.15) if total > 0 else 0
        }
    }

from src.domains.wealth.service import WealthService

@app.get("/api/ai/specialists/wealth")
async def get_wealth_status(secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns dynamic status for Wealth Strategist by querying Notion Income/Expense databases."""
    if not secrets.notion_key:
        return {"net_position": "$0.00", "recent_transactions": []}

    service = WealthService(notion_key=secrets.notion_key, vault_path=secrets.vault_path)
    return await service.get_status()

from src.domains.gym.service import GymService

@app.get("/api/ai/specialists/gym")
async def get_gym_status(secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns functional fitness data from Notion 'Workout logger'."""
    if not secrets.notion_key:
        return {"training_intensity": "0%", "recent_sessions": []}

    service = GymService(notion_key=secrets.notion_key, vault_path=secrets.vault_path)
    return await service.get_status()

# --- OKA (Autonomous Ingestion) Endpoints ---

@app.post("/api/oka/process")
async def oka_process_manual(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Manually process a text block or file path through OKA."""
    if not secrets.ai_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="AI Key and Vault Path are required")
    
    try:
        si_path = OkaService.resolve_si_path()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    service = OkaService(secrets)
    
    text = payload.get("text")
    file_path = payload.get("file_path")
    
    try:
        if file_path:
            print(f"[Life OS Sidecar] Initializing OKA plan for file: {file_path}")
            results = await service.process_file(file_path, str(si_path))
        elif text:
            print(f"[Life OS Sidecar] Initializing OKA plan for raw text")
            # For raw text, create a temp file and process it
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tmp:
                tmp.write(text)
                tmp_path = tmp.name
            try:
                results = await service.process_file(tmp_path, str(si_path))
            finally:
                os.remove(tmp_path)
        else:
            raise HTTPException(status_code=400, detail="Either 'text' or 'file_path' must be provided")
            
        return results
    except ValueError as e:
        print(f"[Life OS Sidecar] OKA Initialization failed: {e}")
        raise HTTPException(status_code=500, detail=f"OKA Initialization failed: {str(e)}")
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

    service = OkaService(secrets)
    try:
        results = await service.confirm_plan(session_id, command=command)
        
        # Move file to note generated only when all batches are done
        if not results.get("has_more") and not session_id.startswith("text_"):
            path = Path(session_id)
            if path.exists():
                processed_dir = path.parent / "note generated"
                processed_dir.mkdir(exist_ok=True)
                new_path = processed_dir / path.name
                if new_path.exists():
                    new_path = processed_dir / f"{int(time.time())}_{path.name}"
                path.rename(new_path)
                print(f"[Life OS Sidecar] Moved {path.name} to note generated after all batches complete")

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
    """Starts or updates the OKA Queue Manager."""
    global oka_watcher
    
    if not secrets.ai_key or not secrets.vault_path or not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="AI Key, Vault Path, and Inbox Path are required")
    
    # If the watcher exists but the path changed, kill it.
    if oka_watcher and str(oka_watcher.inbox_path.absolute()) != str(Path(secrets.inbox_path).absolute()):
        print("[Life OS Sidecar] Inbox path changed. Restarting OKA Watcher...")
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
        print("[Life OS Sidecar] Inbox path changed during status check. Restarting OKA Watcher...")
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
        
    # Sync settings just in case
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
    
    generated_dir = Path(secrets.inbox_path) / "note generated"
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
                    except: pass
                
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
        print(f"[Life OS Sidecar] Error scanning generated folder: {e}")
    
    return {"files": files}

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
        generated_dir = inbox / "note generated"
        for f in inbox.rglob("*"):
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in supported_extensions:
                # Ignore files in the note generated archive
                if generated_dir in f.parents or str(f.absolute()).startswith(str(generated_dir.absolute())):
                    continue
                    
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

# --- RAG Endpoints ---

rag_sync_status = {"status": "idle", "progress": 0, "total": 0, "message": ""}

def _update_rag_status(state: Dict[str, Any]):
    global rag_sync_status
    rag_sync_status.update(state)

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
