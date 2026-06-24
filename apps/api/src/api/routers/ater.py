import os
import sys
import time
import logging
import traceback
import asyncio
import uuid
import sqlite3
import re
import json
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import unquote
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Query, Request
from fastapi.responses import FileResponse

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.ater.service import AterService
from src.domains.ater.watcher import AterQueueManager
import src.api.state as state

logger = logging.getLogger("Ater")
router = APIRouter()

# Track in-progress vault generations
_vault_status: Dict[str, str] = {}

def _update_rag_status(status_state: Dict[str, Any]):
    state.rag_sync_status.update(status_state)

async def _ensure_watcher_path(vault_path: str):
    """Internal helper to ensure watcher is on the right path."""
    if state.rag_watcher and Path(state.rag_watcher.vault_path).resolve() != Path(vault_path).resolve():
        logger.info(f"[RAG] Vault path changed from {state.rag_watcher.vault_path} to {vault_path}. Restarting watcher...")
        state.rag_watcher.stop()
        state.rag_watcher = None
        
        # Auto-restart on new path
        from src.domains.rag.vector_store import ChromaManager
        from src.domains.rag.indexer import VaultIndexer
        from src.domains.rag.watcher import RAGWatcherService
        
        chroma = ChromaManager()
        indexer = VaultIndexer(chroma)
        state.rag_watcher = RAGWatcherService(indexer, vault_path)
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
        state.rag_watcher.start(loop, status_callback=_update_rag_status)

async def validate_vault_path(vault_path: Optional[str] = None, secrets: AppSecrets = Depends(get_app_secrets)):
    """Dependency to ensure vault path is valid and watcher is synced."""
    effective_vault_path = secrets.vault_path or vault_path
    
    if not effective_vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    # Auto-sync the background watcher to the header path
    await _ensure_watcher_path(effective_vault_path)
    return effective_vault_path


# --- Core Ater & Obsidian Endpoints ---

