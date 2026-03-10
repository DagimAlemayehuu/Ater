"""
OKA Router - FastAPI endpoints for the OKA Knowledge Architect engine.
All endpoints are prefixed with /api/oka/.
"""

import os
import shutil
import json

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.oka.database import get_db
from src.domains.oka.models import OkaSettings, JobQueue
from src.domains.oka.gemini_service import upload_document, generate_plan, chat_with_gemini
from src.domains.oka.vault_service import is_valid_vault, parse_hub_structure, deploy_notes_to_vault

from src.domains.oka.vault_utils import VaultUtils


router = APIRouter(prefix="/oka", tags=["OKA"])


# ─── Request/Response Models ───────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    file_uri: str | None = None

class IngestPathRequest(BaseModel):
    path: str

class PlanRequest(BaseModel):
    file_uri: str

class GenerateRequest(BaseModel):
    file_uri: str
    unit_context: str
    batch_id: int = 1
    batch_notes: list[str] | None = None
    metadata: dict | None = None

class GenerateResponse(BaseModel):
    job_id: int
    status: str

class NoteItem(BaseModel):
    title: str
    content: str
    type: str

class DeployRequest(BaseModel):
    notes: list[NoteItem]
    vault_path: str

class SettingsUpdate(BaseModel):
    vault_path: str | None = None
    google_api_key: str | None = None
    selected_model: str | None = None
    system_instruction_part_a: str | None = None
    system_instruction_part_b: str | None = None


# ─── Chat ───────────────────────────────────────────────────────

@router.post("/chat")
async def chat_interaction(
    req: ChatRequest, 
    db: AsyncSession = Depends(get_db),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    settings_result = await db.execute(select(OkaSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    api_key = secrets.gemini_key or (settings.google_api_key if settings else None)

    if not api_key:
        raise HTTPException(status_code=400, detail="Google API Key not configured in headers or OKA Settings")

    try:
        response = await chat_with_gemini(
            messages=[m.model_dump() for m in req.messages],
            file_uri=req.file_uri,
            api_key=api_key,
            model_name=secrets.gemini_model or (settings.selected_model if settings else "gemini-2.5-flash"),
            sys_prompt_a=settings.system_instruction_part_a if settings else "",
            sys_prompt_b=settings.system_instruction_part_b if settings else "",
        )
        return {"response": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─── Ingestion ──────────────────────────────────────────────────

@router.post("/ingest-resource")
async def ingest_resource(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    settings_result = await db.execute(select(OkaSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    api_key = secrets.gemini_key or (settings.google_api_key if settings else None)

    if not api_key:
        raise HTTPException(status_code=400, detail="Google API Key not configured in headers or OKA Settings")

    try:
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_uri = await upload_document(temp_path, api_key)
        os.remove(temp_path)

        return {"file_uri": file_uri}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest-local-path")
async def ingest_local_path(
    req: IngestPathRequest, 
    db: AsyncSession = Depends(get_db),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    settings_result = await db.execute(select(OkaSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    api_key = secrets.gemini_key or (settings.google_api_key if settings else None)

    if not api_key:
        raise HTTPException(status_code=400, detail="Central Gemini API Key not found in headers or OKA Settings")

    if not os.path.exists(req.path):
        raise HTTPException(status_code=404, detail="Local file not found")
    
    try:
        uri = await upload_document(req.path, api_key)
        return {"file_uri": uri}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Plan Generation ───────────────────────────────────────────

@router.post("/generate-plan")
async def get_plan(
    req: PlanRequest, 
    db: AsyncSession = Depends(get_db),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    settings_result = await db.execute(select(OkaSettings).limit(1))
    settings = settings_result.scalar_one_or_none()

    api_key = secrets.gemini_key or (settings.google_api_key if settings else None)

    if not api_key:
        raise HTTPException(status_code=400, detail="Google API Key not configured in headers or OKA Settings")

    try:
        plan = await generate_plan(
            file_uri=req.file_uri,
            api_key=api_key,
            model_name=secrets.gemini_model or (settings.selected_model if settings else "gemini-2.5-flash"),
            sys_prompt_a=settings.system_instruction_part_a if settings else "",
            sys_prompt_b=settings.system_instruction_part_b if settings else "",
        )
        
        # 1. Canonicalize Unit/Course Metadata
        plan["unit_name"] = VaultUtils.get_canonical_title(plan.get("unit_name", ""))
        plan["course_name"] = VaultUtils.get_canonical_title(plan.get("course_name", ""))
        plan["year"] = VaultUtils.get_canonical_title(plan.get("year", ""))
        plan["semester"] = VaultUtils.get_canonical_title(plan.get("semester", ""))

        # 2. Canonicalize Note Titles
        for batch in plan.get("batches", []):
            for note in batch.get("notes", []):
                note["title"] = VaultUtils.get_canonical_title(note.get("title", ""))

        return plan
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# ─── Batch Generation ──────────────────────────────────────────

@router.post("/generate-batch", response_model=GenerateResponse)
async def generate_batch(req: GenerateRequest, db: AsyncSession = Depends(get_db)):
    job = JobQueue(
        file_uri=req.file_uri,
        unit_name=req.unit_context,
        batch_id=req.batch_id,
        batch_notes=",".join(req.batch_notes) if req.batch_notes else None,
        metadata_json=json.dumps(req.metadata) if req.metadata else None,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    return GenerateResponse(job_id=job.id, status="pending")


@router.get("/generate-status/{job_id}")
async def get_generate_status(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobQueue).where(JobQueue.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"status": job.status}


@router.get("/generate-results/{job_id}")
async def get_generate_results(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobQueue).where(JobQueue.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")

    return {"notes": json.loads(job.result_json) if job.result_json else []}


# ─── Vault Operations ──────────────────────────────────────────

@router.get("/hub-structure")
async def hub_structure(hub_file_path: str):
    try:
        structure = parse_hub_structure(hub_file_path)
        return structure
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deploy-batch")
async def deploy_batch(req: DeployRequest):
    try:
        deploy_notes_to_vault([n.model_dump() for n in req.notes], req.vault_path)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validate-path")
async def validate_path(vault_path: str):
    return {"is_valid": is_valid_vault(vault_path)}


# ─── Settings ──────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    result = await db.execute(select(OkaSettings).limit(1))
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = OkaSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    # Lazy synchronization: If headers provide a key/model/vault, 
    # ensure the database reflects it for background worker consistency.
    needs_commit = False
    if secrets.gemini_key and settings.google_api_key != secrets.gemini_key:
        settings.google_api_key = secrets.gemini_key
        needs_commit = True
    if secrets.gemini_model and settings.selected_model != secrets.gemini_model:
        settings.selected_model = secrets.gemini_model
        needs_commit = True
    if secrets.vault_path and settings.vault_path != secrets.vault_path:
        settings.vault_path = secrets.vault_path
        needs_commit = True
    
    if needs_commit:
        await db.commit()
        await db.refresh(settings)

    return settings


@router.patch("/settings")
async def update_settings(req: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OkaSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = OkaSettings()
        db.add(settings)

    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings


@router.post("/test-api")
async def test_api(req: dict):
    api_key = req.get("api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key required")

    import google.generativeai as genai
    try:
        genai.configure(api_key=api_key)
        genai.list_models()
        return {"status": "success", "message": "API Key is valid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid API Key: {str(e)}")
