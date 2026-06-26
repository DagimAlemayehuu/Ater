import os
import uuid
import tempfile
import shutil
import asyncio
import logging
import mimetypes
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Body, Depends, BackgroundTasks, Query
from fastapi.responses import FileResponse

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.notebooklm.runner import NotebookLMRunner, NotebookLMException

logger = logging.getLogger("Ater.NotebookLM.API")
router = APIRouter(prefix="/notebooklm", tags=["NotebookLM"])

DOWNLOAD_EXTENSIONS = {
    "audio": "m4a",
    "video": "mp4",
    "report": "md",
    "quiz": "json",
    "flashcards": "json",
    "infographic": "png",
    "mindmap": "json",
    "mind_map": "json",
    "slides": "pdf",
    "slide_deck": "pdf",
    "data_table": "csv",
    "data-table": "csv",
}

FORMAT_EXTENSIONS = {
    "pdf": "pdf",
    "pptx": "pptx",
    "json": "json",
    "markdown": "md",
    "html": "html",
}


def get_notebooklm_artifact_dir() -> Path:
    path = Path.home() / ".ater" / "notebooklm-artifacts"
    path.mkdir(parents=True, exist_ok=True)
    return path


def safe_artifact_filename(notebook_id: str, artifact_type: str, artifact_id: Optional[str], output_format: Optional[str]) -> str:
    raw = f"{notebook_id[:8]}_{artifact_type}_{(artifact_id or 'latest')[:12]}"
    stem = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in raw)
    ext = FORMAT_EXTENSIONS.get(str(output_format or "").lower()) or DOWNLOAD_EXTENSIONS.get(artifact_type, "bin")
    return f"{stem}.{ext}"

# ── SQLite Database Sync Helpers ─────────────────────────────

def sync_artifact_to_db(db_path: Path, notebook_id: str, artifact_type: str, title: str, data_json: str):
    import sqlite3
    from datetime import datetime
    
    conn = sqlite3.connect(str(db_path))
    try:
        artifact_id = str(uuid.uuid4())
        table_name = "notebooklm_quizzes" if artifact_type == "quiz" else "notebooklm_flashcards"
        
        conn.execute(
            f"INSERT OR REPLACE INTO {table_name} (id, notebook_id, title, data, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                artifact_id,
                notebook_id,
                title,
                data_json,
                datetime.now().isoformat()
            )
        )
        conn.commit()
        logger.info(f"[NotebookLM Sync] Successfully saved {artifact_type} '{title}' in SQLite.")
        return artifact_id
    except Exception as e:
        logger.error(f"[NotebookLM Sync] Database sync failed: {e}")
        raise e
    finally:
        conn.close()

async def poll_and_sync_studio_artifact(inbox_path: str, notebook_id: str, artifact_type: str, title: str):
    logger.info(f"[Sync Worker] Starting background sync worker for {artifact_type} in {notebook_id}...")
    max_attempts = 30
    poll_interval = 10
    
    for attempt in range(max_attempts):
        await asyncio.sleep(poll_interval)
        try:
            status_res = await NotebookLMRunner.run_command(["studio", "status", notebook_id, "--json"], parse_json=True)
            matching_artifacts = [a for a in status_res if a.get("artifact_type") == artifact_type]
            if not matching_artifacts:
                continue
                
            latest = matching_artifacts[0]
            status = latest.get("status")
            
            if status == "completed":
                artifact_id = latest.get("artifact_id")
                file_name = f"notebooklm_{artifact_type}_{notebook_id[:8]}_{artifact_id[:8]}.json"
                output_path = str(Path(inbox_path) / file_name)
                
                download_args = NotebookLMRunner.build_download_args(
                    artifact_type,
                    notebook_id,
                    Path(output_path),
                    artifact_id=artifact_id,
                    output_format="json",
                )
                await NotebookLMRunner.run_command(download_args)
                logger.info(f"[Sync Worker] Downloaded {artifact_type} to {output_path}")
                
                with open(output_path, "r", encoding="utf-8") as f:
                    data_json = f.read()
                    
                db_path = Path(inbox_path) / "ater_queue.db"
                sync_artifact_to_db(db_path, notebook_id, artifact_type, title, data_json)
                
                if os.path.exists(output_path):
                    os.remove(output_path)
                break
                
            elif status == "failed":
                logger.error(f"[Sync Worker] Artifact generation failed in NotebookLM: {latest}")
                break
        except Exception as e:
            logger.error(f"[Sync Worker] Error during background polling/sync: {e}")


# ── Auth Endpoints ──────────────────────────────────────────

