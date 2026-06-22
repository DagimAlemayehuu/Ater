import json
import secrets as token_secrets
from pathlib import Path
from typing import Any, Dict, Tuple

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.teacher.service import TeacherService

router = APIRouter(prefix="/teacher", tags=["Teacher"])

_lesson_preview_registry: Dict[str, Tuple[Path, Path]] = {}


def _register_lesson_preview(vault_path: Path, lesson_path: Path) -> str:
    resolved_vault = vault_path.resolve()
    resolved_lesson = lesson_path.resolve()
    lessons_root = (resolved_vault / "Lessons").resolve()

    try:
        resolved_lesson.relative_to(lessons_root)
    except ValueError:
        raise HTTPException(status_code=403, detail="Teacher previews are restricted to the Lessons directory")

    token = token_secrets.token_urlsafe(24)
    _lesson_preview_registry[token] = (resolved_vault, resolved_lesson)
    return token


@router.post("/chat")
async def teacher_chat(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets),
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")

    history = payload.get("history", [])
    service = TeacherService(Path(secrets.vault_path))

    async def sse_generator():
        try:
            async for event in service.chat(history=history, secrets=secrets):
                if event.get("type") == "lesson_created":
                    token = _register_lesson_preview(Path(secrets.vault_path), Path(event["absolute_lesson_path"]))
                    event = {
                        **event,
                        "preview_url": str(request.url_for("teacher_lesson", token=token)),
                    }
                    event.pop("absolute_lesson_path", None)
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@router.get("/lesson/{token}")
async def teacher_lesson(
    token: str,
):
    registered = _lesson_preview_registry.get(token)
    if not registered:
        raise HTTPException(status_code=404, detail="Lesson preview expired or not found")

    vault_path, requested = registered
    lessons_root = (vault_path / "Lessons").resolve()
    try:
        requested.relative_to(lessons_root)
    except ValueError:
        raise HTTPException(status_code=403, detail="Teacher previews are restricted to the Lessons directory")

    if not requested.exists() or requested.suffix.lower() != ".html":
        raise HTTPException(status_code=404, detail="Lesson not found")

    return FileResponse(requested, media_type="text/html")
