import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.domains.teacher.router import router


def _sse_events(text: str):
    events = []
    for block in text.split("\n\n"):
        block = block.strip()
        if not block.startswith("data: "):
            continue
        events.append(json.loads(block.removeprefix("data: ")))
    return events


def test_lesson_preview_url_does_not_require_vault_header(tmp_path: Path):
    app = FastAPI()
    app.include_router(router, prefix="/api")
    client = TestClient(app)

    response = client.post(
        "/api/teacher/chat",
        headers={"X-Vault-Path": str(tmp_path)},
        json={"history": [{"role": "user", "content": "Teach me recursion"}]},
    )

    assert response.status_code == 200
    created = next(event for event in _sse_events(response.text) if event["type"] == "lesson_created")
    preview_url = created["preview_url"]
    assert "/api/teacher/lesson/" in preview_url

    preview = client.get(preview_url)
    assert preview.status_code == 200
    assert "text/html" in preview.headers["content-type"]
    assert "Recursion" in preview.text
