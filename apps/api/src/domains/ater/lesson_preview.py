import secrets as token_secrets
from pathlib import Path
from typing import Dict, Tuple

from fastapi import HTTPException

_lesson_preview_registry: Dict[str, Tuple[Path, Path]] = {}


def register_ater_lesson_preview(vault_path: Path, lesson_path: Path) -> str:
    resolved_vault = vault_path.resolve()
    resolved_lesson = lesson_path.resolve()
    allowed_root = (resolved_vault / "database").resolve()

    try:
        resolved_lesson.relative_to(allowed_root)
    except ValueError:
        raise HTTPException(status_code=403, detail="Ater lesson previews are restricted to database lessons")

    if resolved_lesson.suffix.lower() != ".html":
        raise HTTPException(status_code=400, detail="Ater lesson preview must be an HTML file")

    token = token_secrets.token_urlsafe(24)
    _lesson_preview_registry[token] = (resolved_vault, resolved_lesson)
    return token


def get_ater_lesson_preview(token: str) -> Tuple[Path, Path]:
    registered = _lesson_preview_registry.get(token)
    if not registered:
        raise HTTPException(status_code=404, detail="Ater lesson preview expired or not found")

    vault_path, requested = registered
    allowed_root = (vault_path / "database").resolve()
    try:
        requested.resolve().relative_to(allowed_root)
    except ValueError:
        raise HTTPException(status_code=403, detail="Ater lesson previews are restricted to database lessons")

    if not requested.exists() or requested.suffix.lower() != ".html":
        raise HTTPException(status_code=404, detail="Lesson not found")

    return vault_path, requested