@router.get("/obsidian/files")
def list_obsidian_files(secrets: AppSecrets = Depends(get_app_secrets)):
    """Lists files in the vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    vault_root = Path(secrets.vault_path)
    if not vault_root.exists():
        raise HTTPException(status_code=404, detail="Vault Path not found")
        
    files = []
    try:
        # Use standard rglob to list files, excluding dotfiles/venv/node_modules/Practice
        ignored_dirs = {".git", ".ater", ".obsidian", "node_modules", "Practice", "Generated"}
        for f in vault_root.rglob("*"):
            # Skip hidden files and ignored directories
            if any(ignored in f.parts for ignored in ignored_dirs) or f.name.startswith("."):
                continue
            if f.is_file():
                files.append({
                    "name": f.name,
                    "path": f.relative_to(vault_root).as_posix(),
                    "size": f.stat().st_size,
                    "isDir": False
                })
            elif f.is_dir():
                files.append({
                    "name": f.name,
                    "path": f.relative_to(vault_root).as_posix(),
                    "isDir": True
                })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"files": files}

@router.get("/obsidian/file")
def read_obsidian_file(path: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Reads a file's raw content and metadata."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    full_path = Path(secrets.vault_path) / path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        content = full_path.read_text(encoding="utf-8")
        # Extract metadata (yaml frontmatter)
        metadata = {}
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL | re.MULTILINE)
        if yaml_match:
            import yaml as _yaml
            try:
                metadata = _yaml.safe_load(yaml_match.group(1)) or {}
            except Exception:
                pass
        return {"content": content, "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/obsidian/file")
def write_obsidian_file(
    path: str = Query(...),
    content: str = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Writes content to a file in the vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    full_path = Path(secrets.vault_path) / path
    try:
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding="utf-8")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/obsidian/item")
def delete_obsidian_item(path: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Deletes a file or directory in the vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    full_path = Path(secrets.vault_path) / path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Item not found")
        
    try:
        if full_path.is_file():
            full_path.unlink()
        elif full_path.is_dir():
            import shutil
            shutil.rmtree(full_path)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/save-persona")
async def save_persona_prompt(payload: Dict[str, str] = Body(...)):
    """Saves or updates custom persona prompts."""
    mode = payload.get("mode")
    prompt = payload.get("prompt")
    if not mode or not prompt:
        raise HTTPException(status_code=400, detail="mode and prompt are required")
    try:
        from src.domains.ater.agents import update_persona_prompt
        update_persona_prompt(mode, prompt)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/process")
async def ater_process_manual(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Phase 1: Pure Detection. No AI usage."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
    
    file_path = payload.get("file_path")
    
    try:
        service = AterService(secrets)
        return await service.detect_curriculum(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/plan")
async def ater_generate_plan(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Phase 2: AI Planning with locked curriculum."""
    if not secrets.ai_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="AI Key and Vault Path are required")
    
    try:
        si_path = AterService.resolve_si_path()
        service = AterService(secrets)
        file_path = payload.get("file_path")
        curriculum = payload.get("curriculum", {})
        target_hub_id = payload.get("target_hub_id")
        return await service.generate_plan(file_path, str(si_path), curriculum, target_hub_id=target_hub_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/confirm")
async def ater_confirm_plan(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Confirms an existing Ater plan and trigger deployment."""
    session_id = payload.get("session_id")
    command = payload.get("command", "Confirm Final Plan & Proceed Batch 1")
    curriculum_override = payload.get("curriculum_override")
    anchored_hub_id = payload.get("anchored_hub_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        service = AterService(secrets)
        results = await service.confirm_plan(
            session_id, 
            command=command, 
            curriculum_override=curriculum_override, 
            anchored_hub_id=anchored_hub_id
        )
        
        # Move file to Generated only when all batches are done
        if not results.get("has_more") and not session_id.startswith("text_"):
            path = Path(session_id)
            if path.exists():
                processed_dir = path.parent / "Generated"
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
        raise HTTPException(status_code=500, detail=f"Ater Confirmation failed: {str(e)}\n\nTraceback:\n{error_details}")

@router.post("/ater/plan/intent")
async def ater_plan_intent(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Classifies intent (is learning or not) and checks if the prompt is specific or vague.
    """
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI Key is required")
    
    prompt = payload.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
        
    try:
        service = AterService(secrets)
        result = await service.planner.classify_intent_and_clarification(prompt)
        
        # If not learning request, raise routing error (400 Bad Request)
        if not result.get("is_learning"):
            raise HTTPException(status_code=400, detail="The prompt does not represent a learning request.")
            
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/plan/curriculum")
async def ater_plan_curriculum(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Checks for existing Hub matching the topic, then generates the structured curriculum.
    """
    if not secrets.ai_key or not secrets.vault_path:
        raise HTTPException(status_code=400, detail="AI Key and Vault Path are required")
        
    prompt = payload.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
        
    learning_mode = payload.get("learning_mode", "self-study")
    semester = payload.get("semester")
    course = payload.get("course")
    unit = payload.get("unit")
    
    try:
        service = AterService(secrets)
        
        # Extract topic first
        topic = await service.planner.extract_topic(prompt)
        
        # Try to lookup existing Hub
        from src.domains.ater.learning_object import lookup_existing_hub
        hub_data = lookup_existing_hub(secrets.vault_path, topic)
        
        existing_chapters = []
        if hub_data:
            try:
                import frontmatter
                post = frontmatter.loads((Path(secrets.vault_path) / hub_data["path"]).read_text(encoding="utf-8"))
                existing_chapters = post.metadata.get("chapters", [])
            except Exception:
                pass
                
        # Generate curriculum structure
        curriculum = await service.planner.generate_curriculum(
            prompt=prompt,
            existing_chapters=existing_chapters,
            learning_mode=learning_mode
        )
        
        return {
            "curriculum": curriculum,
            "existing_hub_found": bool(hub_data),
            "existing_hub_path": hub_data["path"] if hub_data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/plan/confirm")
async def ater_plan_confirm(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Confirms proposed curriculum and writes files to the vault in "Generate All" or "Progressive" mode.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
        
    curriculum = payload.get("curriculum")
    mode = payload.get("mode") # "Generate All" or "Progressive"
    
    if not curriculum or not mode:
        raise HTTPException(status_code=400, detail="curriculum and mode are required")
        
    semester = payload.get("semester")
    course = payload.get("course")
    unit = payload.get("unit")
    
    try:
        service = AterService(secrets)
        if isinstance(curriculum, dict) and "notes" in curriculum:
            from src.domains.ater.source_service import SourceGroundedPlanner, SourceGroundedCurriculum
            planner = SourceGroundedPlanner(secrets)
            curr_obj = SourceGroundedCurriculum.model_validate(curriculum)
            result = planner.write_grounded_curriculum(
                curriculum=curr_obj,
                mode=mode,
                semester=semester,
                course=course,
                unit=unit
            )
        else:
            result = service.planner.write_curriculum(
                curriculum=curriculum,
                mode=mode,
                semester=semester,
                course=course,
                unit=unit
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/curriculum/plan")
async def ater_curriculum_plan(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    concept = payload.get("concept")
    target_hub_id = payload.get("target_hub_id")
    if not concept:
        raise HTTPException(status_code=400, detail="concept is required")
    
    try:
        service = AterService(secrets)
        search_context = ""
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(concept, max_results=3))
            if results:
                search_context = "\n".join([r.get("body", "") for r in results])
        except Exception as e:
            logger.warning(f"DuckDuckGo search failed for curriculum: {e}")
            
        ai_key = secrets.planner_key or secrets.ai_key
        if not ai_key:
            raise HTTPException(status_code=400, detail="AI API Key is required")
            
        provider = secrets.planner_provider or secrets.ai_provider or "google"
        model = secrets.planner_model or secrets.ai_model or "gemini-2.0-flash"
        
        llm = service._build_model(provider, model, ai_key, temperature=0.2)
        
        sys_prompt = """You are an elite academic curriculum architect.
Your task is to design a logical, progressive curriculum (syllabus) for a given study concept.
You must return your output strictly in JSON format matching the schema below. No other text, no markdown block wrappers around the JSON, just the JSON string.

Schema:
{
  "course": "Course code and title (e.g. CS 301: ColBERT Retrieval Systems)",
  "unit": "Unit number/name (e.g. 1)",
  "semester": "Semester term (e.g. Semester V)",
  "hub_title": "Clean hub title for Obsidian (e.g. ColBERT Systems)",
  "atomic_notes": [
    {
      "title": "Name of the note (e.g. ColBERT Introduction)",
      "summary": "Brief 1-2 sentence description of what the note will cover."
    }
  ]
}
"""
        user_prompt = f"Design a curriculum for the concept: '{concept}'\n\nWeb Search Reference:\n{search_context}"
        
        res = await llm.ainvoke([("system", sys_prompt), ("human", user_prompt)])
        json_text = res.content.strip()
        if json_text.startswith("```"):
            lines = json_text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                json_text = "\n".join(lines[1:-1]).strip()
                
        curriculum_data = json.loads(json_text)
        return {"status": "success", "concept": concept, "curriculum": curriculum_data}
    except Exception as e:
        error_details = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Curriculum planning failed: {str(e)}\n\nTraceback:\n{error_details}")

@router.post("/ater/curriculum/confirm")
async def ater_curriculum_confirm(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    concept = payload.get("concept")
    curriculum = payload.get("curriculum")
    target_hub_id = payload.get("target_hub_id")
    
    if not curriculum:
        raise HTTPException(status_code=400, detail="curriculum is required")
        
    try:
        service = AterService(secrets)
        session_id = f"text_{uuid.uuid4()}"
        
        session_metadata = {
            "course": curriculum.get("course", "General Knowledge"),
            "unit": str(curriculum.get("unit", "1")),
            "semester": curriculum.get("semester", "General"),
            "hub_title": curriculum.get("hub_title", "Concept Hub"),
            "atomic_notes": [
                {
                    "title": n["title"],
                    "description": n["summary"],
                    "source_context": f"Concept explanation: {n['summary']}",
                    "concept_modality": "Qualitative/Definitional",
                    "mode": "Definitional"
                } for n in curriculum.get("atomic_notes", [])
            ],
            "batches": [
                {
                    "id": i // 3 + 1,
                    "type": "atomic",
                    "notes": [n["title"] for n in curriculum.get("atomic_notes", [])[i:i+3]]
                } for i in range(0, len(curriculum.get("atomic_notes", [])), 3)
            ]
        }
        
        session_data = {
            "path": "",
            "metadata": session_metadata,
            "current_batch": 0,
            "total_batches": len(session_metadata["batches"]),
            "target_hub": None
        }
        service._persist_session(session_id, session_data)
        
        results = await service.run_full_cascade(session_id)
        return {"status": "success", "session_id": session_id, "results": results}
    except Exception as e:
        error_details = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Curriculum confirmation failed: {str(e)}\n\nTraceback:\n{error_details}")

@router.get("/ater/paused-sessions")
async def ater_get_paused_sessions(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns all sessions that were paused due to a rate limit and have saved progress."""
    service = AterService(secrets)
    return {"paused_sessions": service.get_paused_sessions()}

@router.post("/ater/resume")
async def ater_resume_paused_session(
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
        service = AterService(secrets)
        result = await service.resume_paused_session(
            session_id=session_id,
            curriculum_override=curriculum_override,
        )
        # Move file to archive only when fully done
        if not result.get("has_more") and result.get("status") != "rate_limited" and not session_id.startswith("text_"):
            path = Path(session_id)
            if path.exists():
                processed_dir = path.parent / "Generated"
                processed_dir.mkdir(exist_ok=True)
                new_path = processed_dir / path.name
                if new_path.exists():
                    new_path = processed_dir / f"{int(time.time())}_{path.name}"
                path.rename(new_path)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ater Resume failed: {str(e)}")

@router.post("/ater/swap-key")
async def ater_swap_api_key(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Hot-swaps the AI API key on the live AterService instance.
    """
    new_key = payload.get("api_key")
    if not new_key:
        raise HTTPException(status_code=400, detail="api_key is required")
    try:
        service = AterService(secrets)
        service.swap_api_key(new_key)
        return {"status": "ok", "message": "API key swapped. Resume generation now."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/watcher/toggle")
async def ater_watcher_toggle(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Starts or updates the Ater Queue Manager."""
    effective_inbox = secrets.inbox_path
    if not effective_inbox and secrets.vault_path:
        effective_inbox = str(Path(secrets.vault_path) / "Inbox")
        
    logger.info(f"[DEBUG Toggle] ai_key: {repr(secrets.ai_key)}, vault_path: {repr(secrets.vault_path)}, inbox_path: {repr(secrets.inbox_path)}, effective_inbox: {repr(effective_inbox)}")
        
    if not secrets.ai_key or not secrets.vault_path or not effective_inbox:
        raise HTTPException(status_code=400, detail="AI Key, Vault Path, and Inbox Path are required")
    
    # If the watcher exists but the path changed, kill it.
    if state.ater_watcher and Path(state.ater_watcher.inbox_path).resolve() != Path(effective_inbox).resolve():
        state.ater_watcher.stop()
        state.ater_watcher = None

    # Always keep the watcher alive if we have settings, just toggle its auto_process state
    if not state.ater_watcher:
        try:
            si_path = AterService.resolve_si_path()
        except FileNotFoundError as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        service = AterService(secrets)
        state.ater_watcher = AterQueueManager(service, effective_inbox, str(si_path))
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        state.ater_watcher.start(loop, auto_process=secrets.auto_deploy)
        logger.info(f"[Ater] QueueManager started for inbox: {effective_inbox} | Auto: {secrets.auto_deploy}")
    else:
        state.ater_watcher.update_settings(auto_process=secrets.auto_deploy)
        
    return {"status": "watcher_active", "auto_deploy": secrets.auto_deploy, "inbox": effective_inbox}

@router.get("/ater/queue/status")
async def ater_queue_status(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns the current detailed queue status."""
    effective_vault = secrets.vault_path
    effective_inbox = secrets.inbox_path
    
    if not effective_inbox and effective_vault:
        effective_inbox = str(Path(effective_vault) / "Inbox")

    if state.ater_watcher and effective_inbox and Path(state.ater_watcher.inbox_path).resolve() != Path(effective_inbox).resolve():
        state.ater_watcher.stop()
        state.ater_watcher = None

    if not state.ater_watcher and secrets.ai_key and effective_vault and effective_inbox:
        try:
            si_path = AterService.resolve_si_path()
        except FileNotFoundError:
            return {"status": "offline", "pending_files": [], "manual_status": dict(AterService._status), "error": "Ater.md not found"}
        
        service = AterService(secrets)
        state.ater_watcher = AterQueueManager(service, effective_inbox, str(si_path))
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        state.ater_watcher.start(loop, auto_process=secrets.auto_deploy)
        logger.info(f"[Ater] Watcher Auto-started for inbox: {effective_inbox} | Auto: {secrets.auto_deploy}")
        
    if not state.ater_watcher:
        return {"status": "offline", "pending_files": [], "manual_status": dict(AterService._status)}
        
    state.ater_watcher.service.sync_secrets(secrets)

    if state.ater_watcher.auto_process != secrets.auto_deploy:
        state.ater_watcher.update_settings(auto_process=secrets.auto_deploy)
    
    status_dict = state.ater_watcher.get_status()
    
    # Inject Governor Telemetry
    from src.domains.ater.governor import governor
    status_dict["governor_pressure"] = governor.get_pressure()
    status_dict["last_throttle_event"] = governor.last_throttle_event
    
    return status_dict

@router.get("/ater/generated")
async def ater_list_generated(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists files that have been successfully generated."""
    if not secrets.inbox_path:
        return {"files": []}
    
    generated_dir = Path(secrets.inbox_path) / "Generated"
    if not generated_dir.exists() or not generated_dir.is_dir():
        return {"files": []}
        
    files = []
    supported_extensions = {'.pdf', '.txt', '.md', '.py', '.js', '.ts', '.json', '.cpp', '.java', '.rs', '.html', '.css'}
    try:
        for f in generated_dir.rglob("*"):
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in supported_extensions:
                hub_path = None
                meta_file = f.with_suffix(".ater.json")
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

@router.get("/ater/inbox")
async def ater_list_inbox(
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
        generated_dir = inbox / "Generated"
        for f in inbox.rglob("*"):
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in supported_extensions:
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

@router.get("/ater/hubs")
async def ater_list_hubs(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists available study hubs."""
    service = AterService(secrets)
    return {"hubs": service.list_planner_hubs()}

@router.get("/ater/hubs/{hub_id}/notes")
async def ater_list_hub_notes(
    hub_id: str,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists atomic notes for a specific hub."""
    service = AterService(secrets)
    return {"notes": service.list_atomic_notes(hub_id)}


# --- Practice Session Endpoints ---

@router.post("/practice/generate")
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

    service = AterService(secrets)
    try:
        return await service.generate_practice(hub_id, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/practice/status")
async def get_practice_status():
    """Returns the current generation status for all active sessions."""
    return {"status": dict(AterService._status)}

@router.get("/practice/list")
async def list_practice_sessions(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Lists all stored practice sessions by scanning the vault directly."""
    if not secrets.vault_path:
        return {"practices": [], "_debug": {"error": "vault_path missing"}}
    
    service = AterService(secrets)
    try:
        practices = service.list_practices()
        return {"practices": practices}
    except Exception as e:
        return {"practices": [], "error": str(e)}

@router.post("/practice/get")
async def get_practice_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Gets the raw JSON payload of a practice session by its path."""
    path = payload.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="path is required")
        
    p = Path(path)
    if not p.is_absolute() or not p.exists():
        if secrets.vault_path:
            resolved_p = Path(secrets.vault_path) / path
            if resolved_p.exists():
                p = resolved_p
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice not found")
        
    try:
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
        json_match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
        if json_match:
            questions = json.loads(json_match.group(1))
            return {"questions": questions}
        else:
            raise HTTPException(status_code=500, detail="No valid JSON data found in practice file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice/score")
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
    if not p.is_absolute() or not p.exists():
        if secrets.vault_path:
            resolved_p = Path(secrets.vault_path) / path
            if resolved_p.exists():
                p = resolved_p
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
            new_content = f"---\n{new_yaml}---\n" + content[yaml_match.end():]
            p.write_text(new_content, encoding="utf-8")
            return {"status": "success"}
        else:
            raise HTTPException(status_code=500, detail="No frontmatter found in practice file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice/delete")
async def delete_practice_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Deletes a practice session file from the vault."""
    path = payload.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="path is required")
        
    p = Path(path)
    if not p.is_absolute() or not p.exists():
        if secrets.vault_path:
            resolved_p = Path(secrets.vault_path) / path
            if resolved_p.exists():
                p = resolved_p
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")
        
    try:
        abs_p = p.resolve().absolute()
        abs_vault = Path(secrets.vault_path).resolve().absolute()
        if abs_vault not in abs_p.parents and abs_vault != abs_p:
             raise HTTPException(status_code=403, detail="Cannot delete files outside the vault")
             
        p.unlink()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Telemetry & SRS Spaced Repetition Endpoints ---

def resolve_note_path(note_id: str, vault_path: Path) -> Optional[str]:
    if not note_id:
        return None
    p = Path(note_id)
    if p.is_absolute():
        try:
            return p.relative_to(vault_path).as_posix()
        except ValueError:
            return None
    if (vault_path / note_id).exists():
        return p.as_posix()
        
    stem = p.stem
    stem = stem.replace("[", "").replace("]", "").replace(" ", "_")
    
    for md_path in vault_path.rglob("*.md"):
        parts = md_path.parts
        if any(ignored in parts for ignored in [".git", ".ater", ".obsidian", "Practice"]):
            continue
        if md_path.stem == stem:
            return md_path.relative_to(vault_path).as_posix()
            
    stem_lower = stem.lower()
    for md_path in vault_path.rglob("*.md"):
        parts = md_path.parts
        if any(ignored in parts for ignored in [".git", ".ater", ".obsidian", "Practice"]):
            continue
        if md_path.stem.lower() == stem_lower:
            return md_path.relative_to(vault_path).as_posix()
            
    return note_id

@router.post("/practice/log")
async def log_practice(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs individual question practice attempts."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
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
        
        note_id = payload.get("note_id")
        is_correct = bool(payload.get("is_correct", False))
        if note_id:
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
            
            if secrets.vault_path:
                vault_path = Path(secrets.vault_path)
                note_path = resolve_note_path(note_id, vault_path)
                if note_path:
                    try:
                        from src.domains.ater.srs import SRSEngine
                        engine = SRSEngine(db_path)
                        engine.review(note_path, rating=3 if is_correct else 1)
                    except Exception as fsrs_err:
                        logger.error(f"[SRS Sync] Failed to update FSRS card: {fsrs_err}")
            
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/obsidian/log-visit")
async def log_note_visit(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs the time spent on an atomic note."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
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

@router.post("/study/log-session")
async def log_study_session(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs a completed study/focus session."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
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

@router.post("/study/log-practice")
async def log_practice_result(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Logs a practice summary performance."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
        return {"status": "ignored", "reason": "db not initialized"}
    
    try:
        conn = sqlite3.connect(str(db_path))
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

@router.get("/practice/analytics")
async def get_practice_analytics(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Retrieves analytics for the dashboard based on real practice logs."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
         return {"modalities": {}, "weakest_concepts": []}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        
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

@router.post("/srs/review")
async def srs_review(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    from src.domains.ater.srs import SRSEngine
    engine = SRSEngine(Path(secrets.inbox_path) / "ater_queue.db")
    
    note_path = payload.get("note_path")
    rating = payload.get("rating", 3)
    if not note_path:
        raise HTTPException(status_code=400, detail="note_path required")
    
    try:
        card = engine.review(note_path, rating)
        return {"success": True, "card": {
            "note_path": card.note_path,
            "stability": card.stability,
            "difficulty": card.difficulty,
            "due": card.due.isoformat(),
            "reps": card.reps,
            "lapses": card.lapses
        }}
    except Exception as e:
        logger.error(f"SRS Review Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/srs/feynman-validate")
async def srs_feynman_validate(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured")
        
    from src.domains.ater.srs import SRSEngine
    engine = SRSEngine(Path(secrets.inbox_path) / "ater_queue.db")
    
    note_path = payload.get("note_path")
    explanation = payload.get("explanation")
    if not note_path:
        raise HTTPException(status_code=400, detail="note_path required")
    if explanation is None:
        raise HTTPException(status_code=400, detail="explanation required")
        
    try:
        res = engine.validate_feynman_gate(note_path, explanation, Path(secrets.vault_path))
        return res
    except Exception as e:
        logger.error(f"Feynman validation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/srs/cards")
async def get_srs_cards(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.inbox_path:
        return {"cards": []}
    from src.domains.ater.srs import SRSEngine
    engine = SRSEngine(Path(secrets.inbox_path) / "ater_queue.db")
    try:
        cards = engine.get_all()
        return {"cards": [{
            "note_path": c.note_path,
            "stability": c.stability,
            "difficulty": c.difficulty,
            "due": c.due.isoformat(),
            "reps": c.reps,
            "lapses": c.lapses,
            "last_review": c.last_review.isoformat() if c.last_review else None
        } for c in cards]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/srs/due")
async def get_srs_due(
    hub_id: str = None,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.inbox_path:
        return {"due_cards": []}
    from src.domains.ater.srs import SRSEngine
    engine = SRSEngine(Path(secrets.inbox_path) / "ater_queue.db")
    
    hub_notes = []
    if hub_id and hub_id != "all" and secrets.vault_path:
        service = AterService(secrets)
        hub_notes = [n["path"] for n in service.list_atomic_notes(hub_id)]
        
    try:
        cards = engine.get_due(hub_notes if (hub_id and hub_id != "all") else None)
        return {"due_cards": [{
            "note_path": c.note_path,
            "due": c.due.isoformat(),
            "difficulty": c.difficulty,
            "reps": c.reps
        } for c in cards]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/record")
async def record_analytics(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    from src.domains.ater.analytics import AnalyticsEngine
    engine = AnalyticsEngine(Path(secrets.inbox_path) / "ater_queue.db")
    
    try:
        engine.record(
            note_path=payload.get("note_path", "unknown"),
            was_correct=payload.get("was_correct", False),
            time_ms=payload.get("time_ms", 0),
            question_type=payload.get("question_type", ""),
            difficulty=payload.get("difficulty", "L1"),
            confidence=payload.get("confidence"),
            session_id=payload.get("session_id"),
            question_id=payload.get("question_id")
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Analytics Record Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study/history")
async def get_study_history(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Retrieves all study sessions and telemetry for the calendar/dashboard."""
    if not secrets.inbox_path:
        return {"sessions": [], "telemetry": []}
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
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

@router.post("/study/reset")
async def reset_study_history(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Clears all study sessions, telemetry, and practice logs."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
        return {"success": True, "message": "Database already empty"}
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.execute("DELETE FROM study_sessions")
        conn.execute("DELETE FROM study_telemetry")
        conn.execute("DELETE FROM practice_log")
        conn.execute("DELETE FROM note_srs")
        conn.execute("DELETE FROM queue")
        conn.commit()
        conn.close()
        
        AterService.clear_sessions()
        if state.ater_watcher:
            state.ater_watcher.reset_queue()
            
        return {"success": True, "message": "Study history and queue purged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system/factory-reset")
async def factory_reset_system(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """
    Absolute Wipe: Wipes database and files.
    """
    try:
        if secrets.vault_path:
            vault_root = Path(secrets.vault_path)
            db_path = Path(secrets.inbox_path or str(vault_root / "Inbox")) / "ater_queue.db"

            if db_path.exists():
                conn = sqlite3.connect(str(db_path))
                conn.execute("DELETE FROM study_sessions")
                conn.execute("DELETE FROM study_telemetry")
                conn.execute("DELETE FROM practice_log")
                conn.execute("DELETE FROM note_srs")
                conn.execute("DELETE FROM queue")
                conn.commit()
                conn.close()

            academic_folders = [
                "database/assignments",
                "database/exams",
                "database/study planner",
                "database/courses",
                "database/semesters",
                "database/years",
                "database/bases/Inbox"
            ]
            
            for folder in academic_folders:
                folder_path = vault_root / folder
                if folder_path.exists() and folder_path.is_dir():
                    for f in folder_path.glob("*.md"):
                        if not f.name.startswith("."):
                            f.unlink()

        AterService.clear_sessions()
        if state.ater_watcher:
            state.ater_watcher.reset_queue()
        
        from src.domains.ai.tracker import tracker as _tracker
        _tracker.limits = {}

        return {"success": True, "message": "System factory reset successful. Dashboard and history wiped."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/practice/srs")
async def get_srs_data(
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Retrieves SRS review dates for notes."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
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


# --- RAG & Search Endpoints ---

@router.post("/rag/watcher/toggle")
async def rag_watcher_toggle(secrets: AppSecrets = Depends(get_app_secrets)):
    """Starts or stops the Global Obsidian Watcher for RAG."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
        
    if not state.rag_watcher:
        from src.domains.rag.vector_store import ChromaManager
        from src.domains.rag.indexer import VaultIndexer
        from src.domains.rag.watcher import RAGWatcherService
        
        chroma = ChromaManager()
        indexer = VaultIndexer(chroma)
        state.rag_watcher = RAGWatcherService(indexer, secrets.vault_path)
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()
            
        state.rag_watcher.start(loop, status_callback=_update_rag_status)
        return {"status": "started", "vault": secrets.vault_path}
    else:
        state.rag_watcher.stop()
        state.rag_watcher = None
        return {"status": "stopped"}

@router.get("/rag/sync-status")
async def get_rag_sync_status():
    """Returns the current status of the vault sync."""
    return state.rag_sync_status

@router.post("/rag/sync")
async def rag_sync_vault(secrets: AppSecrets = Depends(get_app_secrets)):
    """Forces a full re-index of the Obsidian Vault."""
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path is required")
        
    if state.rag_sync_status.get("status") == "syncing":
        return {"status": "sync_started", "message": "A sync is already in progress."}
    
    state.rag_sync_status.update({"status": "syncing", "message": "Preparing to scan vault..."})
    
    if state.rag_watcher:
        logger.info("[RAG] Triggering force sync via active watcher")
        asyncio.create_task(asyncio.to_thread(state.rag_watcher.initial_sync, _update_rag_status, True))
        return {"status": "sync_started", "message": "Vault force sync started using active watcher."}
        
    def _status_callback(status_state: Dict[str, Any]):
        state.rag_sync_status.update(status_state)

    def run_sync(path: str):
        from src.domains.rag.vector_store import ChromaManager
        from src.domains.rag.indexer import VaultIndexer
        from src.domains.rag.watcher import RAGWatcherService
        chroma = ChromaManager()
        indexer = VaultIndexer(chroma)
        service = RAGWatcherService(indexer, path)
        service.initial_sync(status_callback=_status_callback, force=True)
        
    asyncio.create_task(asyncio.to_thread(run_sync, secrets.vault_path))
    return {"status": "sync_started", "message": "Vault force sync started in the background."}


# --- Reference Vault pipeline & Export Endpoints ---

@router.post("/practice/vault/upload")
async def vault_upload_source(
    hub_id: str = Body(...),
    source_name: str = Body(...),
    source_text: str = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """
    Runs the full extract→classify→solve→write pipeline on provided text.
    """
    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI Key required (configure in Settings)")

    vault_path = secrets.vault_path or state._cached_vault_path
    if not vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured. Open Settings and set your Obsidian vault path.")

    try:
        from src.domains.ater.reference_vault import ReferenceVaultPipeline
        from src.domains.ater.governor import governor
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

@router.post("/practice/vault/upload-file")
async def vault_upload_file(
    hub_id: str = Query(..., description="Hub ID to store questions under"),
    file: UploadFile = File(...),
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """Accepts a binary file upload (PDF/image/txt), extracts text, then runs the pipeline."""
    import tempfile, os, base64
    from src.domains.ai.factory import ModelFactory
    from src.domains.ater.reference_vault import ReferenceVaultPipeline
    from src.domains.ater.governor import governor
    from langchain_core.messages import HumanMessage

    if not secrets.ai_key:
        raise HTTPException(status_code=400, detail="AI Key required (configure in Settings)")

    vault_path = secrets.vault_path or state._cached_vault_path
    if not vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured. Open Settings and set your Obsidian vault path.")

    suffix = Path(file.filename or "upload.txt").suffix.lower()

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        source_text = ""

        if suffix == ".pdf":
            def _extract_pdf(pdf_p):
                try:
                    import pypdf
                    reader = pypdf.PdfReader(pdf_p)
                    pages_text = [page.extract_text() or "" for page in reader.pages]
                    return "\n\n".join(t for t in pages_text if t.strip())
                except Exception:
                    return ""
            
            source_text = await asyncio.to_thread(_extract_pdf, tmp_path)

            if not source_text.strip():
                file_size = os.path.getsize(tmp_path)
                if file_size > 15 * 1024 * 1024:
                    raise HTTPException(status_code=422, detail="PDF is a scanned image and too large (>15MB).")
                
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
                raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

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

@router.get("/practice/vault/list")
async def vault_list(
    hub_id: str,
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """Lists all reference vault files for a hub."""
    if not secrets.vault_path:
        return {"vaults": []}
    try:
        from src.domains.ater.reference_vault import VaultWriter
        writer = VaultWriter(Path(secrets.vault_path))
        return {"vaults": writer.list_vaults(hub_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice/vault/questions")
async def vault_get_questions(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """Loads questions from a vault .md file."""
    vault_path_val = payload.get("vault_path")
    difficulties = payload.get("difficulties", [])
    q_types = payload.get("q_types", [])
    limit = payload.get("limit", 200)
    hard_only = payload.get("hard_only", False)

    if not vault_path_val:
        raise HTTPException(status_code=400, detail="vault_path required")

    try:
        from src.domains.ater.reference_vault import VaultWriter
        writer = VaultWriter(Path(secrets.vault_path or "/"))
        questions = writer.load_questions(vault_path_val)

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

@router.post("/practice/vault/generate")
async def vault_generate_session(
    payload: Dict[str, Any],
    secrets: AppSecrets = Depends(get_app_secrets),
):
    """Generates an advanced practice session mixing vault questions + AI-generated variants."""
    vault_path = secrets.vault_path or state._cached_vault_path
    if not vault_path:
        raise HTTPException(status_code=400, detail="Vault Path not configured. Set it in Settings.")

    hub_id = payload.get("hub_id", "")
    vault_paths = payload.get("vault_paths", [])
    mode = payload.get("mode", "vault_only")
    limit = payload.get("limit", 20)

    try:
        from src.domains.ater.reference_vault import VaultWriter
        import random

        writer = VaultWriter(Path(vault_path))

        all_questions = []
        for vp in vault_paths:
            qs = writer.load_questions(vp)
            all_questions.extend(qs)

        if not all_questions:
            raise HTTPException(status_code=404, detail="No questions found in selected vaults.")

        if mode == "hard_only":
            filtered = [q for q in all_questions if q.get("difficulty") in ("L3", "L4")]
        elif mode == "exam_sim":
            filtered = all_questions
            random.shuffle(filtered)
        elif mode == "weak_spots" and secrets.inbox_path:
            weak_types = []
            db_path = Path(secrets.inbox_path) / "ater_queue.db"
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

        random.shuffle(filtered)
        selected = filtered[:limit]

        for i, q in enumerate(selected):
            q["id"] = i + 1

        if mode == "ai_variants" and secrets.ai_key:
            try:
                from src.domains.ai.factory import ModelFactory
                from src.domains.ater.governor import governor

                llm = ModelFactory.get_model(
                    provider=secrets.ai_provider or "google",
                    model_name=secrets.ai_model or "gemini-1.5-flash",
                    api_key=secrets.ai_key,
                    temperature=0.4,
                )
                variant_qs = []
                for q in selected[:10]:
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
                        from src.domains.ater.reference_vault import _parse_json_safe
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

@router.get("/practice/vault/status")
async def vault_generation_status():
    """Returns current vault generation job statuses."""
    return {"status": _vault_status}


# --- Academic Core Upgrades (V33.1) ---

@router.post("/ater/notes/regenerate-quiz")
async def regenerate_note_quiz(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    note_path = payload.get("note_path")
    if not note_path:
        raise HTTPException(status_code=400, detail="note_path is required")
    try:
        service = AterService(secrets)
        res = await service.generate_practice("all", {"selectedAtomicNotes": [note_path], "question_count": 3})
        return {"success": True, "questions": res.get("questions", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/practice/gaps")
async def get_practice_gaps(
    hub_id: str = Query(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
    try:
        from src.domains.ater.gap_detector import KnowledgeGapDetector
        detector = KnowledgeGapDetector(Path(secrets.vault_path), db_path)
        gaps = detector.detect_gaps(hub_id)
        return {"gaps": gaps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/practice/schedule")
async def get_practice_schedule(
    budget: int = Query(30),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
    try:
        from src.domains.ater.scheduler import StudyScheduler
        scheduler = StudyScheduler(Path(secrets.vault_path), db_path)
        plan = scheduler.generate_plan(budget)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice/exam")
async def create_practice_exam(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    hub_ids = payload.get("hub_ids") or []
    config = payload.get("config") or {}
    try:
        from src.domains.ater.exam_engine import ExamEngine
        engine = ExamEngine(Path(secrets.vault_path))
        exam = await engine.create_exam(hub_ids, config, secrets)
        return exam
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice/exam/{exam_id}/submit")
async def submit_practice_exam(
    exam_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    answers = payload.get("answers") or {}
    try:
        from src.domains.ater.exam_engine import ExamEngine
        engine = ExamEngine(Path(secrets.vault_path))
        report = engine.grade_exam(exam_id, answers)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/practice/exam/{exam_id}/report")
async def get_practice_exam_report(
    exam_id: str,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    try:
        from src.domains.ater.academic_db import AcademicDB
        db = AcademicDB(Path(secrets.vault_path))
        session = db.get_exam_session(exam_id)
        if not session or not session.get("report"):
            raise HTTPException(status_code=404, detail="Exam report not found")
        return session["report"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/oracle/tutor/{note_path:path}")
async def oracle_tutor_session(
    note_path: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    user_message = payload.get("message")
    session_id = payload.get("session_id")
    if not user_message:
        raise HTTPException(status_code=400, detail="message is required")
    try:
        from src.domains.ater.tutor import SocraticTutor
        tutor = SocraticTutor(Path(secrets.vault_path))
        res = await tutor.chat(note_path, user_message, session_id, secrets)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vault/semantic-search")
async def get_vault_semantic_search(
    query: str = Query(...),
    limit: int = Query(5),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    try:
        from src.domains.ater.vault_indexer import VaultIndexer
        indexer = VaultIndexer(Path(secrets.vault_path))
        indexer.index_vault()
        results = indexer.semantic_search(query, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ater/notes/{note_path:path}/versions")
async def get_note_versions(
    note_path: str,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    try:
        from src.domains.ater.academic_db import AcademicDB
        db = AcademicDB(Path(secrets.vault_path))
        versions = db.get_versions(note_path)
        return {"versions": versions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/notes/{note_path:path}/restore")
async def restore_note_version(
    note_path: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    version_id = payload.get("version_id")
    if version_id is None:
        raise HTTPException(status_code=400, detail="version_id is required")
    try:
        from src.domains.ater.academic_db import AcademicDB
        db = AcademicDB(Path(secrets.vault_path))
        version = db.get_version_by_id(version_id)
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        full_path = Path(secrets.vault_path) / note_path
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(version["content"])
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/lesson/compile")
async def compile_lesson_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    note_path = payload.get("note_path")
    variant = payload.get("variant", "deep")
    if not note_path:
        raise HTTPException(status_code=400, detail="note_path is required")
        
    try:
        from src.domains.ater.compiler_service import AterLessonCompiler
        compiler = AterLessonCompiler(secrets.vault_path)
        output_path = compiler.compile_lesson(Path(note_path), variant)
        rel_output = os.path.relpath(output_path, compiler.vault_path)
        return {"success": True, "output_path": rel_output}
    except Exception as e:
        import traceback
        logger.error(f"[Compiler] Error compiling note: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ater/lesson/register")
async def register_ater_lesson_preview_endpoint(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")

    lesson_path_str = payload.get("lesson_path")
    if not lesson_path_str:
        raise HTTPException(status_code=400, detail="lesson_path is required")

    try:
        from src.domains.ater.lesson_preview import register_ater_lesson_preview
        lesson_path = Path(secrets.vault_path) / str(lesson_path_str)
        token = register_ater_lesson_preview(Path(secrets.vault_path), lesson_path)
        return {
            "token": token,
            "preview_url": str(request.url_for("ater_lesson_preview", token=token)),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ater/lesson/preview/{token}", name="ater_lesson_preview")
async def ater_lesson_preview(token: str):
    from src.domains.ater.lesson_preview import get_ater_lesson_preview

    _, requested = get_ater_lesson_preview(token)
    return FileResponse(requested, media_type="text/html")

@router.post("/ater/artifact/generate")
async def generate_artifacts_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    note_title = payload.get("note_title")
    note_path_rel = payload.get("note_path")
    if not note_title or not note_path_rel:
        raise HTTPException(status_code=400, detail="note_title and note_path are required")

    # Read frontmatter and content of note
    full_note_path = Path(secrets.vault_path) / note_path_rel
    if not full_note_path.exists():
        raise HTTPException(status_code=404, detail=f"Note file not found: {note_path_rel}")

    try:
        import frontmatter
        post = frontmatter.loads(full_note_path.read_text(encoding="utf-8"))
        from src.domains.ater.artifact_service import ArtifactService
        from src.domains.ai.factory import ModelFactory
        
        # Build LLM client
        provider = secrets.ai_provider or "openai"
        model_name = secrets.ai_model or "gpt-4o-mini"
        api_key = secrets.ai_api_key or "mock-key"
        if not api_key:
            api_key = "mock-key"
        
        llm = ModelFactory.get_model(
            provider=provider,
            model_name=model_name,
            api_key=api_key,
            base_url=secrets.ai_base_url
        )
        
        service = ArtifactService(llm=llm, vault_path=secrets.vault_path)
        pack = await service.generate_artifacts(
            note_title=note_title,
            note_path_rel=note_path_rel,
            frontmatter=post.metadata,
            content=post.content
        )
        return pack
    except Exception as e:
        import traceback
        logger.error(f"[ArtifactRouter] Error generating artifacts: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/artifact/rollback")
async def rollback_artifact_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    note_title = payload.get("note_title")
    note_path_rel = payload.get("note_path")
    target_version = payload.get("target_version")
    if not note_title or not note_path_rel or target_version is None:
        raise HTTPException(status_code=400, detail="note_title, note_path, and target_version are required")

    try:
        from src.domains.ater.artifact_service import ArtifactService
        service = ArtifactService(vault_path=secrets.vault_path)
        pack = service.rollback_version(
            note_title=note_title,
            note_path_rel=note_path_rel,
            target_version=int(target_version)
        )
        return pack
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/artifact/pin")
async def pin_artifact_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    note_title = payload.get("note_title")
    note_path_rel = payload.get("note_path")
    pinned_types = payload.get("pinned_artifact_types")
    if not note_title or not note_path_rel or pinned_types is None:
        raise HTTPException(status_code=400, detail="note_title, note_path, and pinned_artifact_types are required")

    try:
        from src.domains.ater.artifact_service import ArtifactService
        service = ArtifactService(vault_path=secrets.vault_path)
        pack = service.pin_artifact_types(
            note_title=note_title,
            note_path_rel=note_path_rel,
            pinned_types=list(pinned_types)
        )
        return pack
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/tutor/start")
async def start_tutor_session_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    session_id = payload.get("session_id")
    hub_path = payload.get("hub_path")
    if not session_id or not hub_path:
        raise HTTPException(status_code=400, detail="session_id and hub_path are required")

    try:
        from src.domains.ater.tutor_service import TutorSessionManager
        from src.domains.ater.service import AterService
        db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
        
        ai_service = AterService(secrets)
        manager = TutorSessionManager(db_path, Path(secrets.vault_path), ai_service)
        session = manager.start_session(session_id, hub_path)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/tutor/submit")
async def submit_tutor_answer_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    session_id = payload.get("session_id")
    question_id = payload.get("question_id")
    is_correct = payload.get("is_correct")
    wager = payload.get("wager")
    user_answer = payload.get("user_answer", "")
    
    if not session_id or not question_id or is_correct is None or not wager:
        raise HTTPException(status_code=400, detail="session_id, question_id, is_correct, and wager are required")

    try:
        from src.domains.ater.tutor_service import TutorSessionManager
        from src.domains.ater.service import AterService
        db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
        
        ai_service = AterService(secrets)
        manager = TutorSessionManager(db_path, Path(secrets.vault_path), ai_service)
        res = manager.submit_answer(session_id, question_id, bool(is_correct), wager, user_answer)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ater/tutor/status")
async def get_tutor_status_endpoint(
    session_id: str = Query(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    try:
        from src.domains.ater.tutor_service import TutorSessionManager
        from src.domains.ater.service import AterService
        db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
        
        ai_service = AterService(secrets)
        manager = TutorSessionManager(db_path, Path(secrets.vault_path), ai_service)
        session = manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/tutor/advance")
async def advance_tutor_session_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
        
    try:
        from src.domains.ater.tutor_service import TutorSessionManager
        from src.domains.ater.service import AterService
        db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
        
        ai_service = AterService(secrets)
        manager = TutorSessionManager(db_path, Path(secrets.vault_path), ai_service)
        session = manager.advance_note(session_id)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/cram/start")
async def start_cram_session_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    session_id = payload.get("session_id")
    topic = payload.get("topic")
    if not session_id or not topic:
        raise HTTPException(status_code=400, detail="session_id and topic are required")
    # Stub implementation for now
    return {"session_id": session_id, "topic": topic, "status": "started"}

@router.get("/ater/cram/status")
async def get_cram_status_endpoint(
    session_id: str = Query(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    return {"session_id": session_id, "status": "active"}

@router.post("/ater/cram/submit")
async def submit_cram_answer_endpoint(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    session_id = payload.get("session_id")
    question_id = payload.get("question_id")
    if not session_id or not question_id:
        raise HTTPException(status_code=400, detail="session_id and question_id are required")
    return {"status": "submitted", "question_id": question_id}

@router.post("/ater/source/upload")
async def upload_source_file(
    file: UploadFile = File(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    
    suffix = Path(file.filename).suffix
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    
    try:
        from src.domains.ater.source_service import SourceIngestionService
        ingestor = SourceIngestionService()
        result = ingestor.ingest_pdf(tmp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

@router.post("/ater/source/plan")
async def ater_source_plan(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path or not secrets.ai_key:
        raise HTTPException(status_code=400, detail="Vault Path and AI Key are required")
    
    prompt = payload.get("prompt")
    sources = payload.get("sources", [])
    learning_mode = payload.get("learning_mode", "self-study")
    
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
        
    try:
        from src.domains.ater.source_service import SourceGroundedPlanner, SourceWeaknessDetector
        planner = SourceGroundedPlanner(secrets)
        curriculum = await planner.generate_grounded_curriculum(prompt, sources, learning_mode)
        
        detector = SourceWeaknessDetector(secrets)
        warnings = await detector.analyze_coverage(curriculum, sources)
        
        return {
            "curriculum": curriculum.model_dump(),
            "warnings": [w.model_dump() for w in warnings]
        }
    except Exception as e:
        error_details = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Source grounded planning failed: {str(e)}\n\nTraceback:\n{error_details}")

@router.post("/ater/source/augment")
async def ater_source_augment(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    concept = payload.get("concept")
    if not concept:
        raise HTTPException(status_code=400, detail="concept is required")
        
    try:
        from src.domains.ater.source_service import SearchAugmentationEngine
        engine = SearchAugmentationEngine()
        results = engine.search_query(concept)
        augmented_context = engine.augment_context(concept, results)
        
        sources_list = []
        for r in results:
            sources_list.append({
                "file": f"Web Search: {r['title']}",
                "url": r["url"]
            })
            
        return {
            "concept": concept,
            "augmented_context": augmented_context,
            "sources": sources_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ater/playground/sql/evaluate")
async def evaluate_playground_sql(
    payload: Dict[str, Any] = Body(...)
):
    playground = payload.get("playground", {})
    query = payload.get("query", "")
    
    schema_ddl = playground.get("schema_ddl", "")
    seed_sql = playground.get("seed_sql", "")
    target_query = playground.get("target_query", "")
    
    from src.domains.ater.artifact_service import evaluate_sql_query
    res = evaluate_sql_query(schema_ddl, seed_sql, target_query, query)
    return res

@router.post("/ater/playground/case/evaluate")
async def evaluate_playground_case(
    payload: Dict[str, Any] = Body(...)
):
    stages = payload.get("stages", {})
    current_stage = payload.get("current_stage", "")
    choice_index = payload.get("choice_index", 0)
    current_metrics = payload.get("current_metrics", {})
    success_conditions = payload.get("success_conditions", {})
    
    from src.domains.ater.artifact_service import evaluate_case_step
    res = evaluate_case_step(stages, current_stage, choice_index, current_metrics, success_conditions)
    return res

@router.get("/ater/learner/profile")
async def get_learner_profile_endpoint(
    topic: str = Query(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    try:
        from src.domains.ater.learner_model_service import LearnerModelManager
        db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
        manager = LearnerModelManager(db_path, Path(secrets.vault_path))
        profile = manager.update_profile(topic)
        if not profile:
            raise HTTPException(status_code=404, detail=f"Topic profile for '{topic}' not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ater/learner/recommendations")
async def get_learner_recommendations_endpoint(
    topic: str = Query(...),
    limit: int = Query(5),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    try:
        from src.domains.ater.learner_model_service import LearnerModelManager
        db_path = Path(secrets.inbox_path or (Path(secrets.vault_path) / "Inbox")) / "ater_queue.db"
        manager = LearnerModelManager(db_path, Path(secrets.vault_path))
        recommendations = manager.recommend_next_lessons(topic, limit=limit)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