@router.post("/auth/login")
async def start_auth_login(
    force: bool = Query(True, description="Force the browser login flow even when cached credentials are valid."),
    clear: bool = Query(False, description="Clear the managed browser profile before login to switch accounts."),
):
    """Triggers the browser login process."""
    try:
        msg = await NotebookLMRunner.start_login(force=force, clear=clear)
        return {"success": True, "message": msg, "force": force, "clear": clear}
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/status")
async def check_auth_status(force: bool = Query(False, description="Bypass the short-lived auth status cache.")):
    """Checks and returns the current authentication status and email."""
    status = await NotebookLMRunner.get_auth_status(force=force)
    return status


# ── Notebook Management ─────────────────────────────────────

@router.get("/notebooks")
async def list_notebooks():
    """Retrieves all notebooks."""
    try:
        res = await NotebookLMRunner.run_command(["notebook", "list", "--json"], parse_json=True)
        return res
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notebooks")
async def create_notebook(payload: Dict[str, str] = Body(...)):
    """Creates a new notebook."""
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    try:
        res = await NotebookLMRunner.run_command(["notebook", "create", title, "--json"], parse_json=True)
        return res
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str):
    """Deletes a notebook."""
    try:
        res = await NotebookLMRunner.run_command(["notebook", "delete", notebook_id, "--confirm"])
        return {"success": True, "output": res}
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/notebooks/{notebook_id}")
async def rename_notebook(notebook_id: str, payload: Dict[str, str] = Body(...)):
    """Renames a notebook."""
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    try:
        res = await NotebookLMRunner.run_command(["notebook", "rename", notebook_id, title])
        return {"success": True, "output": res}
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Source Management ───────────────────────────────────────

@router.get("/notebooks/{notebook_id}/sources")
async def list_sources(notebook_id: str):
    """Lists all sources inside a notebook."""
    try:
        res = await NotebookLMRunner.run_command(["source", "list", notebook_id, "--json"], parse_json=True)
        return res
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notebooks/{notebook_id}/sources")
async def add_source(notebook_id: str, payload: Dict[str, Any] = Body(...)):
    """Adds a web URL or pasted text source."""
    source_type = payload.get("source_type")
    if source_type == "url":
        url = payload.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required for type=url")
        try:
            res = await NotebookLMRunner.run_command(["source", "add", notebook_id, "--url", url])
            return {"success": True, "output": res}
        except NotebookLMException as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    elif source_type == "text":
        text = payload.get("text")
        title = payload.get("title", "Pasted Text Source")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required for type=text")
        try:
            res = await NotebookLMRunner.run_command(["source", "add", notebook_id, "--text", text, "--title", title])
            return {"success": True, "output": res}
        except NotebookLMException as e:
            raise HTTPException(status_code=500, detail=str(e))

    elif source_type == "drive":
        document_id = payload.get("document_id") or payload.get("drive_id")
        doc_type = payload.get("doc_type") or payload.get("type")
        if not document_id:
            raise HTTPException(status_code=400, detail="document_id is required for type=drive")
        try:
            args = ["source", "add", notebook_id, "--drive", document_id]
            if doc_type:
                args += ["--type", doc_type]
            res = await NotebookLMRunner.run_command(args)
            return {"success": True, "output": res}
        except NotebookLMException as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    else:
        raise HTTPException(status_code=400, detail="Invalid source_type. Supported: url, text, drive")

@router.post("/notebooks/{notebook_id}/sources/file")
async def add_file_source(notebook_id: str, file: UploadFile = File(...)):
    """Uploads a local file as a source."""
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        res = await NotebookLMRunner.run_command(["source", "add", notebook_id, "--file", temp_path, "--wait"])
        return {"success": True, "output": res}
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        shutil.rmtree(temp_dir)

@router.delete("/notebooks/{notebook_id}/sources/{source_id}")
async def delete_source(notebook_id: str, source_id: str):
    """Deletes a source from a notebook."""
    try:
        res = await NotebookLMRunner.run_command(["source", "delete", source_id, "--confirm"])
        return {"success": True, "output": res}
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Studio Artifact Generation & Local Sync ──────────────────

@router.post("/notebooks/{notebook_id}/studio")
async def create_studio_artifact(
    notebook_id: str, 
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Triggers generation of a studio artifact and schedules local sync for quizzes/flashcards."""
    artifact_type = payload.get("artifact_type")
    if not artifact_type:
        raise HTTPException(status_code=400, detail="artifact_type is required")

    try:
        args = NotebookLMRunner.build_studio_create_args(notebook_id, payload)
        res = await NotebookLMRunner.run_command(args)
        
        # Auto-schedule local SQLite database sync if artifact is a study quiz or flashcards
        if artifact_type in ("quiz", "flashcards") and secrets.inbox_path:
            title = payload.get("title", f"NotebookLM Generated {artifact_type.capitalize()}")
            background_tasks.add_task(
                poll_and_sync_studio_artifact,
                secrets.inbox_path,
                notebook_id,
                artifact_type,
                title
            )
            
            return {"success": True, "output": res}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notebooks/{notebook_id}/studio/status")
async def get_studio_status(notebook_id: str):
    """Retrieves generation status for all studio artifacts."""
    try:
        res = await NotebookLMRunner.run_command(["studio", "status", notebook_id, "--json"], parse_json=True)
        return res
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notebooks/{notebook_id}/studio/download")
async def download_studio_artifact(
    notebook_id: str,
    artifact_type: str = Query(...),
    artifact_id: Optional[str] = Query(None),
    output_format: Optional[str] = Query(None),
):
    """Downloads a Studio artifact and streams it back to Ater."""
    canonical_type = NotebookLMRunner.normalize_artifact_type(artifact_type)
    filename = safe_artifact_filename(notebook_id, canonical_type, artifact_id, output_format)
    output_path = get_notebooklm_artifact_dir() / filename
    try:
        args = NotebookLMRunner.build_download_args(
            canonical_type,
            notebook_id,
            output_path,
            artifact_id=artifact_id,
            output_format=output_format,
        )
        await NotebookLMRunner.run_command(args)
        media_type = mimetypes.guess_type(str(output_path))[0] or "application/octet-stream"
        return FileResponse(
            output_path,
            media_type=media_type,
            filename=filename,
            headers={"X-Ater-Artifact-Path": str(output_path)},
        )
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Query & Q&A ─────────────────────────────────────────────

@router.post("/notebooks/{notebook_id}/query")
async def query_notebook(notebook_id: str, payload: Dict[str, Any] = Body(...)):
    """Asks a question to the notebook sources."""
    query = payload.get("query")
    conv_id = payload.get("conversation_id")
    if not query:
        raise HTTPException(status_code=400, detail="query is required")
        
    args = ["notebook", "query", notebook_id, query]
    if conv_id:
        args += ["--conversation-id", conv_id]
    args += ["--json"]
    
    try:
        res = await NotebookLMRunner.run_command(args, parse_json=True)
        return res
    except NotebookLMException as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Saved Practice Hubs (Retrieval from SQLite) ─────────────

@router.get("/notebooks/{notebook_id}/quizzes")
async def get_saved_quizzes(notebook_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns all saved quizzes for this notebook in the SQLite database."""
    if not secrets.inbox_path:
        return []
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
        return []
        
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.execute(
            "SELECT id, title, data, created_at FROM notebooklm_quizzes WHERE notebook_id = ? ORDER BY created_at DESC",
            (notebook_id,)
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@router.get("/notebooks/{notebook_id}/flashcards")
async def get_saved_flashcards(notebook_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Returns all saved flashcards for this notebook in the SQLite database."""
    if not secrets.inbox_path:
        return []
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
        return []
        
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.execute(
            "SELECT id, title, data, created_at FROM notebooklm_flashcards WHERE notebook_id = ? ORDER BY created_at DESC",
            (notebook_id,)
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@router.post("/notebooks/{notebook_id}/sync-local")
async def trigger_manual_sync(
    notebook_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Manually parses and syncs a downloaded JSON file to local SQLite."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    file_path = payload.get("file_path")
    artifact_type = payload.get("artifact_type")
    title = payload.get("title", f"Manual Ingest {artifact_type.capitalize()}")
    
    if not file_path or not artifact_type:
        raise HTTPException(status_code=400, detail="file_path and artifact_type are required")
    if artifact_type not in ("quiz", "flashcards"):
        raise HTTPException(status_code=400, detail="Supported artifact_types: quiz, flashcards")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data_json = f.read()
        db_path = Path(secrets.inbox_path) / "ater_queue.db"
        artifact_id = sync_artifact_to_db(db_path, notebook_id, artifact_type, title, data_json)
        return {"success": True, "id": artifact_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/quizzes/{quiz_id}")
async def delete_saved_quiz(quiz_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Deletes a saved quiz from SQLite."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
        raise HTTPException(status_code=404, detail="Database not found")
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    try:
        conn.execute("DELETE FROM notebooklm_quizzes WHERE id = ?", (quiz_id,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()

@router.delete("/flashcards/{card_id}")
async def delete_saved_flashcards(card_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Deletes saved flashcards from SQLite."""
    if not secrets.inbox_path:
        raise HTTPException(status_code=400, detail="Inbox Path not configured")
    db_path = Path(secrets.inbox_path) / "ater_queue.db"
    if not db_path.exists():
        raise HTTPException(status_code=404, detail="Database not found")
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    try:
        conn.execute("DELETE FROM notebooklm_flashcards WHERE id = ?", (card_id,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()
